import "./styles/Work.css";
import WorkImage from "./WorkImage";
import ProjectModal from "./ProjectModal";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState } from "react";
import { config } from "../config";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_INITIAL_COUNT = 3;

const Work = () => {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showAll, setShowAll] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useEffect(() => {
    // Disable pinning on mobile to allow vertical scrolling
    if (window.innerWidth <= 768) return;

    function getTranslateX(): number {
      const workFlex = document.querySelector(".work-flex") as HTMLElement;
      if (!workFlex) return 0;
      return Math.max(0, workFlex.scrollWidth - workFlex.clientWidth + 40);
    }

    let timeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".work-section",
        start: "top top",
        end: () => `+=${getTranslateX()}`,
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        id: "work",
        invalidateOnRefresh: true,
      },
    });

    timeline.to(".work-flex", {
      x: () => -getTranslateX(),
      ease: "none",
    });

    // Refresh ScrollTrigger after layout settles
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    // Clean up
    return () => {
      clearTimeout(timer);
      timeline.kill();
      ScrollTrigger.getById("work")?.kill();
    };
  }, []);
  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex">
          {config.projects
            .slice(0, isMobile && !showAll ? MOBILE_INITIAL_COUNT : 5)
            .map((project, index) => (
            <div
              className="work-box"
              key={project.id}
              onClick={() => setSelectedProject(project)}
              data-cursor="disable"
              style={{ cursor: "pointer" }}
            >
              <div className="work-info">
                <div className="work-title">
                  <h3>0{index + 1}</h3>

                  <div>
                    <h4>{project.title}</h4>
                    <p>{project.category}</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>{project.technologies}</p>
              </div>
              <WorkImage image={project.image} alt={project.title} link={(project as any).link} />
            </div>
          ))}
          {/* Mobile: Show More / Show Less toggle */}
          {isMobile && (
            <div className="work-box work-box-cta">
              <div className="see-all-works">
                {!showAll ? (
                  <>
                    <h3>Want to see more?</h3>
                    <p>View more projects or explore all of my works</p>
                    <button
                      className="see-all-btn"
                      data-cursor="disable"
                      onClick={() => setShowAll(true)}
                    >
                      View More ↓
                    </button>
                    <Link to="/myworks" className="see-all-btn see-all-btn-outline" data-cursor="disable">
                      All Works →
                    </Link>
                  </>
                ) : (
                  <>
                    <h3>Seen enough?</h3>
                    <p>Explore all of my projects and creations</p>
                    <Link to="/myworks" className="see-all-btn" data-cursor="disable">
                      All Works →
                    </Link>
                    <button
                      className="see-all-btn see-all-btn-outline"
                      data-cursor="disable"
                      onClick={() => setShowAll(false)}
                    >
                      Show Less ↑
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Desktop: See All Works Button */}
          {!isMobile && (
            <div className="work-box work-box-cta">
              <div className="see-all-works">
                <h3>Want to see more?</h3>
                <p>Explore all of my projects and creations</p>
                <Link to="/myworks" className="see-all-btn" data-cursor="disable">
                  See All Works →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
};

export default Work;
