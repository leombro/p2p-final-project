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
 *  File: LoginPage.js
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Slide,
    Button,
} from '@material-ui/core';
import '../styles/login.css'
import Web3LoginForm from "./Web3LoginForm";
import json from '../solidity/compiled.json';
import AppDrawer from './AppDrawer'
import {makeTitle} from "../Utils";
import { LoginPageStyle as styles } from "../styles/MaterialCustomStyles";

/*
 * "Slide up" transition for the animation of a React component.
 */
const Transition = (props) =>
    <Slide direction="up" {...props} />;

/*
 * LoginPage Class
 *
 * A React Component that shows a login form to the user, allowing them also to select a Catalog contract to connect to.
 */
class LoginPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            logged: false,
            loggedAccount: null,
            catalogAccount: "",
            error: false,
        };
        this.props.manageCenter(true);
    }

    // Changes this component's state when the Web3 instance unlocks the selected EOA.
    unlockCallback = account => {
            if (account === "error") this.props.onSubmit("error", "error", "error");
            else this.setState(oldState => ({...oldState, loggedAccount: account, logged: true}))
        };

    /*
     * After the desired EOA is unlocked by the Web3 instance and a Catalog account is chosen, this function checks that
     * latter is a valid Catalog and then "reports" to the enclosing component the user EOA, the Catalog account and
     * which app has been selected (Creator or User).
     */
    report = appType => () => {
        this.setState(oldState => ({...oldState, error: false}));
        let error = (this.state.catalogAccount === "");
        const { web3 } = this.props;
        const abi = JSON.parse(json.contracts["Catalog.sol:Catalog"].abi);
        const Catalog = new web3.eth.Contract(abi);
        try {
            Catalog.options.address = this.state.catalogAccount;
        } catch (e) {
            error = true;
        }
        if (!error) {
            Catalog.methods.isActiveCatalog().call({from: this.state.loggedAccount})
                .then(
                    (result) => {
                        this.props.onSubmit(this.state.loggedAccount, this.state.catalogAccount, appType)
                    },
                    (error) => {
                        console.log(error);
                        this.setState(oldState => ({...oldState, error: true}));
                    }
                );
        } else {
            this.setState(oldState => ({...oldState, error}));
        }
    };

    // Handles user changes in the form.
    handleChange = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, catalogAccount: target.value}));
    };

    render() {
        const { web3, classes, noLogin } = this.props;
        const { logged, catalogAccount, error } = this.state;

        return (
            <AppDrawer loading={false} render={() => ""} drawer={false} writeTitle={() => makeTitle("Login", classes.grow)}>
                {(logged) ?
                <Dialog
                    open={true}
                    disableBackdropClick={true}
                    disableEscapeKeyDown={true}
                    TransitionComponent={Transition}>
                    <DialogTitle>{"Logged in successfully!"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            COBrA kai successfully connected to the Ethereum network.
                            Please insert the desired Catalog's address, then
                            choose if you want to use the service as an user or as a content creator.
                        </DialogContentText>
                        <TextField
                            id="catalogAddress"
                            required
                            name="Catalog"
                            label="Catalog"
                            className={classes.textField}
                            value={catalogAccount}
                            onChange={this.handleChange}
                            error={error}
                            helperText={error ? "Invalid COBrA Catalog address" : ""}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button color={"secondary"} onClick={this.report("user")}>
                            User
                        </Button>
                        <Button color={"secondary"} onClick={this.report("creator")}>
                            Creator
                        </Button>
                    </DialogActions>
                </Dialog> :
                <Web3LoginForm noLogin={noLogin} onUnlock={this.unlockCallback} web3={ web3 }/>}
            </AppDrawer>
        );
    }
}

LoginPage.propTypes = {
    noLogin: PropTypes.bool.isRequired,
    web3: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    manageCenter: PropTypes.func.isRequired,
};

export default withStyles(styles)(LoginPage);