import { useEffect } from "react";
import { FiGithub, FiExternalLink, FiX, FiLayers } from "react-icons/fi";
import "./styles/ProjectModal.css";

interface ProjectModalProps {
  project: any;
  onClose: () => void;
}

const ProjectModal = ({ project, onClose }: ProjectModalProps) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  return (
    <div
      className="project-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="project-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="project-modal-close"
          onClick={onClose}
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
