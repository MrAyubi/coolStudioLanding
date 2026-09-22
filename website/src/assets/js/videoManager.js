import affogato from "url:../videos/AFFOGATO.mp4";
import jellyMoon from "url:../videos/jellymoon.mp4";
import morteza from "url:../videos/morteza.mp4";
import agony from "url:../videos/agony.mp4";
import rechM from "url:../videos/rechem.mp4";


// =============================================
// VIDEO MAP
// =============================================

const VIDEO_SOURCES = {
    "AFFOGATO.mp4": affogato,
    "jellymoon.mp4": jellyMoon,
    "morteza.mp4": morteza,
    "agony.mp4": agony,
    "rechem.mp4": rechM
};


// =============================================
// SETTINGS
// =============================================

const VIDEO_SELECTOR = "video[data-video-src]";

const PRELOAD_MARGIN = "500px 0px";

const VISIBILITY_THRESHOLD = 0.1;


// =============================================
// STATE
// =============================================

let videos = [];

let observer = null;


// =============================================
// GET PARCEL VIDEO URL
// =============================================

function getVideoUrl(video) {

    const filename =
        video.dataset.videoSrc
            .split("/")
            .pop();

    const url =
        VIDEO_SOURCES[filename];

    if (!url) {

        console.error(
            "❌ No imported video found for:",
            filename
        );

        return null;
    }

    return url;
}


// =============================================
// LOAD VIDEO
// =============================================

function loadVideo(video) {

    if (video.dataset.loaded === "true") {
        return true;
    }


    const url = getVideoUrl(video);


    if (!url) {
        return false;
    }


    console.log(
        "🎬 Loading:",
        video.dataset.videoSrc
    );


    video.src = url;

    video.dataset.loaded = "true";

    video.load();


    return true;
}


// =============================================
// PLAY VIDEO
// =============================================

function playVideo(video) {

    const loaded =
        loadVideo(video);


    if (!loaded) {
        return;
    }


    const playPromise =
        video.play();


    if (playPromise !== undefined) {

        playPromise
            .then(() => {

                console.log(
                    "▶️ Playing:",
                    video.dataset.videoSrc
                );

            })
            .catch((error) => {

                console.warn(
                    "⚠️ Could not play:",
                    video.dataset.videoSrc,
                    error
                );

            });
    }
}


// =============================================
// PAUSE VIDEO
// =============================================

function pauseVideo(video) {

    if (!video.paused) {

        video.pause();

        console.log(
            "⏸️ Paused:",
            video.dataset.videoSrc
        );
    }
}


// =============================================
// INTERSECTION OBSERVER
// =============================================

function createObserver() {

    observer =
        new IntersectionObserver(
            (entries) => {

                entries.forEach(
                    (entry) => {

                        const video =
                            entry.target;


                        console.log(
                            "👀 Intersection:",
                            video.dataset.videoSrc,
                            entry.isIntersecting,
                            entry.intersectionRatio
                        );


                        if (
                            entry.isIntersecting
                        ) {

                            playVideo(video);

                        } else {

                            pauseVideo(video);

                        }

                    }
                );

            },
            {
                root: null,

                rootMargin:
                    PRELOAD_MARGIN,

                threshold:
                    VISIBILITY_THRESHOLD
            }
        );


    videos.forEach(
        (video) => {

            observer.observe(video);

        }
    );
}


// =============================================
// PAGE VISIBILITY
// =============================================

function setupPageVisibility() {

    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {

                videos.forEach(
                    pauseVideo
                );

                return;
            }


            videos.forEach(
                (video) => {

                    const rect =
                        video.getBoundingClientRect();


                    const visible =
                        rect.bottom > 0 &&
                        rect.top <
                        window.innerHeight;


                    if (visible) {

                        playVideo(video);

                    }

                }
            );

        }
    );
}


// =============================================
// INITIALIZE
// =============================================

export function initVideoManager() {

    videos =
        Array.from(
            document.querySelectorAll(
                VIDEO_SELECTOR
            )
        );


    console.log(
        "🎥 Video Manager initialized.",
        "Videos found:",
        videos.length
    );


    if (!videos.length) {

        console.warn(
            "⚠️ No lazy videos found."
        );

        return;
    }


    videos.forEach(
        (video) => {

            video.muted = true;

            video.loop = true;

            video.playsInline = true;

            video.preload = "none";

        }
    );


    createObserver();

    setupPageVisibility();
}


// =============================================
// CLEANUP
// =============================================

export function destroyVideoManager() {

    if (observer) {

        observer.disconnect();

        observer = null;

    }


    videos.forEach(
        pauseVideo
    );


    videos = [];
}