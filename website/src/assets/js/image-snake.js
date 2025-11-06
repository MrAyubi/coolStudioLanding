import { snake_images } from "./image";

const sunShineDiv = document.querySelector(".sun-shine");

let lastSpawnTime = 0;
const spawnInterval = 50;

sunShineDiv.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastSpawnTime < spawnInterval) return;
    lastSpawnTime = now;

    const img = document.createElement("img");
    img.src = snake_images[Math.floor(Math.random() * snake_images.length)];
    img.classList.add("cursor-trail");

    // Set size
    img.style.width = "50px";
    img.style.height = "50px";

    // Position relative to div
    const rect = sunShineDiv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    sunShineDiv.appendChild(img);

    // Force Chrome to repaint
    img.getBoundingClientRect();

    requestAnimationFrame(() => {
        img.style.opacity = 0;
    });

    setTimeout(() => {
        img.remove();
    }, 1500);
});
