import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swiper from 'swiper'
import "./injector.js"
import "./coolThings"
import "./stackedServices.js"
import "./image-snake.js"

gsap.registerPlugin(ScrollTrigger);
const bar = document.querySelector(".loading__bar--inner")
const barNumber = document.querySelector(".loading__counter--number")
let c = 0;

let barInterval = setInterval(() => {
    bar.style.width = c + "%";
    barNumber.innerText = c + "%"
    c++;

    if (c===101){
        clearInterval(barInterval)
        gsap.to('.loading__bar', {
            duration: 7,
            rotate: '400deg',
            left: '1000%'
        })
        gsap.to('.loading__counter, .loading__text--boarder', {
            duration: 1,
            opacity: 0
        })
        gsap.to('.loading__text',{
            duration: 1,
            scale: '3',
            translateY: '-50%',
            top: '50%'
        })
        gsap.to('.loading__box',{
            duration: 1,
            height: '500px',
            borderRadius: '50%'
        })
        gsap.to('.loading',{
            delay: 2,
            duration: 2,
            zIndex: 0,
            opacity: 0
        })
        
    }
}, 30);
 
var swiper = new Swiper(".swiper", {
    loop: true,
    slidesPerView: 3,
    spaceBetween: 30,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    
  });

// Hero title ScrollTrigger animation
// const heroTitleTexts = document.querySelectorAll('.hero-title p');

// if (heroTitleTexts.length > 0) {
//     // Create timeline for sequential text animations
//     const tl = gsap.timeline({
//         scrollTrigger: {
//             trigger: ".landing",
//             start: "top top",
//             end: "+=400%",
//             scrub: 1,
//             pin: ".landing",
//             pinSpacing: true,
//             toggleActions: "none none none none",
//             anticipatePin: 1
//         }
//     });

//     // Animate each text sequentially
//     heroTitleTexts.forEach((text, index) => {
//         // Fade in
//         tl.to(text, {
//             opacity: 1,
//             duration: 1,
//         });

//         // Hold
//         tl.to({}, { duration: 0.5 });

//         // Fade out (except for the last one)
//         // if (index < heroTitleTexts.length - 1) {
//         //     tl.to(text, {
//         //         opacity: 0,
//         //         duration: 1,
//         //     });
//         // }
//     });
// }
