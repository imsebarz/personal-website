import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import "./assets/styles/aboutme.scss";
import { motion, useAnimation } from "framer-motion";
import { ContainerVariants } from "./animation";
import SebasAbout from "./assets/images/sebas.webp";
import strings from "./aboutme.json";

const AboutMe = () => {
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
    <motion.section className="aboutme" id="aboutme" ref={ref}>
      <motion.h1
        className="title"
        animate={animation}
        variants={ContainerVariants}
        initial="hidden"
      >
        {strings.aboutMeTitle}
      </motion.h1>
      <motion.div
        className="aboutme-container"
        animate={animation}
        variants={ContainerVariants}
        initial="hidden"
      >
        <motion.img src={SebasAbout} alt="" variants={ContainerVariants} />
        <div className="aboutme-text">
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText1 }} />
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText2 }} />
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText3 }} />
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText4 }} />
          <motion.p variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.aboutMeText5 }} />
          <br />
          <motion.h3 variants={ContainerVariants}>
            {strings.someTechnologiesTitle}
          </motion.h3>
          <motion.ul variants={ContainerVariants} className="tags">
            {strings.technologies.map((tech, index) => (
              <motion.li key={index}>{tech}</motion.li>
            ))}
          </motion.ul>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default AboutMe;