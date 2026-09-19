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
                    label.style.visibility = "hidden"



                } else if (section.classList.contains("has-active")) {
                    label.style.transform = "rotate(90deg)";
                    label.style.left = "0%"
                    label.style.visibility = "visible"


                } else {
                    label.style.transform = "rotate(0deg)";
                    label.style.left = "0%"
                    label.style.visibility = "visible"


                }
                return;
            }


            if (panel.classList.contains("is-active")) {
                label.style.visibility = "hidden"



            } else if (section.classList.contains("has-active")) {
                label.style.transform = "rotate(90deg)";
                label.style.visibility = "visible"


            } else {
                label.style.transform = "rotate(0deg)";
                label.style.visibility = "visible"


            }
        });
    };

    panels.forEach(panel => {
        panel.addEventListener("click", () => {
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