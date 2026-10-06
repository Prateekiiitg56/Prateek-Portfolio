import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenis } from "./Navbar";
import "./styles/Story.css";

gsap.registerPlugin(ScrollTrigger);

/** The page read as a story: each section is a chapter. */
const CHAPTERS = [
  { selector: ".landing-section", title: "Hello" },
  { selector: ".about-section", title: "Who I am" },
  { selector: ".whatIDO", title: "What I do" },
  { selector: ".career-section", title: "The journey" },
  { selector: ".work-section", title: "What I've built" },
  { selector: ".techstack-new", title: "My toolbox" },
  { selector: ".contact-section", title: "Let's talk" },
] as const;

const chapterLabel = (index: number) =>
  index === 0 ? "Prologue" : `Chapter ${String(index).padStart(2, "0")}`;

/** Small "Chapter 0X — Title" kicker that draws itself in on scroll. */
export const ChapterTag = ({ index, center = false }: { index: number; center?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gsap.fromTo(
      el.children,
      { autoAlpha: 0, y: 14 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div className={`chapter-tag${center ? " chapter-tag-center" : ""}`} ref={ref}>
      <span className="chapter-tag-num">{chapterLabel(index)}</span>
      <span className="chapter-tag-line" />
      <span className="chapter-tag-title">{CHAPTERS[index].title}</span>
    </div>
  );
};

/** Fixed side rail: shows which chapter you are reading and overall progress. */
const StoryProgress = () => {
  const [active, setActive] = useState(0);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggers = CHAPTERS.map((chapter, index) =>
      ScrollTrigger.create({
        trigger: chapter.selector,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && setActive(index),
      })
    );
    const fill = gsap.fromTo(
      fillRef.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
      }
    );
    return () => {
      triggers.forEach((t) => t.kill());
      fill.scrollTrigger?.kill();
      fill.kill();
    };
  }, []);

  const jump = (selector: string) => {
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { duration: 1.5 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className={`story-rail${active === 0 ? " is-prologue" : ""}`} aria-label="Story chapters">
      <div className="story-rail-track">
        <div className="story-rail-fill" ref={fillRef} />
      </div>
      <ol>
        {CHAPTERS.map((chapter, index) => (
          <li key={chapter.selector} className={index === active ? "is-active" : index < active ? "is-read" : ""}>
            <button type="button" onClick={() => jump(chapter.selector)} data-cursor="disable">
              <span className="story-rail-dot" />
              <span className="story-rail-label">
                <small>{chapterLabel(index)}</small>
                {chapter.title}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default StoryProgress;
