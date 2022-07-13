import { useEffect } from "react";
import "./fullstack.css";
import io from "socket.io-client";
// const socket = io.connect("http://localhost:3001");

const FullStack = () => {
  // useEffect(() => {
  //   console.log("Hi");
  // }, []);

  // const sendMessage = () => {
  //   socket.emit("send_message", { message: "Hello" });
  // };

  return (
    <div className="fs">
      <div className="fs-main">
        {/* <button onClick={sendMessage}>hi</button> */}
      </div>
    </div>
  );
};

export default FullStack;
