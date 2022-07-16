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


export const initTransactionBuilder = async ({iMinFeeA, iMinFeeB, iPoolDeposit, iKeyDeposit, iCoinsPerUtxoWord, iMaxValSize, iMaxTxSize}) => {
  const txBuilder = TransactionBuilder.new(
    TransactionBuilderConfigBuilder.new()
      .fee_algo(
        LinearFee.new(
          BigNum.from_str(iMinFeeA),
          BigNum.from_str(iMinFeeB)
        )
      )
      .pool_deposit(BigNum.from_str(iPoolDeposit))
      .key_deposit(BigNum.from_str(iKeyDeposit))
      .coins_per_utxo_word(
        BigNum.from_str(iCoinsPerUtxoWord)
      )
      .max_value_size(iMaxValSize)
      .max_tx_size(iMaxTxSize)
      .prefer_pure_change(true)
      .build()
  );

  return txBuilder;
};

/**
 * Builds an object with all the UTXOs from the user's wallet
 * @returns {Promise<TransactionUnspentOutputs>}
 */
export const getTxUnspentOutputs = async (iUtxos) => {
  let txOutputs = TransactionUnspentOutputs.new();
  for (const utxo of iUtxos) {
    txOutputs.add(utxo.TransactionUnspentOutput);
  }
  return txOutputs;
};

/**
 * The transaction is build in 3 stages:
 * 1 - initialize the Transaction Builder
 * 2 - Add inputs and outputs
 * 3 - Calculate the fee and how much change needs to be given
 * 4 - Build the transaction body
 * 5 - Sign it (at this point the user will be prompted for
 * a password in his wallet)
 * 6 - Send the transaction
 * @returns {Promise<void>}
 */
export const buildSendADATransaction = async (initParam, iAPI, iUtxos, iAddressBech32SendADA, iChangeAddress, iLovelaceToSend) => {
  const txBuilder = await initTransactionBuilder(initParam);
  const shelleyOutputAddress = Address.from_bech32(
    iAddressBech32SendADA
  );
  const shelleyChangeAddress = Address.from_bech32(iChangeAddress);

  txBuilder.add_output(
    TransactionOutput.new(
      shelleyOutputAddress,
      Value.new(BigNum.from_str(iLovelaceToSend.toString()))
    )
  );

  // Find the available UTXOs in the wallet and
  // us them as Inputs
  const txUnspentOutputs = await getTxUnspentOutputs(iUtxos);
  txBuilder.add_inputs_from(txUnspentOutputs, 1);

  // calculate the min fee required and send any change to an address
  txBuilder.add_change_if_needed(shelleyChangeAddress);

  // once the transaction is ready, we build it to get the tx body without witnesses
  const txBody = txBuilder.build();

  // Tx witness
  const transactionWitnessSet = TransactionWitnessSet.new();

  const tx = Transaction.new(
    txBody,
    TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
  );

  let txVkeyWitnesses = await iAPI.signTx(
    Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
    true
  );

  console.log(txVkeyWitnesses);

  txVkeyWitnesses = TransactionWitnessSet.from_bytes(
    Buffer.from(txVkeyWitnesses, "hex")
  );

  transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

  const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

  const submittedTxHash = await iAPI.submitTx(
    Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
  );
  console.log(submittedTxHash);
  this.setState({ submittedTxHash });
};

// buildSendTokenTransaction = async () => {
//   const txBuilder = await this.initTransactionBuilder();
//   const shelleyOutputAddress = Address.from_bech32(
//     this.state.addressBech32SendADA
//   );
//   const shelleyChangeAddress = Address.from_bech32(this.state.changeAddress);

//   let txOutputBuilder = TransactionOutputBuilder.new();
//   txOutputBuilder = txOutputBuilder.with_address(shelleyOutputAddress);
//   txOutputBuilder = txOutputBuilder.next();

//   let multiAsset = MultiAsset.new();
//   let assets = Assets.new();
//   assets.insert(
//     AssetName.new(Buffer.from(this.state.assetNameHex, "hex")), // Asset Name
//     BigNum.from_str(this.state.assetAmountToSend.toString()) // How much to send
//   );
//   multiAsset.insert(
//     ScriptHash.from_bytes(Buffer.from(this.state.assetPolicyIdHex, "hex")), // PolicyID
//     assets
//   );

//   txOutputBuilder = txOutputBuilder.with_asset_and_min_required_coin(
//     multiAsset,
//     BigNum.from_str(this.protocolParams.coinsPerUtxoWord)
//   );
//   const txOutput = txOutputBuilder.build();

//   txBuilder.add_output(txOutput);

//   // Find the available UTXOs in the wallet and
//   // us them as Inputs
//   const txUnspentOutputs = await this.getTxUnspentOutputs();
//   txBuilder.add_inputs_from(txUnspentOutputs, 3);

//   // set the time to live - the absolute slot value before the tx becomes invalid
//   // txBuilder.set_ttl(51821456);

//   // calculate the min fee required and send any change to an address
//   txBuilder.add_change_if_needed(shelleyChangeAddress);

//   // once the transaction is ready, we build it to get the tx body without witnesses
//   const txBody = txBuilder.build();

//   // Tx witness
//   const transactionWitnessSet = TransactionWitnessSet.new();

//   const tx = Transaction.new(
//     txBody,
//     TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
//   );

//   let txVkeyWitnesses = await this.API.signTx(
//     Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
//     true
//   );
//   txVkeyWitnesses = TransactionWitnessSet.from_bytes(
//     Buffer.from(txVkeyWitnesses, "hex")
//   );

//   transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

//   const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

//   const submittedTxHash = await this.API.submitTx(
//     Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
//   );
//   console.log(submittedTxHash);
//   this.setState({ submittedTxHash });

//   // const txBodyCborHex_unsigned = Buffer.from(txBody.to_bytes(), "utf8").toString("hex");
//   // this.setState({txBodyCborHex_unsigned, txBody})
// };

export const buildSendAdaToPlutusScript = async (initParam, iAPI, vestingData) => {
  const txBuilder = await initTransactionBuilder(initParam);
  const ScriptAddress = Address.from_bech32(vestingData.addressScriptBech32);
  const shelleyChangeAddress = Address.from_bech32(vestingData.changeAddress);

  let txOutputBuilder = TransactionOutputBuilder.new();
  txOutputBuilder = txOutputBuilder.with_address(ScriptAddress);
  const dataHash = hash_plutus_data(
    PlutusData.new_integer(BigInt.from_str(vestingData.datumStr))
  );
  txOutputBuilder = txOutputBuilder.with_data_hash(dataHash);

  txOutputBuilder = txOutputBuilder.next();

  txOutputBuilder = txOutputBuilder.with_value(
    Value.new(BigNum.from_str(vestingData.lovelaceToSend.toString()))
  );
  const txOutput = txOutputBuilder.build();

  txBuilder.add_output(txOutput);

  // Find the available UTXOs in the wallet and
  // us them as Inputs
  const txUnspentOutputs = await getTxUnspentOutputs(vestingData.utxos);
  txBuilder.add_inputs_from(txUnspentOutputs, 2);

  // calculate the min fee required and send any change to an address
  txBuilder.add_change_if_needed(shelleyChangeAddress);

  // once the transaction is ready, we build it to get the tx body without witnesses
  const txBody = txBuilder.build();

  // Tx witness
  const transactionWitnessSet = TransactionWitnessSet.new();

  const tx = Transaction.new(
    txBody,
    TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
  );

  let txVkeyWitnesses = await iAPI.signTx(
    Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
    true
  );
  txVkeyWitnesses = TransactionWitnessSet.from_bytes(
    Buffer.from(txVkeyWitnesses, "hex")
  );

  transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

  const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

  const submittedTxHash = await iAPI.submitTx(
    Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
  );
  console.log(submittedTxHash);
};

// buildSendTokenToPlutusScript = async () => {
//   const txBuilder = await this.initTransactionBuilder();
//   const ScriptAddress = Address.from_bech32(this.state.addressScriptBech32);
//   const shelleyChangeAddress = Address.from_bech32(this.state.changeAddress);

//   let txOutputBuilder = TransactionOutputBuilder.new();
//   txOutputBuilder = txOutputBuilder.with_address(ScriptAddress);
//   const dataHash = hash_plutus_data(
//     PlutusData.new_integer(BigInt.from_str(this.state.datumStr))
//   );
//   txOutputBuilder = txOutputBuilder.with_data_hash(dataHash);

//   txOutputBuilder = txOutputBuilder.next();

//   let multiAsset = MultiAsset.new();
//   let assets = Assets.new();
//   assets.insert(
//     AssetName.new(Buffer.from(this.state.assetNameHex, "hex")), // Asset Name
//     BigNum.from_str(this.state.assetAmountToSend.toString()) // How much to send
//   );
//   multiAsset.insert(
//     ScriptHash.from_bytes(Buffer.from(this.state.assetPolicyIdHex, "hex")), // PolicyID
//     assets
//   );

//   // txOutputBuilder = txOutputBuilder.with_asset_and_min_required_coin(multiAsset, BigNum.from_str(this.protocolParams.coinsPerUtxoWord))

//   txOutputBuilder = txOutputBuilder.with_coin_and_asset(
//     BigNum.from_str(this.state.lovelaceToSend.toString()),
//     multiAsset
//   );

//   const txOutput = txOutputBuilder.build();

//   txBuilder.add_output(txOutput);

//   // Find the available UTXOs in the wallet and
//   // us them as Inputs
//   const txUnspentOutputs = await this.getTxUnspentOutputs();
//   txBuilder.add_inputs_from(txUnspentOutputs, 3);

//   // calculate the min fee required and send any change to an address
//   txBuilder.add_change_if_needed(shelleyChangeAddress);

//   // once the transaction is ready, we build it to get the tx body without witnesses
//   const txBody = txBuilder.build();

//   // Tx witness
//   const transactionWitnessSet = TransactionWitnessSet.new();

//   const tx = Transaction.new(
//     txBody,
//     TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
//   );

//   let txVkeyWitnesses = await this.API.signTx(
//     Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
//     true
//   );
//   txVkeyWitnesses = TransactionWitnessSet.from_bytes(
//     Buffer.from(txVkeyWitnesses, "hex")
//   );

//   transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

//   const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

//   const submittedTxHash = await this.API.submitTx(
//     Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
//   );
//   console.log(submittedTxHash);
//   this.setState({
//     submittedTxHash: submittedTxHash,
//     transactionIdLocked: submittedTxHash,
//     lovelaceLocked: this.state.lovelaceToSend,
//   });
// };

export const buildRedeemAdaFromPlutusScript = async (initParam, iAPI, redeemData) => {
  const txBuilder = await initTransactionBuilder(initParam);
  const ScriptAddress = Address.from_bech32(redeemData.addressScriptBech32);
  const shelleyChangeAddress = Address.from_bech32(redeemData.changeAddress);

  txBuilder.add_input(
    ScriptAddress,
    TransactionInput.new(
      TransactionHash.from_bytes(
        Buffer.from(redeemData.transactionIdLocked, "hex")
      ),
      redeemData.transactionIndxLocked.toString()
    ),
    Value.new(BigNum.from_str(redeemData.lovelaceLocked.toString()))
  ); // how much lovelace is at that UTXO

  txBuilder.set_fee(BigNum.from_str(Number(redeemData.manualFee).toString()));

  const scripts = PlutusScripts.new();
  scripts.add(
    PlutusScript.from_bytes(
      Buffer.from(redeemData.plutusScriptCborHex, "hex")
    )
  ); //from cbor of plutus script

  // Add outputs
  const outputVal =
  redeemData.lovelaceLocked.toString() - Number(redeemData.manualFee);
  const outputValStr = outputVal.toString();
  txBuilder.add_output(
    TransactionOutput.new(
      shelleyChangeAddress,
      Value.new(BigNum.from_str(outputValStr))
    )
  );

  // once the transaction is ready, we build it to get the tx body without witnesses
  const txBody = txBuilder.build();

  const collateral = redeemData.CollatUtxos;
  const inputs = TransactionInputs.new();
  collateral.forEach((utxo) => {
    inputs.add(utxo.input());
  });

  let datums = PlutusList.new();
  // datums.add(PlutusData.from_bytes(Buffer.from(this.state.datumStr, "utf8")))
  datums.add(PlutusData.new_integer(BigInt.from_str(redeemData.datumStr)));

  const redeemers = Redeemers.new();

  const data = PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), PlutusList.new())
  );

  const redeemer = Redeemer.new(
    RedeemerTag.new_spend(),
    BigNum.from_str("0"),
    data,
    ExUnits.new(BigNum.from_str("7000000"), BigNum.from_str("3000000000"))
  );

  redeemers.add(redeemer);

  // Tx witness
  const transactionWitnessSet = TransactionWitnessSet.new();

  transactionWitnessSet.set_plutus_scripts(scripts);
  transactionWitnessSet.set_plutus_data(datums);
  transactionWitnessSet.set_redeemers(redeemers);

  const cost_model_vals = [
    197209, 0, 1, 1, 396231, 621, 0, 1, 150000, 1000, 0, 1, 150000, 32,
    2477736, 29175, 4, 29773, 100, 29773, 100, 29773, 100, 29773, 100, 29773,
    100, 29773, 100, 100, 100, 29773, 100, 150000, 32, 150000, 32, 150000, 32,
    150000, 1000, 0, 1, 150000, 32, 150000, 1000, 0, 8, 148000, 425507, 118,
    0, 1, 1, 150000, 1000, 0, 8, 150000, 112536, 247, 1, 150000, 10000, 1,
    136542, 1326, 1, 1000, 150000, 1000, 1, 150000, 32, 150000, 32, 150000,
    32, 1, 1, 150000, 1, 150000, 4, 103599, 248, 1, 103599, 248, 1, 145276,
    1366, 1, 179690, 497, 1, 150000, 32, 150000, 32, 150000, 32, 150000, 32,
    150000, 32, 150000, 32, 148000, 425507, 118, 0, 1, 1, 61516, 11218, 0, 1,
    150000, 32, 148000, 425507, 118, 0, 1, 1, 148000, 425507, 118, 0, 1, 1,
    2477736, 29175, 4, 0, 82363, 4, 150000, 5000, 0, 1, 150000, 32, 197209, 0,
    1, 1, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000,
    32, 150000, 32, 3345831, 1, 1,
  ];

  const costModel = CostModel.new();
  cost_model_vals.forEach((x, i) => costModel.set(i, Int.new_i32(x)));

  const costModels = Costmdls.new();
  costModels.insert(Language.new_plutus_v1(), costModel);

  const scriptDataHash = hash_script_data(redeemers, costModels, datums);
  txBody.set_script_data_hash(scriptDataHash);

  txBody.set_collateral(inputs);

  const baseAddress = BaseAddress.from_address(shelleyChangeAddress);
  const requiredSigners = Ed25519KeyHashes.new();
  requiredSigners.add(baseAddress.payment_cred().to_keyhash());

  txBody.set_required_signers(requiredSigners);

  const tx = Transaction.new(
    txBody,
    TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
  );

  let txVkeyWitnesses = await iAPI.signTx(
    Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
    true
  );
  txVkeyWitnesses = TransactionWitnessSet.from_bytes(
    Buffer.from(txVkeyWitnesses, "hex")
  );

  transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

  const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

  const submittedTxHash = await iAPI.submitTx(
    Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
  );
  console.log(submittedTxHash);
  this.setState({ submittedTxHash });
};

// buildRedeemTokenFromPlutusScript = async () => {
//   const txBuilder = await this.initTransactionBuilder();
//   const ScriptAddress = Address.from_bech32(this.state.addressScriptBech32);
//   const shelleyChangeAddress = Address.from_bech32(this.state.changeAddress);

//   let multiAsset = MultiAsset.new();
//   let assets = Assets.new();
//   assets.insert(
//     AssetName.new(Buffer.from(this.state.assetNameHex, "hex")), // Asset Name
//     BigNum.from_str(this.state.assetAmountToSend.toString()) // How much to send
//   );

//   multiAsset.insert(
//     ScriptHash.from_bytes(Buffer.from(this.state.assetPolicyIdHex, "hex")), // PolicyID
//     assets
//   );

//   txBuilder.add_input(
//     ScriptAddress,
//     TransactionInput.new(
//       TransactionHash.from_bytes(
//         Buffer.from(this.state.transactionIdLocked, "hex")
//       ),
//       this.state.transactionIndxLocked.toString()
//     ),
//     Value.new_from_assets(multiAsset)
//   ); // how much lovelace is at that UTXO

//   txBuilder.set_fee(BigNum.from_str(Number(this.state.manualFee).toString()));

//   const scripts = PlutusScripts.new();
//   scripts.add(
//     PlutusScript.from_bytes(
//       Buffer.from(this.state.plutusScriptCborHex, "hex")
//     )
//   ); //from cbor of plutus script

//   // Add outputs
//   const outputVal =
//     this.state.lovelaceLocked.toString() - Number(this.state.manualFee);
//   const outputValStr = outputVal.toString();

//   let txOutputBuilder = TransactionOutputBuilder.new();
//   txOutputBuilder = txOutputBuilder.with_address(shelleyChangeAddress);
//   txOutputBuilder = txOutputBuilder.next();
//   txOutputBuilder = txOutputBuilder.with_coin_and_asset(
//     BigNum.from_str(outputValStr),
//     multiAsset
//   );

//   const txOutput = txOutputBuilder.build();
//   txBuilder.add_output(txOutput);

//   // once the transaction is ready, we build it to get the tx body without witnesses
//   const txBody = txBuilder.build();

//   const collateral = this.state.CollatUtxos;
//   const inputs = TransactionInputs.new();
//   collateral.forEach((utxo) => {
//     inputs.add(utxo.input());
//   });

//   let datums = PlutusList.new();
//   // datums.add(PlutusData.from_bytes(Buffer.from(this.state.datumStr, "utf8")))
//   datums.add(PlutusData.new_integer(BigInt.from_str(this.state.datumStr)));

//   const redeemers = Redeemers.new();

//   const data = PlutusData.new_constr_plutus_data(
//     ConstrPlutusData.new(BigNum.from_str("0"), PlutusList.new())
//   );

//   const redeemer = Redeemer.new(
//     RedeemerTag.new_spend(),
//     BigNum.from_str("0"),
//     data,
//     ExUnits.new(BigNum.from_str("7000000"), BigNum.from_str("3000000000"))
//   );

//   redeemers.add(redeemer);

//   // Tx witness
//   const transactionWitnessSet = TransactionWitnessSet.new();

//   transactionWitnessSet.set_plutus_scripts(scripts);
//   transactionWitnessSet.set_plutus_data(datums);
//   transactionWitnessSet.set_redeemers(redeemers);

//   const cost_model_vals = [
//     197209, 0, 1, 1, 396231, 621, 0, 1, 150000, 1000, 0, 1, 150000, 32,
//     2477736, 29175, 4, 29773, 100, 29773, 100, 29773, 100, 29773, 100, 29773,
//     100, 29773, 100, 100, 100, 29773, 100, 150000, 32, 150000, 32, 150000, 32,
//     150000, 1000, 0, 1, 150000, 32, 150000, 1000, 0, 8, 148000, 425507, 118,
//     0, 1, 1, 150000, 1000, 0, 8, 150000, 112536, 247, 1, 150000, 10000, 1,
//     136542, 1326, 1, 1000, 150000, 1000, 1, 150000, 32, 150000, 32, 150000,
//     32, 1, 1, 150000, 1, 150000, 4, 103599, 248, 1, 103599, 248, 1, 145276,
//     1366, 1, 179690, 497, 1, 150000, 32, 150000, 32, 150000, 32, 150000, 32,
//     150000, 32, 150000, 32, 148000, 425507, 118, 0, 1, 1, 61516, 11218, 0, 1,
//     150000, 32, 148000, 425507, 118, 0, 1, 1, 148000, 425507, 118, 0, 1, 1,
//     2477736, 29175, 4, 0, 82363, 4, 150000, 5000, 0, 1, 150000, 32, 197209, 0,
//     1, 1, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000,
//     32, 150000, 32, 3345831, 1, 1,
//   ];

//   const costModel = CostModel.new();
//   cost_model_vals.forEach((x, i) => costModel.set(i, Int.new_i32(x)));

//   const costModels = Costmdls.new();
//   costModels.insert(Language.new_plutus_v1(), costModel);

//   const scriptDataHash = hash_script_data(redeemers, costModels, datums);
//   txBody.set_script_data_hash(scriptDataHash);

//   txBody.set_collateral(inputs);

//   const baseAddress = BaseAddress.from_address(shelleyChangeAddress);
//   const requiredSigners = Ed25519KeyHashes.new();
//   requiredSigners.add(baseAddress.payment_cred().to_keyhash());

//   txBody.set_required_signers(requiredSigners);

//   const tx = Transaction.new(
//     txBody,
//     TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
//   );

//   let txVkeyWitnesses = await this.API.signTx(
//     Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
//     true
//   );
//   txVkeyWitnesses = TransactionWitnessSet.from_bytes(
//     Buffer.from(txVkeyWitnesses, "hex")
//   );

//   transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

//   const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

//   const submittedTxHash = await this.API.submitTx(
//     Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
//   );
//   console.log(submittedTxHash);
//   this.setState({ submittedTxHash });
// };

// buildLongCallInitiatedTransaction = async () => {
//   const txBuilder = await this.initTransactionBuilder();
//   const shelleyChangeAddress = Address.from_bech32(this.state.changeAddress);

//   let txOutputBuilder = TransactionOutputBuilder.new();
//   txOutputBuilder = txOutputBuilder.with_address(shelleyChangeAddress);

//   // "cborHex": "5907fd5907fa0100003323233223322323233322232333222323333333322222222323332223233332222323233223233322232333222323233223322323233333222223322332233223322332233223322230033002001222323253353030330053333573466e1cd55ce9baa0044800081208c98d4c11ccd5ce0258240230229999ab9a3370e6aae754009200023300832323232323232323232323333573466e1cd55cea805240004666666666602c66a048464646666ae68cdc39aab9d5002480008cc070c0dcd5d0a80118149aba135744a004464c6a60ae66ae7016c1601581544d55cf280089baa00135742a01466a04804a6ae854024ccd540add728151aba150083335502b75ca0546ae85401ccd4090100d5d0a80319a81219aa828824bad35742a00a6464646666ae68cdc39aab9d5002480008cd4078c8c8c8cccd5cd19b8735573aa0049000119a81319a81fbad35742a00460886ae84d5d1280111931a982d99ab9c05f05c05a059135573ca00226ea8004d5d0a8011919191999ab9a3370e6aae7540092000233502433503f75a6ae854008c110d5d09aba25002232635305b3357380be0b80b40b226aae7940044dd50009aba135744a004464c6a60ae66ae7016c1601581544d55cf280089baa00135742a00866a048eb8d5d0a80199a81219aa828bae200135742a004606c6ae84d5d1280111931a982999ab9c057054052051135744a00226ae8940044d5d1280089aba25001135744a00226ae8940044d5d1280089aba25001135573ca00226ea8004d5d0a8011919191999ab9a3370ea00290031180d981c1aba135573ca00646666ae68cdc3a801240084603460846ae84d55cf280211999ab9a3370ea00690011180d18169aba135573ca00a46666ae68cdc3a802240004603a6eb8d5d09aab9e5006232635304e3357380a409e09a09809609409226aae7540044dd50009aba135744a004464c6a608e66ae7012c120118114411c4c98d4c118cd5ce2490350543500047045135573ca00226ea8004888d4c1100080c08848cc00400c0088004888888888848cccccccccc00402c02802402001c01801401000c00880048848cc00400c008800448848cc00400c0084800448848cc00400c0084800448848cc00400c00848004848888c010014848888c00c014848888c008014848888c004014800448c88c008dd6000990009aa81a911999aab9f0012500e233500d30043574200460066ae880080cc8c8c8c8cccd5cd19b8735573aa006900011998039919191999ab9a3370e6aae754009200023300d303135742a00466a02605a6ae84d5d1280111931a981b99ab9c03b038036035135573ca00226ea8004d5d0a801999aa805bae500a35742a00466a01eeb8d5d09aba25002232635303333573806e06806406226ae8940044d55cf280089baa00122212333001004003002200122123300100300220011335500175ceb44488c88c008dd5800990009aa81791191999aab9f0022500923350083355031300635573aa004600a6aae794008c010d5d100181709aba10011122002122122330010040031200112232323333573466e1d400520002350083005357426aae79400c8cccd5cd19b87500248008940208c98d4c0a8cd5ce01701581481401389aab9d500113754002242446004006224400224002464646666ae68cdc39aab9d5002480008cc018c01cd5d0a8011bad357426ae8940088c98d4c090cd5ce01401281181109aab9e50011375400244246600200600440024646666ae68cdc39aab9d5001480008dd71aba135573ca004464c6a604066ae7009008407c0784dd500089119191999ab9a3370ea00290021280391999ab9a3370ea004900111a80518031aba135573ca00846666ae68cdc3a801a40004a014464c6a604666ae7009c09008808408007c4d55cea80089baa00112122230030041122200211222001120012323333573466e1d40052002200623333573466e1d400920002006232635301b33573803e03803403203026aae74dd50008910010910009000919191919191999ab9a3370ea0029006100591999ab9a3370ea0049005100691999ab9a3370ea00690041198059bae35742a00a6eb4d5d09aba2500523333573466e1d4011200623300d375c6ae85401cdd71aba135744a00e46666ae68cdc3a802a400846602460286ae854024dd71aba135744a01246666ae68cdc3a8032400446028602a6ae84d55cf280591999ab9a3370ea00e900011809980b1aba135573ca018464c6a604066ae7009008407c07807407006c0680640604d55cea80209aab9e5003135573ca00426aae7940044dd500090911111118038041109111111198030048041091111111802804091111110020911111100191091111111980100480411091111111980080480410009191919191999ab9a3370ea002900111998041bad35742a0086eb4d5d0a8019bad357426ae89400c8cccd5cd19b875002480008c028c02cd5d09aab9e5006232635301133573802a02402001e01c26aae75400c4d5d1280089aab9e5001137540024244600400644424466600200a0080064002464646666ae68cdc3a800a40044600c6eb8d5d09aab9e500323333573466e1d4009200023008375c6ae84d55cf280211931a980599ab9c00f00c00a009008135573aa00226ea80048488c00800c8488c00400c800444888c8c8cccd5cd19b8735573aa0049000119aa80598031aba150023005357426ae8940088c98d4c020cd5ce00600480380309aab9e5001137540029309000900088910919800801801089000a481035054310011232300100122330033002002001483026831"
//   let cborHex =
//     "5907fd5907fa0100003323233223322323233322232333222323333333322222222323332223233332222323233223233322232333222323233223322323233333222223322332233223322332233223322230033002001222323253353030330053333573466e1cd55ce9baa0044800081208c98d4c11ccd5ce0258240230229999ab9a3370e6aae754009200023300832323232323232323232323333573466e1cd55cea805240004666666666602c66a048464646666ae68cdc39aab9d5002480008cc070c0dcd5d0a80118149aba135744a004464c6a60ae66ae7016c1601581544d55cf280089baa00135742a01466a04804a6ae854024ccd540add728151aba150083335502b75ca0546ae85401ccd4090100d5d0a80319a81219aa828824bad35742a00a6464646666ae68cdc39aab9d5002480008cd4078c8c8c8cccd5cd19b8735573aa0049000119a81319a81fbad35742a00460886ae84d5d1280111931a982d99ab9c05f05c05a059135573ca00226ea8004d5d0a8011919191999ab9a3370e6aae7540092000233502433503f75a6ae854008c110d5d09aba25002232635305b3357380be0b80b40b226aae7940044dd50009aba135744a004464c6a60ae66ae7016c1601581544d55cf280089baa00135742a00866a048eb8d5d0a80199a81219aa828bae200135742a004606c6ae84d5d1280111931a982999ab9c057054052051135744a00226ae8940044d5d1280089aba25001135744a00226ae8940044d5d1280089aba25001135573ca00226ea8004d5d0a8011919191999ab9a3370ea00290031180d981c1aba135573ca00646666ae68cdc3a801240084603460846ae84d55cf280211999ab9a3370ea00690011180d18169aba135573ca00a46666ae68cdc3a802240004603a6eb8d5d09aab9e5006232635304e3357380a409e09a09809609409226aae7540044dd50009aba135744a004464c6a608e66ae7012c120118114411c4c98d4c118cd5ce2490350543500047045135573ca00226ea8004888d4c1100080c08848cc00400c0088004888888888848cccccccccc00402c02802402001c01801401000c00880048848cc00400c008800448848cc00400c0084800448848cc00400c0084800448848cc00400c00848004848888c010014848888c00c014848888c008014848888c004014800448c88c008dd6000990009aa81a911999aab9f0012500e233500d30043574200460066ae880080cc8c8c8c8cccd5cd19b8735573aa006900011998039919191999ab9a3370e6aae754009200023300d303135742a00466a02605a6ae84d5d1280111931a981b99ab9c03b038036035135573ca00226ea8004d5d0a801999aa805bae500a35742a00466a01eeb8d5d09aba25002232635303333573806e06806406226ae8940044d55cf280089baa00122212333001004003002200122123300100300220011335500175ceb44488c88c008dd5800990009aa81791191999aab9f0022500923350083355031300635573aa004600a6aae794008c010d5d100181709aba10011122002122122330010040031200112232323333573466e1d400520002350083005357426aae79400c8cccd5cd19b87500248008940208c98d4c0a8cd5ce01701581481401389aab9d500113754002242446004006224400224002464646666ae68cdc39aab9d5002480008cc018c01cd5d0a8011bad357426ae8940088c98d4c090cd5ce01401281181109aab9e50011375400244246600200600440024646666ae68cdc39aab9d5001480008dd71aba135573ca004464c6a604066ae7009008407c0784dd500089119191999ab9a3370ea00290021280391999ab9a3370ea004900111a80518031aba135573ca00846666ae68cdc3a801a40004a014464c6a604666ae7009c09008808408007c4d55cea80089baa00112122230030041122200211222001120012323333573466e1d40052002200623333573466e1d400920002006232635301b33573803e03803403203026aae74dd50008910010910009000919191919191999ab9a3370ea0029006100591999ab9a3370ea0049005100691999ab9a3370ea00690041198059bae35742a00a6eb4d5d09aba2500523333573466e1d4011200623300d375c6ae85401cdd71aba135744a00e46666ae68cdc3a802a400846602460286ae854024dd71aba135744a01246666ae68cdc3a8032400446028602a6ae84d55cf280591999ab9a3370ea00e900011809980b1aba135573ca018464c6a604066ae7009008407c07807407006c0680640604d55cea80209aab9e5003135573ca00426aae7940044dd500090911111118038041109111111198030048041091111111802804091111110020911111100191091111111980100480411091111111980080480410009191919191999ab9a3370ea002900111998041bad35742a0086eb4d5d0a8019bad357426ae89400c8cccd5cd19b875002480008c028c02cd5d09aab9e5006232635301133573802a02402001e01c26aae75400c4d5d1280089aab9e5001137540024244600400644424466600200a0080064002464646666ae68cdc3a800a40044600c6eb8d5d09aab9e500323333573466e1d4009200023008375c6ae84d55cf280211931a980599ab9c00f00c00a009008135573aa00226ea80048488c00800c8488c00400c800444888c8c8cccd5cd19b8735573aa0049000119aa80598031aba150023005357426ae8940088c98d4c020cd5ce00600480380309aab9e5001137540029309000900088910919800801801089000a481035054310011232300100122330033002002001483026831";

//   const policyScript = PlutusScript.from_bytes(Buffer.from(cborHex, "hex"));

//   const blake2bhash = blake.blake2b(policyScript.to_bytes(), 0, 28);
//   const policyId = ScriptHash.from_bytes(Buffer.from(blake2bhash, "hex"));

//   txOutputBuilder = txOutputBuilder.next();

//   // Find the available UTXOs in the wallet and
//   // us them as Inputs
//   const txUnspentOutputs = await this.getTxUnspentOutputs();
//   txBuilder.add_inputs_from(
//     txUnspentOutputs,
//     CoinSelectionStrategyCIP2.LargestFirst
//   );

//   // To mimic the --mint line of the cli, the minted assets need to be specified. Create the minted value as a multi-asset (to be included as output in the transaction builder) eg:
//   const mintedAssets = Assets.new();
//   mintedAssets.insert(
//     AssetName.new(Buffer.from("SIDEX Testing Token")), // Name
//     BigNum.from_str("100000") // Quantity
//   );

//   const multiAsset = MultiAsset.new();
//   multiAsset.insert(
//     ScriptHash.from_bytes(
//       Ed25519KeyHash.from_bytes(Buffer.from(blake2bhash, "hex")).to_bytes()
//     ),
//     mintedAssets
//   );

//   // Add this multi asset to a Value object (this is the value object that you use in one of your outputs):
//   let mintedValue = Value.new(BigNum.from_str("100000")); // Tally minted value

//   mintedValue.set_multiasset(multiAsset);

//   // Create a 'Mint' object, which signals that this transaction includes a minting operation, balancing the output. Add the minted assets to this object (the code is essentially identical to above):

//   const mint = Mint.new();
//   const mintAssets = MintAssets.new();
//   mintAssets.insert(
//     AssetName.new(Buffer.from("SIDEX Testing Token")), // Name
//     Int.new(BigNum.from_str("100000")) // Quantity
//   );

//   mint.insert(
//     ScriptHash.from_bytes(
//       Ed25519KeyHash.from_bytes(Buffer.from(blake2bhash, "hex")).to_bytes()
//     ),
//     mintAssets
//   );

//   let feeToBePaid = this.state.manualFee;
//   txBuilder.set_fee(BigNum.from_str(feeToBePaid.toString()));

//   let outputLovelace = 996831947 - feeToBePaid;

//   txOutputBuilder = txOutputBuilder.with_coin_and_asset(
//     BigNum.from_str(outputLovelace.toString()),
//     multiAsset
//   );

//   const txOutput = txOutputBuilder.build();

//   txBuilder.add_output(txOutput);

//   const scripts = PlutusScripts.new();
//   scripts.add(PlutusScript.from_bytes(Buffer.from(cborHex, "hex")));

//   // txBuilder.add_mint_asset_and_output_min_required_coin(
//   //   mintScript,
//   //   AssetName.new(Buffer.from(assetName)),
//   //   Int.new_i32(1),
//   //   TransactionOutputBuilder.new().with_address(addr).next()
//   // );

//   // txBuilder.set_mint_asset(mintScript, mintAssets);

//   // calculate the min fee required and send any change to an address
//   // txBuilder.add_change_if_needed(shelleyChangeAddress);

//   // once the transaction is ready, we build it to get the tx body without witnesses
//   const txBody = txBuilder.build();

//   const collateral = this.state.CollatUtxos;
//   const inputs = TransactionInputs.new();
//   collateral.forEach((utxo) => {
//     inputs.add(utxo.input());
//   });

//   // let datums = PlutusList.new();
//   // const redeemers = Redeemers.new();

//   txBody.set_mint(mint);

//   // Tx witness
//   const transactionWitnessSet = TransactionWitnessSet.new();
//   transactionWitnessSet.set_plutus_scripts(scripts);
//   // transactionWitnessSet.set_plutus_data(datums);
//   // transactionWitnessSet.set_redeemers(redeemers);

//   txBody.set_collateral(inputs);

//   const baseAddress = BaseAddress.from_address(shelleyChangeAddress);
//   const requiredSigners = Ed25519KeyHashes.new();
//   requiredSigners.add(baseAddress.payment_cred().to_keyhash());
//   txBody.set_required_signers(requiredSigners);

//   const tx = Transaction.new(
//     txBody,
//     TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
//   );

//   let txVkeyWitnesses = await this.API.signTx(
//     Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
//     true
//   );
//   txVkeyWitnesses = TransactionWitnessSet.from_bytes(
//     Buffer.from(txVkeyWitnesses, "hex")
//   );

//   transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

//   const signedTx = Transaction.new(tx.body(), transactionWitnessSet);
//   console.log("txbody", txBody);
//   console.log("tx", tx);

//   console.log("signed", signedTx);

//   // const submittedTxHash = await this.API.submitTx(
//   //   Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
//   // );
//   // console.log(submittedTxHash);
//   // this.setState({
//   //   submittedTxHash: submittedTxHash,
//   //   transactionIdLocked: submittedTxHash,
//   //   lovelaceLocked: this.state.lovelaceToSend,
//   // });
// };
