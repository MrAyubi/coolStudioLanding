import { snake_images } from "./image";

const sunShineDiv = document.querySelector(".sunshine-container");

let lastSpawnTime = 0;
const spawnInterval = 40;
let imageIndex = 0;
const activeImages = {}; // store current images by index

sunShineDiv.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastSpawnTime < spawnInterval) return;
    lastSpawnTime = now;

    const currentIndex = imageIndex;
    const img = document.createElement("img");
    img.src = snake_images[currentIndex];
    img.classList.add("cursor-trail");

    img.style.width = "180px";
    img.style.height = "280px";

    // Position relative to div
    const rect = sunShineDiv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    // Instantly remove previous image with the same index (no transition)
    if (activeImages[currentIndex]) {
        activeImages[currentIndex].remove();
    }

    sunShineDiv.appendChild(img);

    // Save new image reference
    activeImages[currentIndex] = img;

    // Force Chrome repaint (optional)
    img.getBoundingClientRect();

    // Make sure it's visible instantly
    img.style.opacity = 1;

    // Move to next image index
    imageIndex = (imageIndex + 1) % snake_images.length;
});
