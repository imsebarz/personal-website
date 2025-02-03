import { motion, useAnimation } from "framer-motion";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import "./assets/styles/contact.scss";
import { ContainerVariants } from "./animation";
import strings from "./assets/strings/contact.json";

const Contact = () => {
  const [ref, inView] = useInView();
  const animation = useAnimation();

  useEffect(() => {
    if (inView) {
      animation.start("visible");
    } else {
      animation.start("hidden");
    }
  }, [inView]);

  return (
    <motion.section
      className="contact"
      ref={ref}
      variants={ContainerVariants}
      initial="hidden"
      animate={animation}
    >
      <h1 className="title" id="contact">
        {strings.contactTitle}
      </h1>
      <p>
        {strings.contactText}
      </p>
      <a href={`mailto:${strings.socials.mail}`}>
        <button>{strings.contactButton}</button>
      </a>
    </motion.section>
  );
};

export default Contact;