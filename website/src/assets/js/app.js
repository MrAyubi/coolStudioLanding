import gsap from "gsap";
import Swiper from 'swiper'
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
    slidesPerView: 1,
    spaceBetween: 30,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
