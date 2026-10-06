import { TextSplitter } from "../../utils/textSplitter";
import gsap from "gsap";
import { lenis } from "../Navbar";

export function initialFX() {
  document.body.style.overflowY = "auto";
  if (lenis) {
    lenis.start();
  }
  document.getElementsByTagName("main")[0].classList.add("main-active");

  const selectors = [".landing-info h3", ".landing-intro h2", ".landing-intro h1"];
  const elements = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
  const landingText = new TextSplitter(elements, {
    type: "chars,lines",
    linesClass: "split-line",
  });
  gsap.fromTo(
    landingText.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  const TextProps = { type: "chars,lines", linesClass: "split-h2" };

  const landingText2 = new TextSplitter(".landing-h2-info", TextProps);
  gsap.fromTo(
    landingText2.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  gsap.fromTo(
    ".landing-info-h2",
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      y: 0,
      delay: 0.8,
    }
  );
  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      delay: 0.1,
    }
  );

  const landingText3 = new TextSplitter(".landing-h2-info-1", TextProps);
  const landingText4 = new TextSplitter(".landing-h2-1", TextProps);
  const landingText5 = new TextSplitter(".landing-h2-2", TextProps);

  // phones hide the alternate words (Landing.css); swapping would leave the line empty
  const alternatesShown = getComputedStyle(document.querySelector(".landing-h2-2")!).display !== "none";
  if (alternatesShown) {
    LoopText(landingText2, landingText3);
    LoopText(landingText4, landingText5);
  }
}

/** Endlessly swaps two stacked words: the current one slides up and out, the next slides in. */
function LoopText(first: TextSplitter, second: TextSplitter) {
  gsap.set(second.chars, { yPercent: 100, opacity: 0 });
  const tl = gsap.timeline({ repeat: -1, delay: 1.5 });
  const swap = (out: TextSplitter, next: TextSplitter) =>
    tl
      .to(out.chars, { yPercent: -100, opacity: 0, duration: 0.8, ease: "power3.inOut", stagger: 0.03 }, "+=2.6")
      .fromTo(
        next.chars,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, ease: "power3.inOut", stagger: 0.03, immediateRender: false },
        "<0.15"
      );
  swap(first, second);
  swap(second, first);
}
