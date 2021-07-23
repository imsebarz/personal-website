import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import "./assets/styles/aboutme.scss";
import { motion, useAnimation } from "framer-motion";
import { ContainerVariants } from "./animation";
import SebasAbout from "./assets/images/sebas.webp";

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
        About Me
      </motion.h1>
      <motion.div
        className="aboutme-container"
        animate={animation}
        variants={ContainerVariants}
        initial="hidden"
      >
        <motion.img src={SebasAbout} alt="" variants={ContainerVariants} />
        <div className="aboutme-text">
          <motion.p variants={ContainerVariants}>
            I'm Sebastian Ruiz. A web developer, an eternal learner, a creative.
            <strong>I have internet and technology in my veins.</strong>
          </motion.p>
          <motion.p variants={ContainerVariants}>
            I've been curious since I was little and I love to discover and
            learn new things. I am currently on my way to be a Systems Engineer
            at the University of Antioquia. Loving the way internet works made
            me focus on <strong>web development</strong> from now on.
          </motion.p>
          <motion.p variants={ContainerVariants}>
            Earlier in my life I learned about Design, Photography and
            Multimedia. Skills that have been very helpful in my career. The
            guiding principle of everything I do is:{" "}
            <strong>
              {" "}
              I learn and then teach, and teaching is the way I learn.
            </strong>
          </motion.p>
          <br />
          <motion.h3 variants={ContainerVariants}>
            Some technologies I've used
          </motion.h3>
          <motion.ul variants={ContainerVariants} className="tags">
            <motion.li>ReactJS</motion.li>
            <motion.li>Javascript</motion.li>
            <motion.li>CSS</motion.li>
            <motion.li>Sass</motion.li>
            <motion.li>HTML</motion.li>
            <motion.li>NodeJS</motion.li>
            <motion.li>MongoDB</motion.li>
            <motion.li>Webpack</motion.li>
            <motion.li>Parcel</motion.li>
          </motion.ul>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default AboutMe;
