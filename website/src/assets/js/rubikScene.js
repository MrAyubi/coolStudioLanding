// =============================================
// RUBIK'S CUBE SCENE: the floor and the cube's faces
// =============================================
//
// rubikScene.scss lays the scene out and spins, tilts and bobs the cube (a CSS 3D box).
// This file draws:
//   - the checkerboard floor, as a flat SVG of tiles projected in perspective here,
//   - the cube's six faces, on <canvas>: 3x3 stickers on a black grid with hand-drawn,
//     slightly wobbly edges and diagonal marker strokes, like rubick.mp4.
// It also pauses the scene's animations while the scene is off screen.
//
// Why not CSS 3D for the floor, or SVG filters for the faces? WebKit (Safari and every
// browser on iPhone) only partly paints a large 3D-rotated plane, so the floor stopped
// short, and it drops SVG filter content on 3D-transformed faces, so faces came out black.

const scene = document.querySelector(".rubik-scene");


// =============================================
// FLOOR
// =============================================
// Same geometry the scene is built on (units are the clip's 1280x720 frame pixels, "u"):
// a horizontal plane 200u below eye level (295u), seen through a 1100u perspective,
// reaching from 733u behind the screen to 700u in front of it, with 132u tiles and a
// light tile centred under the cube. Its far edge lands on 415u, where the sky ends.

const FLOOR = {
    eye: 295,          // eye level
    drop: 200,         // plane below eye level
    perspective: 1100,
    far: -733,         // depth of the far edge (behind the screen)
    near: 700,         // depth of the near edge (in front of the screen)
    halfWidth: 3000,   // plane reaches this far to each side
    tile: 132,
    height: 820,       // the section is 820u tall
    fringe: 2.5,       // VHS colour fringe: red copy shifted right, cyan left
};

function floorSvg() {
    const { eye, drop, perspective: P, far, near, halfWidth, tile, height, fringe } = FLOOR;
    const project = (x, z) => {
        const k = P / (P - z);
        return `${(x * k).toFixed(1)} ${(eye + drop * k).toFixed(1)}`;
    };
    let d = "";
    const cols = Math.ceil(halfWidth / tile);
    for (let j = 0; far + j * tile < near; j++) {
        const z0 = far + j * tile;
        const z1 = Math.min(z0 + tile, near);
        for (let i = -cols; i <= cols; i++) {
            if ((i + j) % 2 !== 0) continue; // light tiles only; dark tiles stay see-through
            const x0 = -tile / 2 + i * tile;
            const x1 = x0 + tile;
            d += `M${project(x0, z0)}L${project(x1, z0)}L${project(x1, z1)}L${project(x0, z1)}Z`;
        }
    }
    const w = halfWidth * 2;
    return `
<svg viewBox="${-w / 2} 0 ${w} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
  <defs><path id="rubik-floor-tiles" d="${d}"/></defs>
  <use href="#rubik-floor-tiles" fill="#ff3b4f" transform="translate(${fringe} 0)"/>
  <use href="#rubik-floor-tiles" fill="#1fc8ff" transform="translate(${-fringe} 0)"/>
  <use href="#rubik-floor-tiles" fill="#ececf0"/>
</svg>`;
}


// =============================================
// CUBE FACES
// =============================================

// Colours picked from rubick.mp4. Each face is one colour with a different centre.
const FACES = {
    front: { color: "#8e2430", center: "#d9d8dc" },  // red, white centre
    right: { color: "#1c4b8f", center: "#e0741c" },  // blue, orange centre
    back: { color: "#c8642a", center: "#e6cf2a" },   // orange, yellow centre
    left: { color: "#2f8a3c", center: "#8a2a2e" },   // green, dark red centre
    top: { color: "#e9c94a", center: "#3f9a45" },    // yellow, green centre
    bottom: { color: "#d9d8dc", center: "#1c4b8f" }, // white, blue centre
};

const SIZE = 300;      // drawing units per face
const CELL = SIZE / 3;
const INSET = 5;       // half the width of the black lines between stickers
const LINE = "#151515";

// Small seeded random generator, so the cube is drawn the same way on every visit.
function random(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// A sticker: a square with uneven, rounded corners and gently wavy, hand-drawn edges.
function stickerPath(col, row, rnd) {
    const j = () => (rnd() - 0.5) * 5;
    const x0 = col * CELL + INSET, y0 = row * CELL + INSET;
    const x1 = (col + 1) * CELL - INSET, y1 = (row + 1) * CELL - INSET;
    const corners = [[x0 + j(), y0 + j()], [x1 + j(), y0 + j()], [x1 + j(), y1 + j()], [x0 + j(), y1 + j()]];
    const r = 7;
    const path = new Path2D();
    corners.forEach((p, i) => {
        const next = corners[(i + 1) % 4];
        const len = Math.hypot(next[0] - p[0], next[1] - p[1]);
        const ux = (next[0] - p[0]) / len, uy = (next[1] - p[1]) / len;
        // along the edge, from just after this corner to just before the next one,
        // with a slow wave across it
        const phase = rnd() * Math.PI * 2, amp = 0.6 + rnd() * 1.1;
        const steps = 8;
        for (let s = 0; s <= steps; s++) {
            const t = r + ((len - 2 * r) * s) / steps;
            const off = Math.sin(phase + (t / len) * Math.PI * 2) * amp * Math.sin((Math.PI * s) / steps);
            const x = p[0] + ux * t - uy * off, y = p[1] + uy * t + ux * off;
            if (i === 0 && s === 0) path.moveTo(x, y); else path.lineTo(x, y);
        }
        // round the next corner
        const after = corners[(i + 2) % 4];
        const l2 = Math.hypot(after[0] - next[0], after[1] - next[1]);
        path.quadraticCurveTo(next[0], next[1],
            next[0] + ((after[0] - next[0]) * r) / l2, next[1] + ((after[1] - next[1]) * r) / l2);
    });
    path.closePath();
    return path;
}

function drawFace(canvas, { color, center }, seed) {
    const rnd = random(seed);
    const ctx = canvas.getContext("2d");
    const k = canvas.width / SIZE;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = LINE;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const all = new Path2D();
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const p = stickerPath(col, row, rnd);
            ctx.fillStyle = row === 1 && col === 1 ? center : color;
            ctx.fill(p);
            all.addPath(p);
        }
    }

    // Marker strokes: many thin, slightly transparent diagonal lines over the colour,
    // some darker and some lighter, clipped to the stickers.
    ctx.save();
    ctx.clip(all);
    ctx.translate(SIZE / 2, SIZE / 2);
    ctx.rotate(((-20 - rnd() * 20) * Math.PI) / 180);
    ctx.lineCap = "round";
    for (let n = 0; n < 260; n++) {
        const dark = rnd() < 0.6;
        ctx.strokeStyle = dark
            ? `rgba(0, 0, 0, ${(0.05 + rnd() * 0.1).toFixed(3)})`
            : `rgba(255, 255, 255, ${(0.04 + rnd() * 0.08).toFixed(3)})`;
        ctx.lineWidth = 1.5 + rnd() * 4;
        const y = (rnd() - 0.5) * SIZE * 1.5;
        const x = (rnd() - 0.5) * SIZE * 1.5;
        const len = 30 + rnd() * 120;
        ctx.beginPath();
        ctx.moveTo(x - len / 2, y);
        ctx.quadraticCurveTo(x, y + (rnd() - 0.5) * 6, x + len / 2, y + (rnd() - 0.5) * 4);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCube(cube) {
    // Canvas pixels per face: the face's on-screen size at this screen's pixel density.
    const px = Math.round(Math.min(768, Math.max(256, cube.offsetWidth * (window.devicePixelRatio || 1) * 1.15)));
    if (cube.dataset.px && Math.abs(px - cube.dataset.px) / px < 0.25) return;
    cube.dataset.px = px;
    cube.querySelectorAll(".rubik-cube__face").forEach((face, i) => {
        let canvas = face.querySelector("canvas");
        if (!canvas) {
            canvas = document.createElement("canvas");
            face.prepend(canvas);
        }
        canvas.width = canvas.height = px;
        drawFace(canvas, FACES[face.dataset.face], 11 + i * 7);
    });
}


// =============================================
// SET UP
// =============================================

if (scene) {
    scene.querySelector(".rubik-scene__floor").innerHTML = floorSvg();

    const cube = scene.querySelector(".rubik-cube");
    drawCube(cube);
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => drawCube(cube), 250);
    });

    // The spin, bob, shading and clouds only run while the scene is on screen.
    new IntersectionObserver(([entry]) => {
        scene.classList.toggle("rubik-scene--paused", !entry.isIntersecting);
    }).observe(scene);
}
