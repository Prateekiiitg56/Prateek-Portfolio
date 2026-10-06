import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cursor = cursorRef.current!;
    if (window.matchMedia("(hover: none)").matches) return;

    const setX = gsap.quickSetter(cursor, "x", "px");
    const setY = gsap.quickSetter(cursor, "y", "px");
    const mouse = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let pinned: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    // one delegated listener also covers elements mounted later (modals, routes)
    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      cursor.classList.remove("cursor-disable", "cursor-icons");
      pinned = null;
      if (!target) return;
      if (target.dataset.cursor === "icons") {
        const rect = target.getBoundingClientRect();
        cursor.classList.add("cursor-icons");
        cursor.style.setProperty("--cursorH", `${rect.height}px`);
        pinned = target;
      } else if (target.dataset.cursor === "disable") {
        cursor.classList.add("cursor-disable");
      }
    };

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (pinned) {
        const rect = pinned.getBoundingClientRect();
        pos.x += (rect.left - pos.x) / 4;
        pos.y += (rect.top - pos.y) / 4;
      } else {
        pos.x += (mouse.x - pos.x) / 6;
        pos.y += (mouse.y - pos.y) / 6;
      }
      setX(pos.x);
      setY(pos.y);
    };
    loop();

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef} aria-hidden="true"></div>;
};

export default Cursor;
