import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import "./assets/styles/aboutme.scss";
import { motion, useAnimation } from "framer-motion";
import { ContainerVariants } from "./animation";

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
        <motion.img
          src="https://avatars.githubusercontent.com/u/21131739?v=4"
          alt=""
          variants={ContainerVariants}
        />
        <div className="aboutme-text">
          <motion.p variants={ContainerVariants}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quod
            ducimus delectus eveniet nihil aperiam sint, voluptatibus aut at
            eligendi aspernatur ut itaque necessitatibus deserunt labore
            laudantium, nobis praesentium vero similique harum ab nisi. Saepe
            aperiam unde nesciunt fugit eum possimus quibusdam consequuntur,
            quia quam hic. Nam consequuntur a repellendus aut.
          </motion.p>
          <motion.p variants={ContainerVariants}>
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptates
            atque necessitatibus rem sequi quam earum pariatur accusamus sint
            officia, officiis aut autem veniam? Suscipit maiores laboriosam
            illum assumenda blanditiis corrupti facilis, repudiandae debitis
            fuga aspernatur totam, nemo ab similique aut nostrum at iure
            eligendi autem tempore iste tenetur dicta, necessitatibus labore.
            Facere hic in ut minima qui magni accusamus optio.
          </motion.p>
          <motion.h3 variants={ContainerVariants}>
            Tecnologies I have used
          </motion.h3>
          <motion.ul variants={ContainerVariants}>
            <motion.li>React</motion.li>
            <motion.li>Javascript</motion.li>
            <motion.li>CSS</motion.li>
            <motion.li>HTML</motion.li>
            <motion.li>NodeJS</motion.li>
            <motion.li>MongoDB</motion.li>
            <motion.li>Webpack</motion.li>
          </motion.ul>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default AboutMe;
