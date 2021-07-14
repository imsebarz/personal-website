import React from "react";
import "./assets/styles/mywork.scss";
import Project from "./Project";

const MyWork = () => {
  return (
    <section className="mywork" id="mywork">
      <h1 className="title">Some other work </h1>
      <div className="mywork-container">
        <Project />
        <Project />
        <Project />
        <Project />
        <Project />
        <Project />
      </div>
    </section>
  );
};

export default MyWork;
