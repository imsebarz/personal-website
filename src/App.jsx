import React from "react";
import Nav from "./Nav";
import FloatSocial from "./FloatSocial";
import Hero from "./Hero";
import "./assets/styles/global.scss";
import AboutMe from "./AboutMe";
import MyWork from "./MyWork";
import FeaturedProjects from "./FeaturedProjects";
import Footer from "./Footer";
import Contact from "./Contact";

const App = () => {
  return (
    <>
      <Nav></Nav>
      <main>
        <FloatSocial />
        <Hero />
        <AboutMe />
        <FeaturedProjects />
        <MyWork />
        <Contact />
      </main>
      <Footer />
    </>
  );
};

export default App;
