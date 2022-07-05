import React from "react";
import "./walletChooser.css";

const WalletChooser = (props) => {
  console.log(props.wallets);
  return <div className="wc">{props.wallets}</div>;
};

export default WalletChooser;
