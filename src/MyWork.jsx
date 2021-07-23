import React from "react";
import "./assets/styles/mywork.scss";
import Project from "./Project";
import Projects from "./projects.json";
const { projects } = Projects;

const MyWork = () => {
  return (
    <section className="mywork" id="mywork">
      <h1 className="title">Some other work </h1>
      <div className="mywork-container">
        {projects.map((item) => {
          if (!item.featured) {
            return <Project {...item} key={item.id} />;
          }
        })}
      </div>
    </section>
  );
};

export default MyWork;
