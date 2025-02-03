import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./assets/styles/hero.scss";
import Sebas from "./assets/images/hero.webp";
import { ContainerVariants } from "./animation";
import strings from "./assets/strings/contact.json";

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
          {strings.hero.greeting}
        </motion.p>
        <motion.h1 variants={ContainerVariants}>
          {strings.hero.name}
        </motion.h1>
        <motion.h2 variants={ContainerVariants} dangerouslySetInnerHTML={{ __html: strings.hero.description }} />
        <motion.a href="#featuredProjects">
          <motion.button variants={ContainerVariants}>
            {strings.hero.buttonText}
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