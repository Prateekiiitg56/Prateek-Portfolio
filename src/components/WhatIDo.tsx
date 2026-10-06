import { useEffect, useRef, useCallback } from "react";
import { animate, stagger } from "animejs";
import "./styles/WhatIDo.css";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { config } from "../config";

const WhatIDo = () => {
  const containerRef = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const setRef = (el: HTMLDivElement | null, index: number) => {
    containerRef.current[index] = el;
  };

  // Touch devices: tap a card to expand it. Each listener is kept so cleanup removes
  // the same function (a new arrow function in removeEventListener removes nothing).
  useEffect(() => {
    if (!ScrollTrigger.isTouch) return;
    const cleanups = containerRef.current.map((container) => {
      if (!container) return () => {};
      container.classList.remove("what-noTouch");
      const onClick = () => handleClick(container);
      container.addEventListener("click", onClick);
      return () => container.removeEventListener("click", onClick);
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  // Scroll reveal: stagger-in .what-content cards
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate('.what-content', {
            opacity: [0, 1],
            translateX: [40, 0],
            duration: 700,
            delay: stagger(200),
            ease: 'outQuad',
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keyboard users open a card with Enter or Space, the same way a tap does on touch screens
  const handleCardKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    handleClick(e.currentTarget);
  }, []);

  // Hover lift on .what-content cards
  const handleContentEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      translateY: -6,
      duration: 300,
      ease: 'outQuad',
    });
  }, []);

  const handleContentLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      translateY: 0,
      duration: 300,
      ease: 'outQuad',
    });
  }, []);

  return (
    <div className="whatIDO" ref={sectionRef}>
      <div className="what-box">
        <h2 className="title">
          W<span className="hat-h2">HAT</span>
          <div>
            &nbsp;I<span className="do-h2"> DO</span>
          </div>
        </h2>
      </div>
      <div className="what-box">
        <div className="what-box-in">
          <div className="what-border2">
            <svg width="100%">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="100%"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="7,7"
              />
              <line
                x1="100%"
                y1="0"
                x2="100%"
                y2="100%"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="7,7"
              />
            </svg>
          </div>
          <div
            className="what-content what-noTouch"
            ref={(el) => setRef(el, 0)}
            onMouseEnter={handleContentEnter}
            onMouseLeave={handleContentLeave}
            onKeyDown={handleCardKey}
            tabIndex={0}
            role="button"
            aria-expanded={false}
            aria-label={`${config.skills.develop.title} details`}
          >
            <div className="what-border1">
              <svg height="100%">
                <line
                  x1="0"
                  y1="0"
                  x2="100%"
                  y2="0"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>
            <div className="what-corner"></div>

            <div className="what-content-in">
              <h3>{config.skills.develop.title}</h3>
              <h4>{config.skills.develop.description}</h4>
              <p>
                {config.skills.develop.details}
              </p>
              <h5>Skillset & tools</h5>
              <div className="what-content-flex">
                {config.skills.develop.tools.map((tool, index) => (
                  <div key={index} className="what-tags">{tool}</div>
                ))}
              </div>
              <div className="what-arrow"></div>
            </div>
          </div>
          <div
            className="what-content what-noTouch"
            ref={(el) => setRef(el, 1)}
            onMouseEnter={handleContentEnter}
            onMouseLeave={handleContentLeave}
            onKeyDown={handleCardKey}
            tabIndex={0}
            role="button"
            aria-expanded={false}
            aria-label={`${config.skills.design.title} details`}
          >
            <div className="what-border1">
              <svg height="100%">
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>
            <div className="what-corner"></div>
            <div className="what-content-in">
              <h3>{config.skills.design.title}</h3>
              <h4>{config.skills.design.description}</h4>
              <p>
                {config.skills.design.details}
              </p>
              <h5>Skillset & tools</h5>
              <div className="what-content-flex">
                {config.skills.design.tools.map((tool, index) => (
                  <div key={index} className="what-tags">{tool}</div>
                ))}
              </div>
              <div className="what-arrow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIDo;

function handleClick(container: HTMLDivElement) {
  const expanded = container.classList.toggle("what-content-active");
  container.setAttribute("aria-expanded", String(expanded));
  container.classList.remove("what-sibling");
  if (container.parentElement) {
    const siblings = Array.from(container.parentElement.children);

    siblings.forEach((sibling) => {
      if (sibling !== container) {
        sibling.classList.remove("what-content-active");
        if (sibling.classList.contains("what-content")) sibling.setAttribute("aria-expanded", "false");
        sibling.classList.toggle("what-sibling");
      }
    });
  }
}
