import BN from 'bn.js';
import Typography from "@material-ui/core/Typography/Typography";
import React from "react";

export const prettifyWei = wei => {
    const weiBN = new BN(wei);
    const mweiBN = weiBN.divn(1000000);
    const finneyBN = mweiBN.div(new BN(1000000000));
    if (finneyBN.gtn(0)) {
        return (finneyBN.toNumber() / 1000) + " ether";
    } else
    if (mweiBN.gtn(0)) {
        return (mweiBN.toNumber() / 1000) + " gwei";
    } else return weiBN.toString() + " wei";
};

export const makeTitle = (title, className) =>
    <Typography key={"title"} variant="h6" color="inherit" className={className} noWrap>
        {title}
    </Typography>;

export const getTransactionParameters = (web3, method, account, otherParams) =>
    new Promise((resolve, reject) => {
        let gas = null, balance = null, gasPrice = null;
        const params = {
            from: account,
            ...otherParams
        };
        method.estimateGas(params).then(
            (result) => {
                gas = result.toString();
                if (balance && gasPrice) resolve({balance, gas, gasPrice});
            },
            (error) => {
                reject({type: "estimateGas", stackTrace: error});
            }
        );
        web3.eth.getBalance(account).then(
            (result) => {
                balance = result.toString();
                if (gas && gasPrice) resolve({balance, gas, gasPrice});
            },
            (error) => {
                reject({type: "getBalance", stackTrace: error});
            }
        );
        web3.eth.getGasPrice().then(
            (result) => {
                gasPrice = result.toString();
                if (gas && balance) resolve({balance, gas, gasPrice});
            },
            (error) => {
                reject({type: "getGasPrice", stackTrace: error});
            }
        )
    });