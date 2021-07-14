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
      <h1 className="title">Get in touch</h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi minima
        beatae doloremque mollitia optio necessitatibus impedit, provident
        cupiditate excepturi sed?
      </p>
      <button>Say hello</button>
    </motion.section>
  );
};

export default Contact;
