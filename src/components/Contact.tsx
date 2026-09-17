import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";
import { config } from "../config";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate } from "animejs";
import { useEffect, useCallback } from "react";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  useEffect(() => {
    const contactTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-section",
        start: "top 80%",
        end: "bottom center",
        toggleActions: "play none none none",
      },
    });

    // Animate title from bottom
    contactTimeline.fromTo(
      ".contact-section h3",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      }
    );

    // Animate contact boxes with stagger from bottom
    contactTimeline.fromTo(
      ".contact-box",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
      },
      "-=0.4"
    );

    // Clean up
    return () => {
      contactTimeline.kill();
    };
  }, []);

  // Squish micro-interaction on social links
  const handleSocialDown = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    animate(e.currentTarget, {
      scale: 0.92,
      duration: 100,
      ease: 'inQuad',
    });
  }, []);

  const handleSocialUp = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    animate(e.currentTarget, {
      scale: 1,
      duration: 400,
      ease: 'outElastic(1, 0.4)',
    });
  }, []);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>{config.developer.fullName}</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${config.contact.email}`} data-cursor="disable">
                {config.contact.email}
              </a>
            </p>
            <h4>Location</h4>
            <p>
              <span>{config.social.location}</span>
            </p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            <a
              href={config.contact.github}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
              onMouseDown={handleSocialDown}
              onMouseUp={handleSocialUp}
              onMouseLeave={handleSocialUp}
            >
              Github <MdArrowOutward />
            </a>
            <a
              href={config.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
              onMouseDown={handleSocialDown}
              onMouseUp={handleSocialUp}
              onMouseLeave={handleSocialUp}
            >
              Linkedin <MdArrowOutward />
            </a>
            {config.contact.twitter && (
              <a
                href={config.contact.twitter}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-social"
                onMouseDown={handleSocialDown}
                onMouseUp={handleSocialUp}
                onMouseLeave={handleSocialUp}
              >
                Twitter <MdArrowOutward />
              </a>
            )}
            {config.contact.facebook && (
              <a
                href={config.contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-social"
                onMouseDown={handleSocialDown}
                onMouseUp={handleSocialUp}
                onMouseLeave={handleSocialUp}
              >
                Facebook <MdArrowOutward />
              </a>
            )}
            {config.contact.instagram && (
              <a
                href={config.contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-social"
                onMouseDown={handleSocialDown}
                onMouseUp={handleSocialUp}
                onMouseLeave={handleSocialUp}
              >
                Instagram <MdArrowOutward />
              </a>
            )}
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>{config.developer.fullName}</span>
            </h2>
            <h5>
              <MdCopyright /> {new Date().getFullYear()}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
