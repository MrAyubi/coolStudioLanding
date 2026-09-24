const images = document.querySelectorAll('.player-select__image');

import hoverSound from 'url:../sounds/playerSelect.mp3';

const sound = new Audio(hoverSound);

function playSound() {
  sound.currentTime = 0;
  sound.play().catch(() => { });
}

images.forEach((img) => {

  // Desktop
  img.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') {
      playSound();
    }
  });

  // Mobile
  img.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      playSound();
    }
  });

});