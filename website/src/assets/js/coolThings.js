const images = document.querySelectorAll('.player-select__image'); 
import hoverSound from '../sounds/playerSelect.mp3';

const sound = new Audio(hoverSound);

document.addEventListener('click', () => {
    sound.play().then(() => {
      sound.pause();
      sound.currentTime = 0;
    });
  }, { once: true });
  
  // Play sound on hover
  images.forEach(img => {
    img.addEventListener('mouseenter', () => {
      sound.currentTime = 0;
      sound.play();
    });
  });