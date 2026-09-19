import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initArtStrategyMorph() {
    const section = document.getElementById("data-art-strategy-morph");
    if (!section) return;

    const ghost = section.querySelector("[data-ghost]");
    const sharedEls = section.querySelectorAll("[data-shared]");
    const before = section.querySelector("[data-before]");
    const after = section.querySelector("[data-after]");
    const defArt = section.querySelector("[data-def-art]");
    const defStrat = section.querySelector("[data-def-strategy]");

    let tl;

    function getSettings() {
        const width = window.innerWidth;

        // MOBILE
        if (width <= 767) {
            return {
                start: "top 40%",
                end: "+=30%"
            };
        }

        // TABLET
        if (width <= 1024) {
            return {
                start: "top 65%",
                end: "+=50%"
            };
        }

        // DESKTOP
        return {
            start: "top 55%",
            end: "+=20%"
        };
    }

    function build() {
        if (tl) {
            tl.kill();
            tl = null;
        }

        gsap.set(sharedEls, {
            clearProps: "transform"
        });

        const ghostMap = {};

        ghost.querySelectorAll("[data-ghost-letter]").forEach((el) => {
            ghostMap[el.dataset.ghostLetter] =
                el.getBoundingClientRect();
        });

        const settings = getSettings();

        tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,

                start: settings.start,
                end: settings.end,

                scrub: true,

                // IMPORTANT:
                // We don't pin .landing anymore.
                // The morph simply plays while scrolling.
                pin: false,

                invalidateOnRefresh: true,
            }
        });

        tl.fromTo(
            before,
            { opacity: 0 },
            {
                opacity: 1,
                ease: "none",
                duration: 0.5
            },
            ">"
        );

        tl.fromTo(
            defArt,
            { opacity: 1 },
            {
                opacity: 0,
                ease: "none",
                duration: 0.5
            },
            "<"
        );

        tl.fromTo(
            after,
            { opacity: 0 },
            {
                opacity: 1,
                ease: "none",
                duration: 1
            },
            "<"
        );

        tl.fromTo(
            defStrat,
            { opacity: 0 },
            {
                opacity: 1,
                ease: "none",
                duration: 1
            },
            "<"
        );

        sharedEls.forEach((el, i) => {

            const finalRect =
                el.getBoundingClientRect();

            const startRect =
                ghostMap[el.dataset.shared];

            if (!startRect) return;

            const deltaX =
                startRect.left - finalRect.left;

            const scale =
                startRect.height /
                finalRect.height;

            tl.fromTo(
                el,
                {
                    x: deltaX,
                    scale: scale
                },
                {
                    x: 0,
                    y: 0,
                    scale: 1,
                    ease: "none",
                    duration: 1
                },
                i === 0 ? 0 : "<"
            );
        });
    }

    build();

    let resizeTimer;

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            build();
            ScrollTrigger.refresh();
        }, 200);
    });
}