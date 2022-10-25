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
            <strong> I have internet and technology in my veins.</strong>
          </motion.p>
          <motion.p variants={ContainerVariants}>
            My work focuses on building Web Applications (And everything in
            between) using State of the Art web technologies such as{" "}
            <strong>
              {" "}
              React, NextJS, Javascript, Typescript, Webpack, etc.
            </strong>{" "}
            My self-taught spirit drives me to never stop learning.
          </motion.p>

            <motion.p variants={ContainerVariants}>
            I also have a big passion for being a person who
            <strong> shares knowledge </strong> and <strong> teaches people</strong> about
            whatever I learn, that's why I also work as a <strong> Mentor with the local
            communities </strong>to engage new people into the ecosystems and encourage
            them to build amazing things.
            </motion.p>
            
          <motion.p variants={ContainerVariants}>
            As a complement to my skills on the
            Web, I have learned about <strong> blockchain technologies </strong>such as
            <strong> Web3JS, HardHat, and Solidity Programming </strong> to deliver highly efficient
            Decentralized Apps and Smart contracts.
           </motion.p>
            
          <motion.p variants={ContainerVariants}>
            Earlier in my life I learned about{" "}
            <a href="https://www.behance.net/imsebarz" target="_blank">
              Design
            </a>
            , photography and Filmmaking. Skills that have been very helpful in
            my career. The guiding principle of everything I do is:{" "}
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
            <motion.li>Javascript</motion.li>
            <motion.li>Typescript</motion.li>
            <motion.li>ReactJS</motion.li>
            <motion.li>NextJS</motion.li>
            <motion.li>CSS</motion.li>
            <motion.li>Sass</motion.li>
            <motion.li>Styled components</motion.li>
            <motion.li>HTML</motion.li>
            <motion.li>NodeJS</motion.li>
            <motion.li>MongoDB</motion.li>
            <motion.li>CI/CD</motion.li>
            <motion.li>Git/Github</motion.li>
            <motion.li>Github Actions</motion.li>
            <motion.li>Webpack</motion.li>
            <motion.li>Parcel</motion.li>
            <motion.li>Solidity</motion.li>
            <motion.li>Hardhat</motion.li>
            <motion.li>Unit Testing</motion.li>
            <motion.li>Microfrontends</motion.li>
          </motion.ul>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default AboutMe;
