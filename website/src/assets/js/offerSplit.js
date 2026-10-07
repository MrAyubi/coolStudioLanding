const section = document.querySelector(".offer-split");

if (section) {
    const panels = [...section.querySelectorAll(".offer-split__panel")];
    const divider = section.querySelector(".offer-split__divider");
    const isMobile = () => window.matchMedia("(max-width: 430px)").matches;

    const updateDivider = () => {
        if (!section.classList.contains("has-active")) {
            divider.style.left = "50%";
            return;
        }

        if (panels[0].classList.contains("is-active")) {
            divider.style.left = "80%";
        } else {
            divider.style.left = "20%";
        }
    };

    const updateLabels = () => {
        panels.forEach(panel => {
            const label = panel.querySelector(".offer-split__label");

            if (!label) return;
            if (isMobile()) {
                if (panel.classList.contains("is-active")) {
                    label.style.top = "18%"
                    label.style.transform = "rotate(0deg)";




                } else if (section.classList.contains("has-active")) {
                    label.style.transform = "rotate(90deg)";
                    label.style.left = "0%"
                    label.style.visibility = "visible"
                    label.style.top = "40%"



                } else {
                    // Cleared rather than set, so the CSS hover lift can apply.
                    label.style.transform = "";
                    label.style.left = "0%"
                    label.style.visibility = "visible"
                    label.style.top = "50%"



                }
                return;
            }


            if (panel.classList.contains("is-active")) {
                label.style.top = "18%"
                label.style.transform = "rotate(0deg)";




            } else if (section.classList.contains("has-active")) {
                label.style.transform = "rotate(90deg)";
                label.style.visibility = "visible"
                label.style.top = "50%"


            } else {
                label.style.transform = "";
                label.style.visibility = "visible"
                label.style.top = "50%"


            }
        });
    };

    // One-time "peek" when the section first scrolls into view: the divider slides
    // to each side and back, hinting that the panels can be opened.
    let peekTimers = [];

    const cancelPeek = () => {
        peekTimers.forEach(clearTimeout);
        peekTimers = [];
        panels.forEach(p => (p.style.width = ""));
    };

    const peek = () => {
        if (section.classList.contains("has-active")) return;

        const steps = [60, 40, 50];
        steps.forEach((first, i) => {
            peekTimers.push(setTimeout(() => setSplit(first), i * 700));
        });
        peekTimers.push(setTimeout(() => {
            cancelPeek();
            updateDivider();
        }, steps.length * 700));
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Run a callback once the site loader is gone, so the peek never plays hidden behind it
    // (e.g. after a reload restores a scroll position at this section).
    const whenLoaderDone = callback => {
        const loader = document.querySelector("#site-loader");
        if (!loader || loader.classList.contains("is-hidden")) {
            callback();
            return;
        }
        const loaderObserver = new MutationObserver(() => {
            if (!loader.classList.contains("is-hidden")) return;
            loaderObserver.disconnect();
            callback();
        });
        loaderObserver.observe(loader, { attributes: true, attributeFilter: ["class"] });
    };

    if (!reduceMotion && "IntersectionObserver" in window) {
        whenLoaderDone(() => {
            const observer = new IntersectionObserver(entries => {
                if (!entries[0].isIntersecting) return;
                observer.disconnect();
                peekTimers.push(setTimeout(peek, 400));
            }, { threshold: 0.6 });
            observer.observe(section);
        });
    }

    // Desktop hover: the hovered panel widens a little and the divider slides,
    // like a small version of the peek.
    const canHover = window.matchMedia("(hover: hover)");

    const setSplit = firstWidth => {
        panels[0].style.width = `${firstWidth}%`;
        panels[1].style.width = `${100 - firstWidth}%`;
        divider.style.left = `${firstWidth}%`;
    };

    const resetSplit = () => {
        panels.forEach(p => (p.style.width = ""));
        updateDivider();
    };

    panels.forEach((panel, i) => {
        panel.addEventListener("mouseenter", () => {
            if (!canHover.matches || section.classList.contains("has-active") || peekTimers.length) return;
            setSplit(i === 0 ? 60 : 40);
        });
    });

    section.addEventListener("mouseleave", () => {
        if (!canHover.matches || section.classList.contains("has-active") || peekTimers.length) return;
        resetSplit();
    });

    panels.forEach(panel => {
        panel.addEventListener("click", () => {
            cancelPeek();
            const isAlreadyActive = panel.classList.contains("is-active");

            panels.forEach(p => p.classList.remove("is-active"));

            if (isAlreadyActive) {
                section.classList.remove("has-active");
            } else {
                panel.classList.add("is-active");
                section.classList.add("has-active");
            }

            panels.forEach(p =>
                p.setAttribute(
                    "aria-expanded",
                    String(p.classList.contains("is-active"))
                )
            );

            updateDivider();
            updateLabels();
        });
    });

    updateDivider();
    updateLabels();
}