import React from "react";
import "./assets/styles/footer.scss";
import strigns from "./assets/strings/contact.json";

const Footer = () => {
  return (
    <section className="footer">
      <p>
        Made with 💛 by{" "}
        <a href={strigns.socials.github} target="_blank">
          {strigns.socials.username}
        </a>
      </p>
    </section>
  );
};

export default Footer;
