import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiGithub, FiExternalLink, FiX, FiLayers } from "react-icons/fi";
import gsap from "gsap";
import { lenis } from "./Navbar";
import "./styles/ProjectModal.css";

interface ProjectModalProps {
  project: any;
  /** The thumbnail that was clicked; its image flies into the modal. */
  originEl?: HTMLElement | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

const OPEN_EASE = "power3.inOut";
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fixed-position copy of the image used for the shared-element flight. */
function createGhost(src: string, rect: DOMRect, radius: string) {
  const ghost = document.createElement("img");
  ghost.src = src;
  ghost.alt = "";
  ghost.className = "project-modal-ghost";
  Object.assign(ghost.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: radius,
  });
  document.body.appendChild(ghost);
  return ghost;
}

const rectProps = (rect: DOMRect) => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
});

const isOnScreen = (rect: DOMRect) =>
  rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;

const ProjectModal = ({ project, originEl, onClose, onPrevious, onNext }: ProjectModalProps) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const ghostRef = useRef<HTMLImageElement | null>(null);
  const closingRef = useRef(false);
  const shownIdRef = useRef<unknown>(null);
  const isOpen = Boolean(project);

  const cleanupGhost = () => {
    ghostRef.current?.remove();
    ghostRef.current = null;
  };

  const infoItems = () =>
    infoRef.current ? Array.from(infoRef.current.querySelectorAll<HTMLElement>("[data-reveal]")) : [];

  /* ---------- open: runs before paint so nothing flashes ---------- */
  useLayoutEffect(() => {
    if (!isOpen) {
      shownIdRef.current = null;
      return;
    }
    const backdrop = backdropRef.current!;
    const card = cardRef.current!;
    const frame = frameRef.current!;
    const frameImg = frame.querySelector("img")!;

    // project switched while open (prev / next): quick crossfade, no flight
    if (shownIdRef.current !== null) {
      shownIdRef.current = project.id;
      tlRef.current?.kill();
      tlRef.current = gsap
        .timeline()
        .fromTo(frameImg, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power2.out" }, 0)
        .fromTo(infoItems(), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" }, 0.05);
      return;
    }
    shownIdRef.current = project.id;
    closingRef.current = false;
    lenis?.stop();
    document.documentElement.classList.add("modal-open");

    const items = infoItems();
    tlRef.current?.kill();

    if (reducedMotion()) {
      gsap.set([backdrop, card, frameImg, ...items], { clearProps: "all" });
      closeBtnRef.current?.focus({ preventScroll: true });
      return;
    }

    const sourceImg = originEl?.querySelector("img") ?? (originEl as HTMLImageElement | null);
    const sourceRect = sourceImg?.getBoundingClientRect();
    const targetRect = frame.getBoundingClientRect(); // measured before any transform is applied
    const tl = gsap.timeline({
      onComplete: () => {
        cleanupGhost();
        gsap.set(frameImg, { autoAlpha: 1 });
        closeBtnRef.current?.focus({ preventScroll: true });
      },
    });
    tlRef.current = tl;

    tl.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0);

    if (sourceImg && sourceRect && isOnScreen(sourceRect)) {
      const radius = getComputedStyle(sourceImg).borderRadius || "12px";
      const ghost = createGhost(frameImg.currentSrc || frameImg.src, sourceRect, radius);
      ghostRef.current = ghost;
      gsap.set(sourceImg, { autoAlpha: 0 });
      gsap.set(frameImg, { autoAlpha: 0 });
      tl.to(ghost, { ...rectProps(targetRect), borderRadius: "20px 20px 0 0", duration: 0.75, ease: OPEN_EASE }, 0)
        .fromTo(card, { autoAlpha: 0, y: 24, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, 0.15);
    } else {
      tl.fromTo(card, { autoAlpha: 0, y: 30, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, 0.05)
        .fromTo(frameImg, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power2.out" }, 0.1);
    }

    tl.fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" }, 0.35);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  // restore scroll + source thumbnail if unmounted mid-animation
  useEffect(() => {
    if (!isOpen) return;
    return () => {
      tlRef.current?.kill();
      cleanupGhost();
      lenis?.start();
      document.documentElement.classList.remove("modal-open");
    };
  }, [isOpen]);

  /* ---------- close: the reverse flight ---------- */
  const handleClose = useCallback(() => {
    if (closingRef.current || !isOpen) return;
    closingRef.current = true;
    tlRef.current?.kill();
    cleanupGhost();

    const backdrop = backdropRef.current!;
    const card = cardRef.current!;
    const frameImg = frameRef.current!.querySelector("img")!;
    const sourceImg = originEl?.querySelector("img") ?? (originEl as HTMLImageElement | null);
    const finish = () => {
      if (sourceImg) gsap.set(sourceImg, { clearProps: "opacity,visibility" });
      cleanupGhost();
      onClose();
      (originEl as HTMLElement | null)?.focus?.({ preventScroll: true });
    };

    if (reducedMotion()) {
      finish();
      return;
    }

    const tl = gsap.timeline({ onComplete: finish });
    tlRef.current = tl;
    tl.to(infoItems(), { autoAlpha: 0, y: 8, duration: 0.2, stagger: 0.02, ease: "power1.in" }, 0);

    const sourceRect = sourceImg?.getBoundingClientRect();
    if (sourceImg && sourceRect && isOnScreen(sourceRect)) {
      const ghost = createGhost(frameImg.currentSrc || frameImg.src, frameImg.getBoundingClientRect(), "20px 20px 0 0");
      ghostRef.current = ghost;
      gsap.set(frameImg, { autoAlpha: 0 });
      tl.to(card, { autoAlpha: 0, y: 16, scale: 0.97, duration: 0.35, ease: "power2.in" }, 0.05)
        .to(ghost, { ...rectProps(sourceRect), borderRadius: getComputedStyle(sourceImg).borderRadius || "12px", duration: 0.6, ease: OPEN_EASE }, 0.05)
        .to(backdrop, { autoAlpha: 0, duration: 0.45, ease: "power2.inOut" }, 0.15);
    } else {
      tl.to(card, { autoAlpha: 0, y: 24, scale: 0.95, duration: 0.35, ease: "power2.in" }, 0.05)
        .to(backdrop, { autoAlpha: 0, duration: 0.35, ease: "power2.in" }, 0.1);
    }
  }, [isOpen, originEl, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft" && onPrevious) onPrevious();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose, onPrevious, onNext]);

  if (!project) return null;

  const deployUrl = project.deploy || project.deployLink;

  // portal: section styles (e.g. `.work-section h2`) and pinned transforms must not reach the modal
  return createPortal(
    <div
      className="project-modal-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      ref={backdropRef}
      data-lenis-prevent
    >
      {onPrevious && onNext && (
        <div className="project-modal-navigation">
          <button type="button" onClick={(e) => { e.stopPropagation(); onPrevious(); }} aria-label="Previous project">
            ←
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next project">
            →
          </button>
        </div>
      )}
      <div className="project-modal-card" onClick={(e) => e.stopPropagation()} ref={cardRef}>
        <button
          className="project-modal-close"
          onClick={handleClose}
          aria-label="Close project details"
          data-cursor="disable"
          ref={closeBtnRef}
        >
          <FiX />
        </button>

        <div className="project-modal-grid">
          <div className="project-modal-image-col">
            <div className="project-modal-image-frame" ref={frameRef}>
              <img src={project.image} alt={project.title} decoding="async" />
              <div className="project-modal-image-overlay" />
            </div>
          </div>

          <div className="project-modal-info-col" ref={infoRef}>
            <div className="project-modal-badge" data-reveal>
              <FiLayers className="badge-icon" />
              <span>{project.category}</span>
            </div>

            <h2 className="project-modal-title" id="project-modal-title" data-reveal>
              {project.title}
            </h2>

            <p className="project-modal-desc" data-reveal>{project.description}</p>

            {project.technologies && (
              <div className="project-modal-tech-section" data-reveal>
                <span className="tech-label">Technologies Used:</span>
                <div className="tech-tags">
                  {project.technologies.split(",").map((tech: string, i: number) => (
                    <span key={i} className="tech-tag">
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="project-modal-actions" data-reveal>
              {project.link && (
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="modal-btn btn-github" data-cursor="disable">
                  <FiGithub /> View Code
                </a>
              )}

              {deployUrl ? (
                <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="modal-btn btn-deploy" data-cursor="disable">
                  <span className="live-dot" /> Live Demo <FiExternalLink />
                </a>
              ) : (
                <div className="modal-btn btn-coming-soon">
                  <span className="pulse-dot" /> Deploy soon
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProjectModal;
