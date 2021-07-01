import React from "react";
import Nav from "./Nav";
import FloatRight from "./FloatRight";
import FloatLeft from "./FloatLeft";
import Hero from "./Hero";
import "./styles/global.scss";

const App = () => {
  return (
    <>
      <Nav></Nav>
      <FloatRight></FloatRight>
      <FloatLeft></FloatLeft>
      <Hero />
    </>
  );
};

export default App;
