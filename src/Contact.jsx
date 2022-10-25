import { motion, useAnimation } from "framer-motion";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import "./assets/styles/contact.scss";
import { ContainerVariants } from "./animation";

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
        Get in touch
      </h1>
      <p>
        I am willing to work with you or with your company, wherever you are
        from, in any challenge that involves web development, systems
        engineering or any creative process
      </p>
      <a href="mailto:imsebarz@gmail.com">
        <button>Say hello</button>
      </a>
    </motion.section>
  );
};

export default Contact;
