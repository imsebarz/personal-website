import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./assets/styles/hero.scss";
import Sebas from "./assets/images/hero.webp";
import { ContainerVariants } from "./animation";

const Hero = () => {
  const [bgHeight, setBgHeight] = useState(0);

  useEffect(() => {
    const hero = document.querySelector(".hero");
    function handleResize() {
      setBgHeight(hero.clientHeight);
      console.log(hero.clientHeight);
    }
    setTimeout(() => {
      handleResize();
    }, 0);
    window.addEventListener("resize", handleResize);
  }, []);

  return (
    <section className="hero">
      <div className="hero-bg" style={{ height: bgHeight + 120 + "px" }}></div>
      <motion.div
        className="hero-info"
        variants={ContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={ContainerVariants}>
          👋 Hi there! My name is
        </motion.p>
        <motion.h1 variants={ContainerVariants}>Sebastian Ruiz</motion.h1>
        <motion.h2 variants={ContainerVariants}>
          I <del>break</del> build things for the web
        </motion.h2>
        <motion.a href="#featuredProjects">
          <motion.button variants={ContainerVariants}>
            Go to Projects
          </motion.button>
        </motion.a>
      </motion.div>
      <motion.img
        variants={ContainerVariants}
        initial="hidden"
        animate="visible"
        src={Sebas}
        alt="Sebarz Profile Photo"
      />
    </section>
  );
};

export default Hero;
