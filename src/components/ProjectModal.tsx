import { useEffect, useRef, useState, useCallback } from "react";
import { FiGithub, FiExternalLink, FiX, FiLayers } from "react-icons/fi";
import { animate, stagger } from "animejs";
import "./styles/ProjectModal.css";

interface ProjectModalProps {
  project: any;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  skipIntroAnim?: boolean;
}

const ProjectModal = ({
  project,
  onClose,
  onPrevious,
  onNext,
  skipIntroAnim = false,
}: ProjectModalProps) => {
  const [closing, setClosing] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animated close: fade + scale down card, fade backdrop, then call onClose
  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);

    const card = cardRef.current;
    const backdrop = backdropRef.current;

    if (card) {
      animate(card, {
        scale: [1, 0.92],
        opacity: [1, 0],
        duration: 250,
        ease: 'inQuad',
      });
    }

    if (backdrop) {
      animate(backdrop, {
        opacity: [1, 0],
        duration: 200,
        ease: 'inQuad',
        onComplete: () => {
          onClose();
        },
      });
    } else {
      // Fallback if refs not available
      setTimeout(onClose, 250);
    }
  }, [closing, onClose]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Stagger-in tech-tag pills when modal opens
  useEffect(() => {
    if (!project) return;
    // Reset closing flag when a new project is set (reopen or nav)
    setClosing(false);
    // Small delay to let the CSS open animation start first
    const timer = setTimeout(() => {
      animate('.tech-tag', {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 300,
        delay: stagger(30),
        ease: 'outQuad',
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [project]);

  if (!project) return null;

  return (
    <div
      className={`project-modal-backdrop${skipIntroAnim ? ' no-intro-anim' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      ref={backdropRef}
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
      <div
        className="project-modal-card"
        onClick={(e) => e.stopPropagation()}
        ref={cardRef}
      >
        <button
          className="project-modal-close"
          onClick={handleClose}
          aria-label="Close modal"
          data-cursor="disable"
        >
          <FiX />
        </button>

        <div className="project-modal-grid">
          <div className="project-modal-image-col">
            <div className="project-modal-image-frame">
              <img
                src={project.image}
                alt={project.title}
              />
              <div className="project-modal-image-overlay" />
            </div>
          </div>

          <div className="project-modal-info-col">
            <div className="project-modal-badge">
              <FiLayers className="badge-icon" />
              <span>{project.category}</span>
            </div>

            <h2 className="project-modal-title">{project.title}</h2>

            <p className="project-modal-desc">{project.description}</p>

            {project.technologies && (
              <div className="project-modal-tech-section">
                <span className="tech-label">Technologies Used:</span>
                <div className="tech-tags">
                  {project.technologies
                    .split(",")
                    .map((tech: string, i: number) => (
                      <span key={i} className="tech-tag">
                        {tech.trim()}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="project-modal-actions">
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-btn btn-github"
                  data-cursor="disable"
                >
                  <FiGithub /> View Code
                </a>
              )}

              {project.deploy || project.deployLink ? (
                <a
                  href={project.deploy || project.deployLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-btn btn-deploy"
                  data-cursor="disable"
                >
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
    </div>
  );
};

export default ProjectModal;
