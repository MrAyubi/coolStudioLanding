import loader_01 from "url:../images/loader/01.webp";
import loader_02 from "url:../images/loader/02.webp";
import loader_03 from "url:../images/loader/03.webp";
import loader_04 from "url:../images/loader/04.webp";
import loader_05 from "url:../images/loader/05.webp";
import loader_06 from "url:../images/loader/06.webp";
import loader_07 from "url:../images/loader/07.webp";
import loader_08 from "url:../images/loader/08.webp";
import loader_09 from "url:../images/loader/09.webp";
import loader_10 from "url:../images/loader/10.webp";
import loader_11 from "url:../images/loader/11.webp";
import loader_12 from "url:../images/loader/12.webp";
import loader_13 from "url:../images/loader/13.webp";
import loader_14 from "url:../images/loader/14.webp";
import loader_15 from "url:../images/loader/15.webp";
import loader_16 from "url:../images/loader/16.webp";
import loader_17 from "url:../images/loader/17.webp";
import loader_18 from "url:../images/loader/18.webp";
import loader_19 from "url:../images/loader/19.webp";
import loader_20 from "url:../images/loader/20.webp";
import loader_21 from "url:../images/loader/21.webp";
import loader_22 from "url:../images/loader/22.webp";
import loader_23 from "url:../images/loader/23.webp";
import loader_24 from "url:../images/loader/24.webp";
import loader_25 from "url:../images/loader/25.webp";
import loader_26 from "url:../images/loader/26.webp";
import loader_27 from "url:../images/loader/27.webp";
import loader_28 from "url:../images/loader/28.webp";
import loader_29 from "url:../images/loader/29.webp";
import loader_30 from "url:../images/loader/30.webp";


// =========================================================
// ALL LOADER IMAGES
// =========================================================

const loaderImages = [
    loader_01,
    loader_02,
    loader_03,
    loader_04,
    loader_05,
    loader_06,
    loader_07,
    loader_08,
    loader_09,
    loader_10,
    loader_11,
    loader_12,
    loader_13,
    loader_14,
    loader_15,
    loader_16,
    loader_17,
    loader_18,
    loader_19,
    loader_20,
    loader_21,
    loader_22,
    loader_23,
    loader_24,
    loader_25,
    loader_26,
    loader_27,
    loader_28,
    loader_29,
    loader_30
];


// =========================================================
// CONFIGURATION
// =========================================================

const SEQUENCE_DURATION = 4000;
const FINAL_PAUSE = 0;
const LOGO_DURATION = 1500;
const EXIT_DURATION = 900;

const FAILSAFE_TIME = 10000;


// =========================================================
// DOM
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const loader = document.querySelector("#site-loader");
    const frame = document.querySelector("#loader-frame");

    if (!loader || !frame) {
        console.warn("Site loader elements not found.");
        return;
    }


    // =====================================================
    // STATE
    // =====================================================

    let loaderFinished = false;
    let sequenceStarted = false;


    // =====================================================
    // LOCK PAGE SCROLL
    // =====================================================

    const html = document.documentElement;
    const body = document.body;

    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";


    // =====================================================
    // PRELOAD ONE IMAGE
    // =====================================================

    function preloadImage(src) {

        return new Promise((resolve) => {

            const image = new Image();

            image.onload = async () => {

                // Decode the image before considering it ready.
                //
                // This is important for your rapid sequence.
                // The file may be downloaded but still need
                // decoding before it can be displayed smoothly.

                if (image.decode) {

                    try {
                        await image.decode();
                    } catch (error) {
                        // Some browsers can reject decode()
                        // even though the image itself loaded.
                        // The image is still usable.
                    }
                }

                resolve(image);
            };


            image.onerror = () => {

                console.warn(
                    "Loader image failed:",
                    src
                );

                // Resolve instead of rejecting.
                //
                // A single broken frame should never
                // permanently block the website.

                resolve(null);
            };


            image.src = src;
        });
    }


    // =====================================================
    // PRELOAD ALL IMAGES
    // =====================================================

    async function preloadAllImages() {

        const loadedImages = await Promise.all(
            loaderImages.map(src => preloadImage(src))
        );

        return loadedImages;
    }


    // =====================================================
    // WAIT FOR BROWSER PAINT
    // =====================================================

    function waitForPaint() {

        return new Promise((resolve) => {

            requestAnimationFrame(() => {

                requestAnimationFrame(() => {

                    resolve();

                });

            });

        });
    }


    // =====================================================
    // PLAY IMAGE SEQUENCE
    // =====================================================

    async function playSequence(images) {

        if (sequenceStarted) {
            return;
        }

        sequenceStarted = true;


        // Remove failed images.

        const validImages = images.filter(Boolean);


        // If absolutely nothing loaded,
        // don't trap the user.

        if (validImages.length === 0) {

            console.warn(
                "No loader images could be loaded."
            );

            showLogo();

            return;
        }


        await waitForPaint();


        // =================================================
        // TIMING
        // =================================================

        const frameCount = validImages.length;

        const frameDuration =
            SEQUENCE_DURATION / frameCount;


        // =================================================
        // FIRST FRAME
        // =================================================

        frame.src = validImages[0].src;

        frame.style.opacity = "1";


        // =================================================
        // ANIMATION
        // =================================================

        const startTime = performance.now();

        let lastFrameIndex = 0;


        function render(currentTime) {

            const elapsed =
                currentTime - startTime;


            // ---------------------------------------------
            // SEQUENCE FINISHED
            // ---------------------------------------------

            if (elapsed >= SEQUENCE_DURATION) {

                // Make absolutely sure the last frame
                // is visible.

                const lastImage =
                    validImages[frameCount - 1];

                frame.src = lastImage.src;


                // -----------------------------------------
                // Brief pause before logo
                // -----------------------------------------

                setTimeout(() => {

                    showLogo();

                }, FINAL_PAUSE);


                return;
            }


            // ---------------------------------------------
            // CURRENT FRAME
            // ---------------------------------------------

            const frameIndex = Math.min(
                Math.floor(elapsed / frameDuration),
                frameCount - 1
            );


            // ---------------------------------------------
            // Only update DOM when frame changes
            // ---------------------------------------------

            if (frameIndex !== lastFrameIndex) {

                lastFrameIndex = frameIndex;

                const image =
                    validImages[frameIndex];


                if (image) {
                    frame.src = image.src;
                }
            }


            requestAnimationFrame(render);
        }


        requestAnimationFrame(render);
    }


    // =====================================================
    // SHOW LOGO
    // =====================================================

    function showLogo() {

        if (loaderFinished) {
            return;
        }


        loader.classList.add("is-logo-visible");


        // Give the logo time to appear.

        setTimeout(() => {

            exitLoader();

        }, LOGO_DURATION);
    }


    // =====================================================
    // EXIT LOADER
    // =====================================================

    function exitLoader() {

        if (loaderFinished) {
            return;
        }


        loaderFinished = true;


        // Start CSS fade-out.

        loader.classList.add("is-exiting");


        // Wait for CSS transition.

        setTimeout(() => {

            loader.classList.add("is-hidden");

            // Restore scrolling.

            html.style.overflow =
                originalHtmlOverflow;

            body.style.overflow =
                originalBodyOverflow;


            // Completely remove it from interaction.

            loader.style.display = "none";


        }, EXIT_DURATION);
    }


    // =====================================================
    // FAILSAFE
    // =====================================================

    // If something unexpected happens, never leave
    // the user stuck on the loader forever.

    const failsafe = setTimeout(() => {

        console.warn(
            "Loader failsafe triggered."
        );

        showLogo();

    }, FAILSAFE_TIME);


    // =====================================================
    // START PRELOADING
    // =====================================================

    preloadAllImages()
        .then((images) => {

            clearTimeout(failsafe);

            playSequence(images);

        })
        .catch((error) => {

            console.error(
                "Loader preload error:",
                error
            );

            clearTimeout(failsafe);

            showLogo();

        });

});
