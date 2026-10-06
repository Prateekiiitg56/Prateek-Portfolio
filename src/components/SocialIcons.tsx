import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { useEffect } from "react";
import HoverLinks from "./HoverLinks";
import { config } from "../config";

const SocialIcons = () => {
  useEffect(() => {
    const social = document.getElementById("social") as HTMLElement;
    const icons = Array.from(social.querySelectorAll<HTMLElement>("span")).map((elem) => ({
      elem,
      link: elem.querySelector("a") as HTMLElement,
      target: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
    }));

    // magnetic icons: each icon eases toward the cursor while it is close
    const onMouseMove = (e: MouseEvent) => {
      icons.forEach(({ elem, target }) => {
        const rect = elem.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const near = x < 40 && x > 10 && y < 40 && y > 5;
        target.x = near ? x : rect.width / 2;
        target.y = near ? y : rect.height / 2;
      });
    };

    let raf = 0;
    const update = () => {
      raf = requestAnimationFrame(update);
      icons.forEach(({ link, target, current }) => {
        current.x += (target.x - current.x) * 0.1;
        current.y += (target.y - current.y) * 0.1;
        link.style.setProperty("--siLeft", `${current.x}px`);
        link.style.setProperty("--siTop", `${current.y}px`);
      });
    };
    icons.forEach(({ elem, target, current }) => {
      const rect = elem.getBoundingClientRect();
      target.x = current.x = rect.width / 2;
      target.y = current.y = rect.height / 2;
    });
    update();
    document.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a href={config.contact.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <FaGithub />
          </a>
        </span>
        <span>
          <a href={config.contact.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FaLinkedinIn />
          </a>
        </span>
        {config.contact.twitter && (
          <span>
            <a href={config.contact.twitter} target="_blank" rel="noopener noreferrer">
              <FaXTwitter />
            </a>
          </span>
        )}
        {config.contact.instagram && (
          <span>
            <a href={config.contact.instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          </span>
        )}
      </div>
      <a className="resume-button" href={config.resumeUrl} target="_blank" rel="noopener noreferrer">
        <HoverLinks text="RESUME" />
        <span>
          <TbNotes />
        </span>
      </a>
    </div>
  );
};

export default SocialIcons;
