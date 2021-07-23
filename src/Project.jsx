import { motion, useAnimation } from "framer-motion";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import "./assets/styles/project.scss";
import { ContainerVariants } from "./animation";

const Project = ({ name, description, tags, githubRepo, demo }) => {
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
      className="project"
      ref={ref}
      variants={ContainerVariants}
      initial="hidden"
      animate={animation}
    >
      <div className="project-header">
        <svg
          width="36"
          height="32"
          id="folder"
          viewBox="0 0 23 21"
          fill="#04a175"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21.5928 17.8992V7.89919C21.5928 7.36875 21.3821 6.86004 21.007 6.48497C20.6319 6.1099 20.1232 5.89919 19.5928 5.89919H12.8288C12.4573 5.89917 12.0931 5.79569 11.7771 5.60034C11.4612 5.40499 11.2058 5.1255 11.0398 4.79319L10.1458 3.00519C9.97964 2.67272 9.72415 2.39312 9.40797 2.19776C9.0918 2.00241 8.72744 1.89901 8.35577 1.89919H3.59277C3.06234 1.89919 2.55363 2.1099 2.17856 2.48497C1.80349 2.86004 1.59277 3.36875 1.59277 3.89919V17.8992C1.59277 18.4296 1.80349 18.9383 2.17856 19.3134C2.55363 19.6885 3.06234 19.8992 3.59277 19.8992H19.5928C20.1232 19.8992 20.6319 19.6885 21.007 19.3134C21.3821 18.9383 21.5928 18.4296 21.5928 17.8992Z"
            stroke="black"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="project-links">
          <a href={githubRepo} target="_blank">
            <svg
              width="19"
              height="19"
              viewBox="0 0 25 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="Github">
                <path
                  id="Vector"
                  d="M12.5516 0.454773C5.92157 0.454773 0.551575 5.82477 0.551575 12.4548C0.551575 17.7648 3.98657 22.2498 8.75657 23.8398C9.35657 23.9448 9.58157 23.5848 9.58157 23.2698C9.58157 22.9848 9.56658 22.0398 9.56658 21.0348C6.55157 21.5898 5.77157 20.2998 5.53157 19.6248C5.39657 19.2798 4.81157 18.2148 4.30157 17.9298C3.88157 17.7048 3.28157 17.1498 4.28657 17.1348C5.23157 17.1198 5.90657 18.0048 6.13157 18.3648C7.21157 20.1798 8.93657 19.6698 9.62657 19.3548C9.73157 18.5748 10.0466 18.0498 10.3916 17.7498C7.72157 17.4498 4.93157 16.4148 4.93157 11.8248C4.93157 10.5198 5.39657 9.43977 6.16157 8.59977C6.04157 8.29977 5.62157 7.06977 6.28157 5.41977C6.28157 5.41977 7.28657 5.10477 9.58157 6.64977C10.5416 6.37977 11.5616 6.24477 12.5816 6.24477C13.6016 6.24477 14.6216 6.37977 15.5816 6.64977C17.8766 5.08977 18.8816 5.41977 18.8816 5.41977C19.5416 7.06977 19.1216 8.29977 19.0016 8.59977C19.7666 9.43977 20.2316 10.5048 20.2316 11.8248C20.2316 16.4298 17.4266 17.4498 14.7566 17.7498C15.1916 18.1248 15.5666 18.8448 15.5666 19.9698C15.5666 21.5748 15.5516 22.8648 15.5516 23.2698C15.5516 23.5848 15.7766 23.9598 16.3766 23.8398C18.7588 23.0355 20.8288 21.5045 22.2952 19.4621C23.7617 17.4198 24.5509 14.9691 24.5516 12.4548C24.5516 5.82477 19.1816 0.454773 12.5516 0.454773Z"
                  fill="black"
                />
              </g>
            </svg>
          </a>
          <a href={demo} target="_blank">
            <svg
              width="19"
              height="19"
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
      <h3 className="project-title">{name}</h3>
      <p className="project-desc">{description}</p>
      <ul className="tags">
        {tags.map((tag) => (
          <li key={tags.indexOf(tag)}>{tag}</li>
        ))}
      </ul>
    </motion.div>
  );
};

export default Project;
