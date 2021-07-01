import React from "react";
import "./styles/nav.scss";

const Nav = () => {
  return (
    <nav className="Nav">
      <h1>Sebarz</h1>
      <ul>
        <li>About me</li>
        <li>Proyects</li>
        <li>Contact</li>
        <button>Resume</button>
      </ul>
    </nav>
  );
};

export default Nav;
