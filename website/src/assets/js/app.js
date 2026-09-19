import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swiper from 'swiper'
import "./injector.js"
import "./coolThings"
import "./image-snake.js"
import "./blackBox.js"
import "./glowNoise.js"
import "./clients.js"
import "./studioStory.js"
import "./offerSplit.js"
import "./loader.js"
import { initStackedServices } from "./stackedServices.js";
import { initArtStrategyMorph } from "./gsapTut.js";

gsap.registerPlugin(ScrollTrigger);

// =============================================
// 🔵 SCROLLTRIGGER BOOTSTRAP
// =============================================
// Wait until fonts have swapped in AND every image/video has finished
// loading before creating a single ScrollTrigger. First measurement is
// then already final — no post-hoc "refresh again later" patching needed.
function whenReady() {
  return Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    }),
  ]);
}

function initAll() {
  initArtStrategyMorph();      // layout-changing pin first
  initStackedServices();       // everything below afterward

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

whenReady().then(initAll);

// Contact Form Tag Selection
document.addEventListener('DOMContentLoaded', () => {
  const tagPills = document.querySelectorAll('.tag-pill');

  tagPills.forEach(pill => {
    pill.addEventListener('click', function () {
      const group = this.getAttribute('data-group');
      const value = this.getAttribute('data-value');

      document.querySelectorAll(`.tag-pill[data-group="${group}"]`)
        .forEach(p => p.classList.remove('active'));

      this.classList.add('active');
      document.getElementById(`${group}Input`).value = value;
    });
  });

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
        service: document.getElementById('serviceInput').value,
        vibe: document.getElementById('vibeInput').value
      };

      console.log('Form submitted:', formData);
      alert('Form submitted! Check console for data.');
    });
  }
});