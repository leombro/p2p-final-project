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
 *  File: App.js
 *
 */

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Dialog, Typography } from '@material-ui/core';
import classNames from 'classnames';
import LoginPage from './LoginPage';
import UserApp from './UserApp';
import CreatorApp from './CreatorApp';
import Web3 from 'web3';
import PropTypes from "prop-types";
import CatalogManager from "./CatalogManager";
import { AppStyle as styles } from '../styles/MaterialCustomStyles';

/*
 *
 * App Class
 *
 * A React Component that acts as the "foundation" for the web application. It manages the connection
 * to a Web3 instance and provides the other Components with needed data such as the EOA used for the operations.
 *
 */

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            centerContent: true,
            connecting: true,
            account: "",
            catalog: "",
            app: "none",
            noLogin: false,
            error: false,
        };

        // Initialize the Web3 instance
        var web3;
        if (window.ethereum) { // Web3 provided by latest versions of browsers/extensions (e.g. Metamask, Mist)
            web3 = new Web3(window.ethereum);
            window.ethereum.enable().then(
                () => this.setState(oldState => ({...oldState, noLogin: true, connecting: false})),
                () => this.setState(oldState => ({error: true}))
            );
        } else { // Web3 injected by old browsers/extensions, or with an instance of a compatible client
            web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider("ws://localhost:8545"));
            web3.eth.net.isListening()
                .then(() => this.setState(oldState => ({...oldState, connecting: false})),
                      () => this.setState(oldState => ({error: true})));
        }
        /*
         * Workaround for latest versions of Web3 ( >= 1.0.0-beta.33 )
         * This fixes a bug where Solidity events or functions that return 0 or empty arrays cause Web3 to throw error
         * See https://github.com/ethereum/web3.js/issues/1916
         * Should be fixed in Web3.js version 1.0.0-beta.37
         */
        console.log("using web3 ver. ", web3.version);
        const version = +web3.version.slice(-2);
        if (version >= 33 && version < 37) {
            console.log("Applying fix patch");
            web3.eth.abi.decodeParameters = function(outputs, bytes) {
                if (bytes === '0x') {
                    bytes = '0x00';
                }
                return web3.eth.abi.__proto__.decodeParameters(outputs, bytes)
            }
        }
        this.web3 = web3;
        this.submit = this.submit.bind(this);
    };

    /*
     *  Takes values input by the user (which EOA to use, which Catalog to connect to, which application to use)
     *  and triggers the start of the chosen application (user interface/creator interface).
     *  Used as a callback by the LoginPage component.
     */
    submit(account, catalog, app) {
        if (app === "error") this.setState(o => ({...o, error: true}));
        this.setState(oldState => ({...oldState, account, catalog, app}));
    };

    /*
     *  Centers the graphic elements in the window, if required.
     *  Used as a callback by various components.
     */
    fixCenter = (what) =>
        this.setState(oldState => ({...oldState, centerContent: what}));

    render() {
        const { connecting, account, catalog, app, error, centerContent, noLogin } = this.state;
        const { isCatalog, classes } = this.props;
        return (
            <div className={(centerContent ? classNames("pagewide", classes.centered) : "pagewide")}>
                {(error) ?
                    <Dialog open={true} disableBackdropClick={true} disableEscapeKeyDown={true}>
                        <Typography id="error" variant={"body1"} color={"textPrimary"}>
                            Could not connect to an Ethereum node. Check your provider (geth, Metamask, ...).
                        </Typography>
                    </Dialog> :
                    (connecting) ?
                        <Typography variant={"body1"} color={"textPrimary"}>
                            Connecting to Ethereum node...
                        </Typography> :
                        (isCatalog) ?
                            <CatalogManager web3={this.web3} noLogin={noLogin} manageCenter={this.fixCenter} /> :
                            (app === "none") ?
                                <LoginPage onSubmit={this.submit} noLogin={noLogin} web3={this.web3} manageCenter={this.fixCenter} /> :
                                (app === "user") ?
                                    <UserApp web3={this.web3} account={account} catalog={catalog} manageCenter={this.fixCenter} /> :
                                    <CreatorApp web3={this.web3} account={account} catalog={catalog} manageCenter={this.fixCenter} />
                }
            </div>
        );
    };
}

App.propTypes = {
    classes: PropTypes.object.isRequired,
    isCatalog: PropTypes.bool.isRequired,
};

export default withStyles(styles)(App);
