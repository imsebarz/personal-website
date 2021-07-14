import { motion, useAnimation } from "framer-motion";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import "./assets/styles/featuredproject.scss";
import { ContainerVariants } from "./animation";

const FeaturedProject = ({ direction }) => {
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
    <motion.div
      className={`ftProject ${direction}`}
      ref={ref}
      variants={ContainerVariants}
      initial="hidden"
      animate={animation}
    >
      <div className="ftProject-image">
        <a href="#contact">
          <img
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=702&q=80"
            alt=""
          />
        </a>
      </div>
      <div className="ftProject-content">
        <h1>Hola como estas</h1>
        <div className="desc">
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas,
            nobis! Rem blanditiis eveniet minima cumque provident architecto
            ipsa labore fugit!
          </p>
        </div>
        <ul>
          <li>JS</li>
          <li>HTML</li>
          <li>React</li>
          <li>Webpack</li>
        </ul>
        <div className="ftProject-links">
          <a href="" target="_blank">
            <svg
              width="21"
              height="21"
              viewBox="0 0 25 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="Github">
                <path
                  id="Vector"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12.5516 0.454773C5.92157 0.454773 0.551575 5.82477 0.551575 12.4548C0.551575 17.7648 3.98657 22.2498 8.75657 23.8398C9.35657 23.9448 9.58157 23.5848 9.58157 23.2698C9.58157 22.9848 9.56658 22.0398 9.56658 21.0348C6.55157 21.5898 5.77157 20.2998 5.53157 19.6248C5.39657 19.2798 4.81157 18.2148 4.30157 17.9298C3.88157 17.7048 3.28157 17.1498 4.28657 17.1348C5.23157 17.1198 5.90657 18.0048 6.13157 18.3648C7.21157 20.1798 8.93657 19.6698 9.62657 19.3548C9.73157 18.5748 10.0466 18.0498 10.3916 17.7498C7.72157 17.4498 4.93157 16.4148 4.93157 11.8248C4.93157 10.5198 5.39657 9.43977 6.16157 8.59977C6.04157 8.29977 5.62157 7.06977 6.28157 5.41977C6.28157 5.41977 7.28657 5.10477 9.58157 6.64977C10.5416 6.37977 11.5616 6.24477 12.5816 6.24477C13.6016 6.24477 14.6216 6.37977 15.5816 6.64977C17.8766 5.08977 18.8816 5.41977 18.8816 5.41977C19.5416 7.06977 19.1216 8.29977 19.0016 8.59977C19.7666 9.43977 20.2316 10.5048 20.2316 11.8248C20.2316 16.4298 17.4266 17.4498 14.7566 17.7498C15.1916 18.1248 15.5666 18.8448 15.5666 19.9698C15.5666 21.5748 15.5516 22.8648 15.5516 23.2698C15.5516 23.5848 15.7766 23.9598 16.3766 23.8398C18.7588 23.0355 20.8288 21.5045 22.2952 19.4621C23.7617 17.4198 24.5509 14.9691 24.5516 12.4548C24.5516 5.82477 19.1816 0.454773 12.5516 0.454773Z"
                  fill="black"
                />
              </g>
            </svg>
          </a>
          <a href="" target="_blank">
            <svg
              width="21"
              height="21"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.2703 0.814453L13.5633 4.10745L6.56329 11.1075L7.97729 12.5215L14.9773 5.52145L18.2703 8.81445V0.814453H10.2703Z"
                fill="black"
              />
              <path
                d="M16.2703 16.8145H2.27026V2.81445H9.27026L7.27026 0.814453H2.27026C1.16726 0.814453 0.270264 1.71145 0.270264 2.81445V16.8145C0.270264 17.9175 1.16726 18.8145 2.27026 18.8145H16.2703C17.3733 18.8145 18.2703 17.9175 18.2703 16.8145V11.8145L16.2703 9.81445V16.8145Z"
                fill="black"
              />
            </svg>
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default FeaturedProject;
