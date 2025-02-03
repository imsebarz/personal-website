import React from "react";
import "./assets/styles/floatmail.scss";
import strings from "./assets/strings/contact.json";

const FloatRight = () => {
  return (
    <div className="floating-mail">
      <div className="floating-line"></div>
      <a className="mail" href={`mailto:${strings.socials.mail}`}>
        {strings.socials.mail}
      </a>
    </div>
  );
};

export default FloatRight;
