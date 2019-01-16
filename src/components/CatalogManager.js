/*
 *
 *  University di Pisa - Master's Degree in Computer Science and Networking
 *
 *  Final Project for the course of Peer to Peer Systems and Blockchains
 *
 *  Teacher: Prof. Laura Ricci
 *
 *  Candidate: Orlando Leombruni, matricola 475727
 *
 *  File: CatalogManager.js
 *
*/

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
import { LibraryAdd, Delete } from '@material-ui/icons';
import Web3LoginForm from "./Web3LoginForm";
import json from '../solidity/compiled.json';
import TransactionConfirmation from "./TransactionConfirmation";
import AppDrawer from './AppDrawer'
import {getTransactionParameters, makeTitle} from "../Utils";
import { CatalogManagerStyle as styles } from "../styles/MaterialCustomStyles";

/*
 * "Slide up" transition for the animation of a React component.
 */
const Transition = (props) =>
    <Slide direction="up" {...props} />;

/*
 * CatalogManager Class
 *
 * A React Component that provides a very simple interface for creating and deleting Catalog contracts.
 */
class CatalogManager extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loggedAccount: null,
            message: "",
            dialogOpen: false,
            catalogToClose: "",
            error: false,
            confirm: false,
            confirmProps: {},
            isClose: false,
        };
        this.abi = JSON.parse(json.contracts["Catalog.sol:Catalog"].abi);
        this.bin = "0x" + json.contracts["Catalog.sol:Catalog"].bin;
        this.props.manageCenter(true);
    }

    /*
     * A callback function invoked when the user has chosen and unlocked an EOA from which to perform Catalog operations.
     */
    unlockCallback = account => {
        this.setState(oldState => ({...oldState, loggedAccount: account}));
        this.props.manageCenter(false);
    };

    /*
     * Begins the creation of a new Catalog contract, estimating the gas cost for the operation.
     */
    createCatalog = () => {
        const { web3 } = this.props;
        const Catalog = new web3.eth.Contract(this.abi, {data: this.bin});
        const d = Catalog.deploy();
        this.setState(oldState => ({...oldState, isClose: false, dialogOpen: false, error: false}));
        getTransactionParameters(web3, d, this.state.loggedAccount).then(
            (result) => this.setState(o => ({...o, confirmProps: result, confirm: true})),
            (error) => console.log(error)
        );
    };

    /*
     * Invoked when the user confirms the transaction (after reviewing it in an informative dialog), this function
     * effectively deploys a new Catalog and then queries it to check if it's been correctly created.
     */
    confirmCreate = () => {
        const {web3} = this.props;
        const Catalog = new web3.eth.Contract(this.abi, {data: this.bin});
        Catalog.deploy().send({
            from: this.state.loggedAccount,
            gasPrice: this.state.confirmProps.gasPrice,
            gas: this.state.confirmProps.gas,
        }).then(
            (result) => {
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
    };

    /*
     * Shows (or hides) the dialog window where the user can input the address of the Catalog to close.
     */
    handleDialog = () =>
        this.setState(oldState => ({...oldState, dialogOpen: !oldState.dialogOpen}));

    /*
     * Handles the input of the address of the Catalog to close.
     */
    handleChange = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, catalogToClose: target.value}));
    };

    /*
     * Begins the closing and deletion of a Catalog contract, estimating the gas cost of the operation.
     */
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
        if (!error) {
            this.setState(oldState => ({...oldState, isClose: true, dialogOpen: false, error: false}));
            getTransactionParameters(web3, Catalog.methods.closeCatalog(), this.state.loggedAccount).then(
                (result) => this.setState(o => ({...o, confirmProps: result, confirm: true})),
                (error) => console.log(error)
            );
        } else {
            this.setState(oldState => ({...oldState, error}));
        }
    };

    /*
     * Invoked when the user confirms the transaction (after reviewing it in an informative dialog), this function
     * checks that the Catalog is valid and active and then proceeds to close and delete it.
     */
    confirmDelete = () => {
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
        const {web3, classes, noLogin} = this.props;
        const { loggedAccount, message, dialogOpen, catalogToClose, error, confirm, confirmProps, isClose} = this.state;

        return (
            <AppDrawer drawer={false} loading={false} writeTitle={() => makeTitle("Catalog Management", classes.grow)} render={() => ""} >
                {Boolean(loggedAccount) ?
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
                        <Typography variant={"body1"} color={"textPrimary"} className={classes.typography} >
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
                            ok={isClose? this.confirmDelete : this.confirmCreate}
                            cancel={() => this.setState(oldState => ({...oldState, confirm: false, confirmProps: {}}))} /> :
                        ""}
                </div> :
                <Web3LoginForm noLogin={noLogin} web3={web3} onUnlock={this.unlockCallback}/>}
            </AppDrawer>
        );
    }
}

CatalogManager.propTypes = {
    noLogin: PropTypes.bool.isRequired,
    web3: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    manageCenter: PropTypes.func.isRequired,
};

export default withStyles(styles)(CatalogManager);