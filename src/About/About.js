import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTwitter, FaGithub } from "react-icons/fa";
import "./About.css";

const About = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [doneTyping, setDoneTyping] = useState(false);

  const bio = `My name is Youssef Ashraf, also known as tripz.
I'm a former esports player who competed in Tier 2 Valorant, participating in the Valorant Challengers league in the Middle East.
I also played Fortnite professionally.
Now, I'm a developer known as tripzcodes, an aspiring game dev mainly coding in C++, experienced with Unity & Unreal Engine.`;

  useEffect(() => {
    if (index < bio.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + bio[index]);
        setIndex(index + 1);
      }, 20);
      return () => clearTimeout(timeout);
    } else {
      setDoneTyping(true);
    }
  }, [index, bio]);

  return (
    <div className="about-container">
      <button className="home-button" onClick={() => navigate("/", { state: { skipIntro: true } })}>
        Home
      </button>

      <div className="about-content">
        <h1 className="about-title">About Me</h1>
        <div className="divider"></div>
        <p className={doneTyping ? "typed-text" : "typing-text"}>
          {text}
          {!doneTyping && <span className="cursor">|</span>}
        </p>

        <div className="social-links">
          <a href="https://x.com/tripz_cs" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FaTwitter />
          </a>
          <a href="https://github.com/tripzcodes" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FaGithub />
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
