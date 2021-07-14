import React, { useEffect } from "react";
import FeaturedProject from "./FeaturedProject";
import "./assets/styles/featuredprojects.scss";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ContainerVariants } from "./animation";

const FeaturedProjects = () => {
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
    <section className="featuredProjects" id="featuredProjects" ref={ref}>
      <motion.h1
        className="title"
        variants={ContainerVariants}
        initial="hidden"
        animate={animation}
      >
        Featured Projects
      </motion.h1>
      <div className="featuredProjects-container">
        <FeaturedProject direction="rigth" />
        <FeaturedProject direction="left" />
        <FeaturedProject direction="rigth" />
      </div>
    </section>
  );
};

export default FeaturedProjects;
