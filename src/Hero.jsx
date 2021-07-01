import React from "react";
import "./styles/hero.scss";

const Hero = () => {
  return (
    <div className="hero">
      <div className="hero-info">
        <h1>Sebastian Ruiz P</h1>
        <h2>I build things for the web</h2>
        <p>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eligendi
          voluptate ipsam nemo officiis earum corporis id accusantium neque aut,
          voluptates repudiandae non quasi sapiente enim porro, error vero
          dolores eligendi.
        </p>
        <button>Hire Me!</button>
      </div>
      <img
        src="https://avatars.githubusercontent.com/u/21131739?v=4"
        alt="Sebarz Profile Photo"
      />
    </div>
  );
};

export default Hero;
