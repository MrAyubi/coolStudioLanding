import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./injector.js";
import "./coolThings";
import "./image-snake.js";
import "./blackBox.js";
import "./glowNoise.js";
import "./clients.js";
import "./studioStory.js";
import "./offerSplit.js";
import "./loader.js";

import { initStackedServices } from "./stackedServices.js";
import { initArtStrategyMorph } from "./gsapTut.js";
import { initVideoManager } from "./videoManager.js";

gsap.registerPlugin(ScrollTrigger);

initVideoManager();


// =============================================
// 🔵 SCROLLTRIGGER BOOTSTRAP
// =============================================

function whenReady() {
  return Promise.all([
    document.fonts
      ? document.fonts.ready
      : Promise.resolve(),

    new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener(
          "load",
          resolve,
          { once: true }
        );
      }
    }),
  ]);
}


function initAll() {
  initArtStrategyMorph();
  initStackedServices();

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}


whenReady().then(initAll);


// =============================================
// 🔵 CONTACT FORM
// =============================================

document.addEventListener("DOMContentLoaded", () => {

  const tagPills = document.querySelectorAll(".tag-pill");

  tagPills.forEach((pill) => {

    pill.addEventListener("click", function () {

      const group = this.getAttribute("data-group");
      const value = this.getAttribute("data-value");

      document
        .querySelectorAll(
          `.tag-pill[data-group="${group}"]`
        )
        .forEach((p) => {
          p.classList.remove("active");
        });

      this.classList.add("active");

      document.getElementById(
        `${group}Input`
      ).value = value;
    });
  });


  const contactForm =
    document.getElementById("contactForm");


  if (contactForm) {

    contactForm.addEventListener(
      "submit",
      (e) => {

        e.preventDefault();

        const formData = {
          name:
            document.getElementById("name").value,

          email:
            document.getElementById("email").value,

          message:
            document.getElementById("message").value,

          service:
            document.getElementById(
              "serviceInput"
            ).value,

          vibe:
            document.getElementById(
              "vibeInput"
            ).value
        };


        // console.log(
        //   "Form submitted:",
        //   formData
        // );


        alert(
          "Form submitted! Check console for data."
        );
      }
    );
  }
});