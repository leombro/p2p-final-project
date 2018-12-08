import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { Typography,
         Button,
         TextField,
         Slide,
         Dialog,
         DialogContent,
         DialogActions,
         DialogTitle } from '@material-ui/core';
import { LibraryAdd,
         Delete } from '@material-ui/icons';
import Web3LoginForm from "./Web3LoginForm";
import json from '../solidity/compiled.json';
import TransactionConfirmation from "./TransactionConfirmation";
import AppDrawer from './AppDrawer'
import {makeTitle} from "../Utils";
import { CatalogManagerStyle as styles } from "../styles/MaterialCustomStyles";

const Transition = (props) =>
    <Slide direction="up" {...props} />;

class CatalogManager extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            logged: false,
            loggedAccount: null,
            gasPrice: "",
            message: "",
            dialogOpen: false,
            catalogToClose: "",
            error: false,
            confirm: false,
            confirmProps: {},
            isClose: false,
            openingCatalog: "",
        };
        this.abi = JSON.parse(json.contracts["Catalog.sol:Catalog"].abi);
        this.bin = "0x" + json.contracts["Catalog.sol:Catalog"].bin;
        this.props.manageCenter(true);
        this.props.web3.eth.getGasPrice().then((result, error) => {
            if (error) {
                console.log("Could not get gas price from blockchain, faling back to " +
                    "default value of 20 gwei " + error);
                const price = new this.props.web3.utils.BN(this.props.web3.utils.toWei(20, "gwei"));
                this.setState(oldState => ({...oldState, gasPrice: price.toString()}));
            }
            else this.setState(oldState => ({...oldState, gasPrice: result.toString()}));
            console.log('gasprice is ' + this.state.gasPrice);
        });
    }

    unlockCallback = account => {
        this.setState(oldState => ({...oldState, loggedAccount: account, logged: true}));
        this.props.manageCenter(false);
    };

    createCatalog = () => {
        const { web3 } = this.props;
        const Catalog = new web3.eth.Contract(this.abi, {data: this.bin});
        const d = Catalog.deploy();
        this.setState(oldState => ({...oldState, isClose: false, dialogOpen: false, error: false}));
        web3.eth.getBalance(this.state.loggedAccount).then(
            (result) => {
                console.log(result);
                this.setState(oldState => ({
                    ...oldState, confirmProps: {
                        ...oldState.confirmProps,
                        balance: result.toString(),
                    },
                    confirm: (oldState.confirmProps.gas && oldState.confirmProps.gasPrice),
                }));
                console.log("got balance of " + result.toString());
            },
            (error) => console.log("could not get balance for account")
        );
        d.estimateGas((err, result) => {
            if (err) console.log('could not estimate gas');
            else {
                console.log(result);
                this.setState(oldState => ({
                    ...oldState, confirmProps: {
                        ...oldState.confirmProps,
                        gas: result.toString(),
                    },
                    confirm: (oldState.confirmProps.balance && oldState.confirmProps.gasPrice),
                }));
                console.log("got gas estimation of " + result.toString());
            }
        });
        web3.eth.getGasPrice().then(
            (result) => {
                console.log(result);
                this.setState(oldState => ({
                    ...oldState, confirmProps: {
                        ...oldState.confirmProps,
                        gasPrice: result.toString(),
                    },
                    confirm: (oldState.confirmProps.gas && oldState.confirmProps.balance),
                }));
                console.log("got gas price of " + result.toString());
            },
                (error) => console.log("could not get gas price")
        );
    };

    confirmCreate = () => {
        const {web3} = this.props;
        const Catalog = new web3.eth.Contract(this.abi, {data: this.bin});
        Catalog.deploy().send({
            from: this.state.loggedAccount,
            gasPrice: this.state.confirmProps.gasPrice,
            gas: this.state.confirmProps.gas,
        }).then(
            (result) => {
                console.log(result);
                result.methods.isActiveCatalog().call({from: this.state.loggedAccount})
                    .then(
                        () => this.setState(oldState => ({...oldState,
                            message: `Catalog created at address ${result.options.address}`})
                        ),
                        () => this.setState(oldState => ({...oldState, message: `Error in creating catalog...`}))
                    );
            },
            (error) => {
                this.setState(oldState => ({...oldState, message: `Error in creating catalog...`}));
                console.log(error)
            }
        );
        this.setState(oldState => ({...oldState, message: "Creating catalog...", confirm: false, confirmProps: {}}));
    }

    handleDialog = () =>
        this.setState(oldState => ({...oldState, dialogOpen: !oldState.dialogOpen}));

    handleChange = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, catalogToClose: target.value}));
    };

    deleteCatalog = () => {
        let error = (this.state.catalogToClose === "");
        const { web3 } = this.props;
        const abi = JSON.parse(json.contracts["Catalog.sol:Catalog"].abi);
        const Catalog = new web3.eth.Contract(abi);
        try {
            Catalog.options.address = this.state.catalogToClose;
        } catch (e) {
            error = true;
            console.log(e);
        }
        console.log(`error is ${error}`);
        if (!error) {
            this.setState(oldState => ({...oldState, isClose: true, dialogOpen: false, error: false}));
            web3.eth.getBalance(this.state.loggedAccount).then(
                (result) => this.setState(oldState => ({
                    ...oldState, confirmProps: {
                        ...oldState.confirmProps,
                        balance: result.toString(),
                    },
                    confirm: (oldState.confirmProps.gas && oldState.confirmProps.gasPrice),
                })),
                (error) => console.log("could not get balance for account")
            );
            Catalog.methods.closeCatalog().estimateGas((err, result) => {
                if (err) console.log('could not estimate gas');
                else {
                    this.setState(oldState => ({
                        ...oldState, confirmProps: {
                            ...oldState.confirmProps,
                            gas: result.toString(),
                        },
                        confirm: (oldState.confirmProps.balance && oldState.confirmProps.gasPrice),
                    }));
                    console.log("got gas estimation of " + result.toString());
                }
            });
            web3.eth.getGasPrice().then(
                (result) => this.setState(oldState => ({
                    ...oldState, confirmProps: {
                        ...oldState.confirmProps,
                        gasPrice: result.toString(),
                    },
                    confirm: (oldState.confirmProps.gas && oldState.confirmProps.balance),
                })),
                (error) => console.log("could not get gas price")
            );
        } else {
            this.setState(oldState => ({...oldState, error}));
        }
    };

    confirmClose = () => {
        const {web3} = this.props;
        const abi = JSON.parse(json.contracts["Catalog.sol:Catalog"].abi);
        const Catalog = new web3.eth.Contract(abi, this.state.catalogToClose);
        Catalog.methods.isActiveCatalog().call({from: this.state.loggedAccount})
            .then(
                () => {
                    Catalog.methods.closeCatalog().send({
                        from: this.state.loggedAccount,
                        gasPrice: this.state.confirmProps.gasPrice,
                        gas: this.state.confirmProps.gas,
                    }).then(
                        (result) => {
                            console.log(result);
                            Catalog.methods.isActiveCatalog().call({from: this.state.loggedAccount})
                                .then(
                                    () => this.setState(oldState => ({...oldState,
                                        message: `Catalog WAS NOT closed! Make sure you're logged in as the owner.`})
                                    ),
                                    () => this.setState(oldState => ({...oldState, message: `Catalog closed!`}))
                                );
                        },
                        (error) => {
                            this.setState(oldState => ({...oldState, message: `Error in closing catalog`}));
                            console.log(error)
                        }
                    );
                },
                () => this.setState(oldState => ({...oldState, message: `Catalog has already been closed!`}))
            );
        this.setState(oldState => ({...oldState, message: "Closing catalog...", confirm: false, confirmProps: {}}));
    };

    render() {
        const {web3, classes} = this.props;
        const {logged, message, dialogOpen, catalogToClose, error, confirm, confirmProps, isClose} = this.state;

        return (
            <AppDrawer drawer={false} loading={false} writeTitle={() => makeTitle("Catalog Management", classes.grow)} render={() => ""} >
                {(logged) ?
                <div>
                    <div className={classes.holder}>
                        <div className={classes.elements}>
                            <Typography variant={"body1"} color={"textPrimary"} className={classes.typography}>
                                Deploy a new Catalog
                            </Typography>
                            <Button variant={"extendedFab"} onClick={this.createCatalog} color={"secondary"} className={classes.button}>
                                <LibraryAdd className={classes.extendedIcon} />
                                Add New
                            </Button>
                        </div>
                        <div className={classes.elements}>
                            <Typography variant={"body1"} color={"textPrimary"} className={classes.typography}>
                                Remove a Catalog
                            </Typography>
                            <Button variant={"extendedFab"}
                                    color={"inherit"}
                                    className={classNames(classes.button, classes.warn)}
                                    onClick={this.handleDialog} >
                                <Delete className={classes.extendedIcon} />
                                Delete
                            </Button>
                        </div>
                    </div>
                    <div className={classes.holder}>
                        <Typography variant={"body1"} color={"textPrimary"} className={classes.typography}>
                            {message}
                        </Typography>
                    </div>
                    <Dialog
                        open={dialogOpen}
                        keepMounted
                        TransitionComponent={Transition}
                        onBackdropClick={this.handleDialog}
                        onEscapeKeyDown={this.handleDialog} >
                        <DialogTitle>Select Catalog to close</DialogTitle>
                        <DialogContent>
                            <TextField
                                id="catalogAddress"
                                required
                                name="Catalog"
                                label="Catalog"
                                className={classes.textField}
                                value={catalogToClose}
                                onChange={this.handleChange}
                                error={error}
                                helperText={error ? "Invalid COBrA Catalog address" : ""}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button variant={"extendedFab"}
                                    color={"inherit"}
                                    className={classNames(classes.button, classes.warn)}
                                    onClick={this.deleteCatalog} >
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                    {confirm ?
                        <TransactionConfirmation
                            {...confirmProps}
                            ok={isClose? this.confirmClose : this.confirmCreate}
                            cancel={() => this.setState(oldState => ({...oldState, confirm: false, confirmProps: {}}))} /> :
                        ""}
                </div> :
                <Web3LoginForm web3={web3} onUnlock={this.unlockCallback}/>}
            </AppDrawer>
        );
    }
}

CatalogManager.propTypes = {
    web3: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    manageCenter: PropTypes.func.isRequired,
};

export default withStyles(styles)(CatalogManager);