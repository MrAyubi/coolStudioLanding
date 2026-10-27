import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initArtStrategyMorph() {
    const section = document.getElementById("data-art-strategy-morph");
    if (!section) return;

    // The morph is positioned inside the hero, so the whole hero is pinned while it plays.
    const pinTarget = section.closest(".landing") || section;

    const ghost = section.querySelector("[data-ghost]");
    const sharedEls = section.querySelectorAll("[data-shared]");
    const before = section.querySelector("[data-before]");
    const after = section.querySelector("[data-after]");
    const defArt = section.querySelector("[data-def-art]");
    const defStrat = section.querySelector("[data-def-strategy]");
    const hint = section.querySelector("[data-hint]");

    // Arc for each shared letter while "art" reshuffles into "tra": the "a" travels
    // the furthest, so it goes over the top; the "t" ducks under. Nothing overlaps.
    // Values are fractions of the letter height.
    const arcs = { a: -0.55, r: 0.15, t: 0.4 };

    let tl;

    function getSettings() {
        const width = window.innerWidth;

        // MOBILE
        if (width <= 767) {
            return { end: "+=80%" };
        }

        // TABLET
        if (width <= 1024) {
            return { end: "+=90%" };
        }

        // DESKTOP
        return { end: "+=100%" };
    }

    function build() {
        if (tl) {
            // true reverts the pin, so the measurements below see the normal layout.
            if (tl.scrollTrigger) tl.scrollTrigger.kill(true);
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

                // Holds the morph in the middle of the screen for the whole animation,
                // so a quick flick of the wheel can't scroll past it.
                start: "center center",
                end: settings.end,
                pin: pinTarget,

                scrub: 0.6,

                invalidateOnRefresh: true,
            }
        });

        // 1. The hint goes as soon as the visitor starts scrolling; "ART" holds a beat.
        if (hint) {
            tl.to(hint, { opacity: 0, y: 10, ease: "none", duration: 0.3 }, 0);
        }

        tl.to(defArt, { opacity: 0, ease: "none", duration: 0.4 }, 0.6);

        // 2. The three letters swap places along arcs.
        sharedEls.forEach((el) => {

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

            const lift =
                (arcs[el.dataset.shared] || 0) * finalRect.height;

            tl.fromTo(
                el,
                { x: deltaX, scale: scale },
                { x: 0, scale: 1, ease: "power2.inOut", duration: 1.4 },
                0.6
            );

            tl.fromTo(
                el,
                { y: 0 },
                {
                    keyframes: [
                        { y: lift, ease: "power1.out" },
                        { y: 0, ease: "power1.in" }
                    ],
                    duration: 1.4
                },
                0.6
            );
        });

        // 3. "s" and "tegy" close in around the new "tra".
        tl.fromTo(
            before,
            { opacity: 0, x: -30 },
            { opacity: 1, x: 0, ease: "power2.out", duration: 0.6 },
            2.0
        );

        tl.fromTo(
            after,
            { opacity: 0, x: 30 },
            { opacity: 1, x: 0, ease: "power2.out", duration: 0.6 },
            2.1
        );

        tl.fromTo(
            defStrat,
            { opacity: 0 },
            { opacity: 1, ease: "none", duration: 0.5 },
            2.4
        );

        // 4. Hold on "strategy" before the pin lets go.
        tl.to({}, { duration: 0.6 });
    }

    build();

    let resizeTimer;
    let lastWidth = window.innerWidth;

    window.addEventListener("resize", () => {
        // Mobile browsers fire resize when the address bar shows/hides; rebuilding then
        // would jump the pin mid-scroll. Only width changes move the letters.
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;

        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            build();
            ScrollTrigger.refresh();
        }, 200);
    });
}
