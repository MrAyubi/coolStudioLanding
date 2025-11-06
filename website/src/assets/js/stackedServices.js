import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {

  // 🟣 HERO SECTION
  const heroTitleTexts = document.querySelectorAll(".hero-title p");

  if (heroTitleTexts.length > 0) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".landing",
        start: "top top",
        end: "+=200%",
        scrub: 1,
        pin: ".landing",
        anticipatePin: 1,
        invalidateOnRefresh: true,
        pinSpacing: true,
      },
    });

    heroTitleTexts.forEach((text) => {
      tl.to(text, { opacity: 1, duration: 1 });
      tl.to({}, { duration: 0.5 });
    });
  }


  const services_card = document.querySelectorAll(".service-card__description");


  const tl_2 = gsap.timeline({
    scrollTrigger: {
      trigger: ".stacked-services__header",
      start: "top top",
      end: "+=120%",
      scrub: 1,
      pin: ".stacked-services",
      anticipatePin: 1,
      invalidateOnRefresh: true,
      pinSpacing: true,
    },
  });

  services_card.forEach((service) => {
    tl_2.to(service, { height: 'auto' });
    tl_2.to({}, { duration: .5 });
    tl_2.to(service, { height: 0 });

  });
});
