import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import setAnimations from "./utils/animationUtils";
import { handleMouseMove, handleHeadRotation } from "./utils/mouseUtils";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { CHARACTER_LINES, setCharTimeline } from "../utils/GsapScroll";

const HOVER_LINE = "Hey, you found me.";
const BUBBLE_OFFSET = new THREE.Vector3(0.9, 1.9, 0);

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const { setLoading } = useLoading();

  useEffect(() => {
    const container = canvasDiv.current;
    const hoverDiv = hoverDivRef.current;
    const bubble = bubbleRef.current;
    if (!container || !hoverDiv || !bubble) return;
    let disposed = false;

    const rect = container.getBoundingClientRect();
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: "high-performance",
    });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(14.5, rect.width / rect.height, 0.1, 1000);
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    const light = setLighting(scene);
    const progress = setProgress((value) => setLoading(value));
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    let headBone: THREE.Object3D | null = null;
    let screenLight: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let killTimeline = () => {};
    let removeHover: (() => void) | undefined;
    const timers: number[] = [];

    /* ---------- speech bubble ---------- */
    let lineIndex = 0;
    let hovered = false;
    let bubbleReady = false;
    const bubbleText = bubble.querySelector("span")!;
    const showLine = (text: string) => {
      if (!bubbleReady || bubbleText.textContent === text) return;
      gsap.killTweensOf(bubble);
      gsap
        .timeline()
        .to(bubble, { autoAlpha: 0, y: 6, duration: 0.18, ease: "power1.in" })
        .call(() => {
          bubbleText.textContent = text;
        })
        .to(bubble, { autoAlpha: 1, y: 0, duration: 0.35, ease: "back.out(2)" });
    };
    const say = (index: number) => {
      lineIndex = index;
      if (!hovered) showLine(CHARACTER_LINES[index]);
    };

    /* ---------- hover: eyebrow raise (animationUtils) + see-through ---------- */
    const onEnter = () => {
      hovered = true;
      canvas.classList.add("is-ghost");
      showLine(HOVER_LINE);
    };
    const onLeave = () => {
      hovered = false;
      canvas.classList.remove("is-ghost");
      showLine(CHARACTER_LINES[lineIndex]);
    };
    hoverDiv.addEventListener("mouseenter", onEnter);
    hoverDiv.addEventListener("mouseleave", onLeave);

    /* ---------- load ---------- */
    loadCharacter()
      .then(async (gltf) => {
        if (disposed) return;
        const character = gltf.scene;
        const animations = setAnimations(gltf);
        removeHover = animations.hover(gltf, hoverDiv);
        mixer = animations.mixer;
        scene.add(character);
        headBone = character.getObjectByName("spine006") || character.getObjectByName("spine.006") || null;
        screenLight = character.getObjectByName("screenlight") || null;
        killTimeline = setCharTimeline(character, camera, say);

        await progress.loaded();
        if (disposed) return;
        timers.push(
          window.setTimeout(() => {
            light.turnOnLights();
            animations.startIntro();
          }, 1500),
          window.setTimeout(() => {
            bubbleReady = true;
            bubbleText.textContent = CHARACTER_LINES[lineIndex];
            gsap.fromTo(
              bubble,
              { autoAlpha: 0, y: 10, scale: 0.85 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }
            );
          }, 3600)
        );
      })
      .catch((err) => {
        console.error("Failed loading character:", err);
        progress.loaded();
      });

    /* ---------- cursor ---------- */
    let mouse = { x: 0, y: 0 };
    const onMouseMove = (event: MouseEvent) => handleMouseMove(event, (x, y) => (mouse = { x, y }));
    document.addEventListener("mousemove", onMouseMove, { passive: true });

    /* ---------- render loop (paused while off-screen) ---------- */
    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);

    const clock = new THREE.Clock();
    const headPos = new THREE.Vector3();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      if (!visible) return;
      if (headBone) {
        handleHeadRotation(headBone, mouse.x, mouse.y, 0.1, 0.2, THREE.MathUtils.lerp);
        light.setPointLight(screenLight);

        // bubble anchors above-right of the head, in world space so it tracks any zoom
        const r = canvas.getBoundingClientRect();
        headBone.getWorldPosition(headPos).add(BUBBLE_OFFSET).project(camera);
        bubble.style.left = `${((headPos.x + 1) / 2) * r.width}px`;
        bubble.style.top = `${((1 - headPos.y) / 2) * r.height - bubble.offsetHeight}px`;
      }
      mixer?.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const r = container.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      progress.stop();
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(raf);
      killTimeline();
      removeHover?.();
      io.disconnect();
      hoverDiv.removeEventListener("mouseenter", onEnter);
      hoverDiv.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf(bubble);
      scene.clear();
      renderer.dispose();
      canvas.remove();
    };
  }, [setLoading]);

  return (
    <div className="character-container">
      <div className="character-model" ref={canvasDiv}>
        <div className="character-rim"></div>
        <div className="character-hover" ref={hoverDivRef}></div>
        <div className="character-bubble" ref={bubbleRef} aria-hidden="true">
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default Scene;
