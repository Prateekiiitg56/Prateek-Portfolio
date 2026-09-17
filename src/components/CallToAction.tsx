import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { animate, stagger } from "animejs";
import { config } from "../config";
import "./styles/CallToAction.css";

const CallToAction = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Scroll reveal: stagger-in CTA buttons
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate('.cta-btn', {
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 600,
            delay: stagger(120),
            ease: 'outQuad',
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Squish: press/release on Hire Me button
  const handlePress = (e: React.MouseEvent<HTMLAnchorElement>) => {
    animate(e.currentTarget, {
      scale: 0.93,
      duration: 100,
      ease: 'inQuad',
    });
  };

  const handleRelease = (e: React.MouseEvent<HTMLAnchorElement>) => {
    animate(e.currentTarget, {
      scale: 1,
      duration: 400,
      ease: 'outElastic(1, 0.4)',
    });
  };

  return (
    <div className="cta-section" ref={sectionRef}>
      <div className="cta-buttons">
        <Link to="/play" className="cta-btn cta-btn-play" data-cursor="disable">
          Play With Me →
        </Link>
        
        <a 
          href={config.contact.linkedin} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="cta-btn cta-btn-hire"
          data-cursor="disable"
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
        >
          Hire Me →
        </a>
      </div>
    </div>
  );
};

export default CallToAction;
