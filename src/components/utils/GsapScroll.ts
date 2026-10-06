import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** What the character says in each chapter it is on screen for. */
export const CHARACTER_LINES = [
  "Hi, I'm Prateek.",
  "Here's a little about me.",
  "And this is what I build.",
];

/**
 * Scroll-scrubbed story for the 3D developer (desktop only):
 * turns to face the About chapter, the monitor rises and lights his face
 * for "What I do", then he slides away. Returns a cleanup for everything
 * created here.
 */
export function setCharTimeline(
  character: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  say: (index: number) => void
) {
  const created: (gsap.core.Animation | ScrollTrigger)[] = [];
  let screenLight: any, monitor: any;
  let intensity = 0;
  const flickerTimer = window.setInterval(() => (intensity = Math.random()), 200);

  character.children.forEach((object: any) => {
    if (object.name === "Plane004") {
      object.children.forEach((child: any) => {
        child.material.transparent = true;
        child.material.opacity = 0;
        if (child.material.name === "Material.027") {
          monitor = child;
          child.material.color.set("#FFFFFF");
        }
      });
    }
    if (object.name === "screenlight") {
      object.material.transparent = true;
      object.material.opacity = 0;
      object.material.emissive.set("#9fefff");
      created.push(
        gsap.timeline({ repeat: -1, repeatRefresh: true }).to(object.material, {
          emissiveIntensity: () => intensity * 8,
          duration: () => Math.random() * 0.6,
          delay: () => Math.random() * 0.1,
        })
      );
      screenLight = object;
    }
  });

  const cleanup = () => {
    window.clearInterval(flickerTimer);
    created.forEach((item) => {
      if (item instanceof ScrollTrigger) item.kill();
      else {
        (item as gsap.core.Timeline).scrollTrigger?.kill();
        item.kill();
      }
    });
  };
  if (window.innerWidth <= 1024) return cleanup;

  const scrub = 0.8;
  const neckBone = character.getObjectByName("spine005");

  const tl1 = gsap.timeline({
    scrollTrigger: { trigger: ".landing-section", start: "top top", end: "bottom top", scrub, invalidateOnRefresh: true },
  });
  tl1
    .fromTo(character.rotation, { y: 0 }, { y: 0.7, duration: 1 }, 0)
    .to(camera.position, { z: 22 }, 0)
    .fromTo(".character-model", { x: 0 }, { x: "-25%", duration: 1 }, 0)
    .to(".landing-container", { opacity: 0, duration: 0.4 }, 0)
    .to(".landing-container", { y: "40%", duration: 0.8 }, 0)
    .fromTo(".about-me", { y: "-50%" }, { y: "0%" }, 0);

  const tl2 = gsap.timeline({
    scrollTrigger: { trigger: ".about-section", start: "center 55%", end: "bottom top", scrub, invalidateOnRefresh: true },
  });
  tl2
    .to(camera.position, { z: 75, y: 8.4, duration: 6, delay: 2, ease: "power3.inOut" }, 0)
    .to(".about-section", { y: "30%", duration: 6 }, 0)
    .to(".about-section", { opacity: 0, delay: 3, duration: 2 }, 0)
    .fromTo(
      ".character-model",
      { pointerEvents: "inherit" },
      { pointerEvents: "none", x: "-12%", delay: 2, duration: 5 },
      0
    )
    .to(character.rotation, { y: 0.92, x: 0.12, delay: 3, duration: 3 }, 0);
  if (neckBone) tl2.to(neckBone.rotation, { x: 0.6, delay: 2, duration: 3 }, 0);
  if (monitor) {
    tl2
      .to(monitor.material, { opacity: 1, duration: 0.8, delay: 3.2 }, 0)
      .fromTo(monitor.position, { y: -10, z: 2 }, { y: 0, z: 0, delay: 1.5, duration: 3 }, 0);
  }
  if (screenLight) tl2.to(screenLight.material, { opacity: 1, duration: 0.8, delay: 4.5 }, 0);
  tl2
    .fromTo(".what-box-in", { display: "none" }, { display: "flex", duration: 0.1, delay: 6 }, 0)
    .fromTo(
      ".character-rim",
      { opacity: 1, scaleX: 1.4 },
      { opacity: 0, scale: 0, y: "-70%", duration: 5, delay: 2 },
      0.3
    );

  const tl3 = gsap.timeline({
    scrollTrigger: { trigger: ".whatIDO", start: "top top", end: "bottom top", scrub, invalidateOnRefresh: true },
  });
  tl3
    .fromTo(".character-model", { y: "0%" }, { y: "-100%", duration: 4, ease: "none", delay: 1 }, 0)
    .fromTo(".whatIDO", { y: 0 }, { y: "15%", duration: 2 }, 0)
    .to(character.rotation, { x: -0.04, duration: 2, delay: 1 }, 0);

  // speech-bubble narration per chapter
  created.push(
    tl1,
    tl2,
    tl3,
    ScrollTrigger.create({
      trigger: ".about-section",
      start: "top 70%",
      onEnter: () => say(1),
      onLeaveBack: () => say(0),
    }),
    ScrollTrigger.create({
      trigger: ".whatIDO",
      start: "top 75%",
      onEnter: () => say(2),
      onLeaveBack: () => say(1),
    })
  );
  return cleanup;
}

export function setAllTimeline() {
  const careerTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".career-section",
      start: "top 50%",
      end: "bottom 30%",
      scrub: 1.5,
      invalidateOnRefresh: true,
    },
  });
  careerTimeline
    .fromTo(".career-timeline", { maxHeight: "0%" }, { maxHeight: "100%", duration: 1, ease: "none" }, 0)
    .fromTo(".career-timeline", { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
    .fromTo(".career-info-box", { opacity: 0 }, { opacity: 1, stagger: 0.1, duration: 0.5 }, 0)
    .fromTo(
      ".career-dot",
      { animationIterationCount: "infinite" },
      { animationIterationCount: "1", delay: 0.3, duration: 0.1 },
      0
    );

  if (window.innerWidth > 1024) {
    careerTimeline.fromTo(".career-section", { y: 0 }, { y: "20%", duration: 0.5, delay: 0.2 }, 0);
  }

  return () => {
    careerTimeline.scrollTrigger?.kill();
    careerTimeline.kill();
  };
}
