import SidanIcon from "../Nav/icons/SidanIcon.png";
import "./landing.css";
import { useState } from "react";

const Landing = (props) => {
  const [title, setTitle] = useState("SIDAN");
  const [content, setContent] = useState(
    "Lorem idivsum dolor sit amet consectetur adipisicing elit. Animi quasi magnam voluptates fugiat aliquid incidunt placeat iusto eius accusamus. Rerum?Lorem ipsum dolor sit amet consectetur adipisicing elit. Animi quasi magnam voluptates fugiat aliquid incidunt placeat iusto eius accusamus. Rerum?"
  );
  const [link, setLink] = useState("/");

  const contentDesc = [
    [
      "Plutus Development",
      "Plutus: Lorem ipsum dolor sit amet consectetur, adipisicing elit. Reiciendis corrupti repudiandae dignissimos aperiam ad culpa, reprehenderit cum tempora magni dolorem odit alias in eius? Beatae eos facere facilis qui recusandae.",
      "/plutus",
    ],
    [
      "Cardano Stake Pool Operator",
      "Cardano SPO: Lorem ipsum dolor sit amet consectetur, adipisicing elit. Reiciendis corrupti repudiandae dignissimos aperiam ad culpa, reprehenderit cum tempora magni dolorem odit alias in eius? Beatae eos facere facilis qui recusandae.",
      "/spo",
    ],
    [
      "Full Stack Software Development",
      "Full Stack Software: Lorem ipsum dolor sit amet consectetur, adipisicing elit. Reiciendis corrupti repudiandae dignissimos aperiam ad culpa, reprehenderit cum tempora magni dolorem odit alias in eius? Beatae eos facere facilis qui recusandae.",
      "/fullstack",
    ],
    [
      "UI/UX Research & Design",
      "UI/UX: Lorem ipsum dolor sit amet consectetur, adipisicing elit. Reiciendis corrupti repudiandae dignissimos aperiam ad culpa, reprehenderit cum tempora magni dolorem odit alias in eius? Beatae eos facere facilis qui recusandae.",
      "/uiux",
    ],
  ];

  const changeContent = (index) => {
    setTitle(contentDesc[index][0]);
    setContent(contentDesc[index][1]);
    setLink(contentDesc[index][2]);
  };

  const checkFocus = (text, check) => {
    if (text == check) {
      return "true";
    } else {
      return "false";
    }
  };

  return (
    <div className="l">
      <div className="l-content-card"></div>
      <div className="l-content-box">
        <div className="l-content">
          <div className="l-content-words">
            <div className="l-content-words-h">
              <div>{title}</div>
            </div>
            <div className="l-content-words-p">
              <div>{content}</div>
              <button onClick={() => props.navigatePage(link)}>
                Read More
              </button>
            </div>
          </div>
          <div className="l-content-services">
            <div className="l-content-service-card-l">
              <div
                className="l-content-service-card"
                l-text-focus={checkFocus(contentDesc[0][0], title)}
                onClick={() => changeContent(0)}
              >
                <div
                  className="l-service-card-frame"
                  l-frame-focus={checkFocus(contentDesc[0][0], title)}
                >
                  <img src={SidanIcon} alt="" />
                  <div className="l-text">Plutus Development</div>
                </div>
              </div>
              <div
                className="l-content-service-card"
                l-text-focus={checkFocus(contentDesc[1][0], title)}
                onClick={() => changeContent(1)}
              >
                <div
                  className="l-service-card-frame"
                  l-frame-focus={checkFocus(contentDesc[1][0], title)}
                >
                  <img src={SidanIcon} alt="" />
                  <div className="l-text">Cardano Stake Pool</div>
                </div>
              </div>
            </div>
            <div className="l-content-service-card-r">
              <div
                className="l-content-service-card"
                l-text-focus={checkFocus(contentDesc[2][0], title)}
                onClick={() => changeContent(2)}
              >
                <div
                  className="l-service-card-frame"
                  l-frame-focus={checkFocus(contentDesc[2][0], title)}
                >
                  <img src={SidanIcon} alt="" />
                  <div className="l-text">Full Stack Development</div>
                </div>
              </div>
              <div
                className="l-content-service-card"
                l-text-focus={checkFocus(contentDesc[3][0], title)}
                onClick={() => changeContent(3)}
              >
                <div
                  className="l-service-card-frame"
                  l-frame-focus={checkFocus(contentDesc[3][0], title)}
                >
                  <img src={SidanIcon} alt="" />
                  <div className="l-text">UI/UX Design</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
