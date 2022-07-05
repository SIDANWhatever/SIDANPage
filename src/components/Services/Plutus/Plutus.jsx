import { Component, useState } from "react";
import "./plutus.css";
import {
  CoinSelectionStrategyCIP2,
  Address,
  BaseAddress,
  MultiAsset,
  Assets,
  ScriptHash,
  Costmdls,
  Language,
  CostModel,
  AssetName,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionOutput,
  Value,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionOutputBuilder,
  LinearFee,
  BigNum,
  BigInt,
  TransactionHash,
  TransactionInputs,
  TransactionInput,
  TransactionWitnessSet,
  Transaction,
  PlutusData,
  PlutusScripts,
  PlutusScript,
  PlutusList,
  Redeemers,
  Redeemer,
  RedeemerTag,
  Ed25519KeyHashes,
  ConstrPlutusData,
  ExUnits,
  Int,
  NetworkInfo,
  EnterpriseAddress,
  TransactionOutputs,
  hash_transaction,
  hash_script_data,
  hash_plutus_data,
  ScriptDataHash,
  ScriptAll,
  Ed25519KeyHash,
  NativeScript,
  NativeScripts,
  StakeCredential,
  Mint,
  MintAssets,
} from "@emurgo/cardano-serialization-lib-asmjs";
import WalletChooser from "./PlutusComponents/WalletChooser";
// import Loader from "../Loader";
let blake = require("blakejs");
let Buffer = require("buffer/").Buffer;

export class Plutus extends Component {
  componentDidMount() {
    this.loadWasm();
  }

  constructor(props) {
    super(props);

    this.state = {
      selectedTabId: "1",
      whichWalletSelected: undefined,
      walletFound: false,
      walletIsEnabled: false,
      walletName: undefined,
      walletIcon: undefined,
      walletAPIVersion: undefined,
      wallets: [],

      networkId: undefined,
      Utxos: undefined,
      CollatUtxos: undefined,
      balance: undefined,
      changeAddress: undefined,
      rewardAddress: undefined,
      usedAddress: undefined,

      txBody: undefined,
      txBodyCborHex_unsigned: "",
      txBodyCborHex_signed: "",
      submittedTxHash: "",

      addressBech32SendADA: "",
      lovelaceToSend: 3000000,
      assetNameHex: "",
      assetPolicyIdHex: "",
      assetAmountToSend: 5,
      addressScriptBech32: "",
      datumStr: "",
      plutusScriptCborHex: "",
      transactionIdLocked: "",
      transactionIndxLocked: 0,
      lovelaceLocked: 3000000,
      manualFee: 900000,
    };

    /**
     * When the wallet is connect it returns the connector which is
     * written to this API variable and all the other operations
     * run using this API object
     */
    this.API = undefined;

    /**
     * Protocol parameters
     * @type {{
     * keyDeposit: string,
     * coinsPerUtxoWord: string,
     * minUtxo: string,
     * poolDeposit: string,
     * maxTxSize: number,
     * priceMem: number,
     * maxValSize: number,
     * linearFee: {minFeeB: string, minFeeA: string}, priceStep: number
     * }}
     */
    this.protocolParams = {
      linearFee: {
        minFeeA: "44",
        minFeeB: "155381",
      },
      minUtxo: "34482",
      poolDeposit: "500000000",
      keyDeposit: "2000000",
      maxValSize: 5000,
      maxTxSize: 16384,
      priceMem: 0.0577,
      priceStep: 0.0000721,
      coinsPerUtxoWord: "34482",
    };

    this.pollWallets = this.pollWallets.bind(this);
  }

  pollWallets = (count = 0) => {
    console.log(window.cardano);
    const walletsToInclude = ["yoroi", "eternl", "nami", "typhoncip30"];
    const wallets = [];
    for (const key in window.cardano) {
      if (
        window.cardano[key].enable &&
        wallets.indexOf(key) === -1 &&
        walletsToInclude.indexOf(key) !== -1
      ) {
        wallets.push(key);
      }
    }
    if (wallets.length !== 4 && count < 3) {
      setTimeout(() => {
        this.pollWallets(count + 1);
      }, 2000);
      return;
    }
    this.setState(
      {
        wallets,
        // whichWalletSelected: wallets[0],
      },
      () => {
        this.refreshData();
      }
    );
  };

  handleWalletSelect = (obj) => {
    const whichWalletSelected = obj.target.value;
    this.setState({ whichWalletSelected }, () => {
      this.refreshData();
    });
  };

  checkIfWalletFound = () => {
    const walletKey = this.state.whichWalletSelected;
    const walletFound = !!window?.cardano?.[walletKey];
    this.setState({ walletFound });
    return walletFound;
  };

  checkIfWalletEnabled = async () => {
    let walletIsEnabled = false;

    try {
      const walletName = this.state.whichWalletSelected;
      walletIsEnabled = await window.cardano[walletName].isEnabled();
    } catch (err) {
      console.log(err);
    }
    this.setState({ walletIsEnabled });

    return walletIsEnabled;
  };

  enableWallet = async () => {
    const walletKey = this.state.whichWalletSelected;
    try {
      this.API = await window.cardano[walletKey].enable();
    } catch (err) {
      console.log(err);
    }
    return this.checkIfWalletEnabled();
  };

  getAPIVersion = () => {
    const walletKey = this.state.whichWalletSelected;
    const walletAPIVersion = window?.cardano?.[walletKey].apiVersion;
    this.setState({ walletAPIVersion });
    return walletAPIVersion;
  };

  getWalletName = () => {
    const walletKey = this.state.whichWalletSelected;
    const walletName = window?.cardano?.[walletKey].name;
    this.setState({ walletName });
    return walletName;
  };

  getNetworkId = async () => {
    try {
      const networkId = await this.API.getNetworkId();
      this.setState({ networkId });
    } catch (err) {
      console.log(err);
    }
  };

  getUtxos = async () => {
    let Utxos = [];

    try {
      const rawUtxos = await this.API.getUtxos();

      for (const rawUtxo of rawUtxos) {
        const utxo = TransactionUnspentOutput.from_bytes(
          Buffer.from(rawUtxo, "hex")
        );
        const input = utxo.input();
        const txid = Buffer.from(
          input.transaction_id().to_bytes(),
          "utf8"
        ).toString("hex");
        const txindx = input.index();
        const output = utxo.output();
        const amount = output.amount().coin().to_str(); // ADA amount in lovelace
        const multiasset = output.amount().multiasset();
        let multiAssetStr = "";

        if (multiasset) {
          const keys = multiasset.keys(); // policy Ids of thee multiasset
          const N = keys.len();
          // console.log(`${N} Multiassets in the UTXO`)

          for (let i = 0; i < N; i++) {
            const policyId = keys.get(i);
            const policyIdHex = Buffer.from(
              policyId.to_bytes(),
              "utf8"
            ).toString("hex");
            // console.log(`policyId: ${policyIdHex}`)
            const assets = multiasset.get(policyId);
            const assetNames = assets.keys();
            const K = assetNames.len();
            // console.log(`${K} Assets in the Multiasset`)

            for (let j = 0; j < K; j++) {
              const assetName = assetNames.get(j);
              const assetNameString = Buffer.from(
                assetName.name(),
                "utf8"
              ).toString();
              const assetNameHex = Buffer.from(
                assetName.name(),
                "utf8"
              ).toString("hex");
              const multiassetAmt = multiasset.get_asset(policyId, assetName);
              multiAssetStr += `+ ${multiassetAmt.to_str()} + ${policyIdHex}.${assetNameHex} (${assetNameString})`;
              // console.log(assetNameString)
              // console.log(`Asset Name: ${assetNameHex}`)
            }
          }
        }

        const obj = {
          txid: txid,
          txindx: txindx,
          amount: amount,
          str: `${txid} #${txindx} = ${amount}`,
          multiAssetStr: multiAssetStr,
          TransactionUnspentOutput: utxo,
        };
        Utxos.push(obj);
        // console.log(`utxo: ${str}`)
      }
      this.setState({ Utxos });
    } catch (err) {
      console.log(err);
    }
  };

  getCollateral = async () => {
    let CollatUtxos = [];

    try {
      let collateral = [];

      const wallet = this.state.whichWalletSelected;
      if (wallet === "nami") {
        collateral = await this.API.experimental.getCollateral();
      } else {
        collateral = await this.API.getCollateral();
      }

      for (const x of collateral) {
        const utxo = TransactionUnspentOutput.from_bytes(Buffer.from(x, "hex"));
        CollatUtxos.push(utxo);
        // console.log(utxo)
      }
      this.setState({ CollatUtxos });
    } catch (err) {
      console.log(err);
    }
  };

  getBalance = async () => {
    try {
      const balanceCBORHex = await this.API.getBalance();

      const balance = Value.from_bytes(Buffer.from(balanceCBORHex, "hex"))
        .coin()
        .to_str();
      this.setState({ balance });
    } catch (err) {
      console.log(err);
    }
  };

  getChangeAddress = async () => {
    try {
      const raw = await this.API.getChangeAddress();
      const changeAddress = Address.from_bytes(
        Buffer.from(raw, "hex")
      ).to_bech32();
      this.setState({ changeAddress });
    } catch (err) {
      console.log(err);
    }
  };

  getRewardAddresses = async () => {
    try {
      const raw = await this.API.getRewardAddresses();
      const rawFirst = raw[0];
      const rewardAddress = Address.from_bytes(
        Buffer.from(rawFirst, "hex")
      ).to_bech32();
      // console.log(rewardAddress)
      this.setState({ rewardAddress });
    } catch (err) {
      console.log(err);
    }
  };

  getUsedAddresses = async () => {
    try {
      const raw = await this.API.getUsedAddresses();
      const rawFirst = raw[0];
      const usedAddress = Address.from_bytes(
        Buffer.from(rawFirst, "hex")
      ).to_bech32();
      // console.log(rewardAddress)
      this.setState({ usedAddress });
    } catch (err) {
      console.log(err);
    }
  };

  refreshData = async () => {
    // this.generateScriptAddress();

    try {
      const walletFound = this.checkIfWalletFound();
      if (walletFound) {
        await this.getAPIVersion();
        await this.getWalletName();
        const walletEnabled = await this.enableWallet();
        if (walletEnabled) {
          await this.getNetworkId();
          await this.getUtxos();
          await this.getCollateral();
          await this.getBalance();
          await this.getChangeAddress();
          await this.getRewardAddresses();
          await this.getUsedAddresses();
        } else {
          await this.setState({
            Utxos: null,
            CollatUtxos: null,
            balance: null,
            changeAddress: null,
            rewardAddress: null,
            usedAddress: null,

            txBody: null,
            txBodyCborHex_unsigned: "",
            txBodyCborHex_signed: "",
            submittedTxHash: "",
          });
        }
      } else {
        await this.setState({
          walletIsEnabled: false,

          Utxos: null,
          CollatUtxos: null,
          balance: null,
          changeAddress: null,
          rewardAddress: null,
          usedAddress: null,

          txBody: null,
          txBodyCborHex_unsigned: "",
          txBodyCborHex_signed: "",
          submittedTxHash: "",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  connectWallet = () => {
    console.log("connecting");
    console.log(this.state.walletFound);
    console.log(this.state.walletIsEnabled);
    // this.enableWallet().then(this.refreshData());
  };

  selectWallet = async (item) => {
    this.setState(
      {
        whichWalletSelected: item,
      },
      () => {
        this.refreshData();
      }
    );
  };

  async componentDidMount() {
    this.pollWallets();
    await this.refreshData();
  }

  render() {
    return (
      <div className="p">
        <div className="p-main">
          <div className="p-header">
            <div className="p-title">Plutus DAPP Demo</div>
            <div className="p-cases">
              <div className="p-demos-space"></div>
              <div className="p-demos">
                <div>Simple Vesting</div>
              </div>
              <div className="p-demos">
                <div>Token Distributing</div>
              </div>
              <div className="p-wallet" onClick={() => this.connectWallet()}>
                {this.state.walletFound ? (
                  <img
                    src={window.cardano[this.state.whichWalletSelected].icon}
                    alt=""
                  />
                ) : (
                  <div>Connect Wallet</div>
                )}
              </div>
            </div>
          </div>
          <div className="p-content-card">
            <div className="p-wallet">
              {this.state.wallets.map((item) => (
                <div
                  className="p-wallet-box"
                  onClick={() => this.selectWallet(item)}
                  key={this.state.wallets[item]}
                >
                  <div className="p-wallet-icon-box">
                    <img
                      src={window.cardano[item].icon}
                      className="p-wallet-icon"
                    />
                  </div>
                  <div className="p-name">
                    <div className="p-name-text">
                      {window.cardano[item].name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Plutus;
