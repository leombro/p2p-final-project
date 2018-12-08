import React from 'react';
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames';
import LoginPage from './LoginPage';
import UserApp from './UserApp';
import CreatorApp from './CreatorApp';
import Dialog from '@material-ui/core/Dialog'
import Typography from '@material-ui/core/Typography'
import Web3 from 'web3';
import PropTypes from "prop-types";
import CatalogManager from "./CatalogManager";
import { AppStyle as styles } from '../styles/MaterialCustomStyles';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            centerContent: true,
            connecting: true,
            account: "",
            catalog: "",
            app: "none",
            error: false,
        };
        var web3;
        if (window.ethereum) {
            console.log("found ethereum provider");
            web3 = new Web3(window.ethereum);
            window.ethereum.enable().then(
                () => this.setState(oldState => ({...oldState, connecting: false})),
                () => this.setState(oldState => ({error: true}))
            );
        } else {
            console.log("fall back to local account");
            web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider("ws://localhost:8545"));
            web3.eth.net.isListening()
                .then(() => this.setState(oldState => ({...oldState, connecting: false})),
                    () => this.setState(oldState => ({error: true})));
        }
        if (+web3.version.slice(-2) > 33) {
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

    submit(account, catalog, app) {
        this.setState(oldState => ({...oldState, account, catalog, app}));
    };

    fixCenter = (what) =>
        this.setState(oldState => ({...oldState, centerContent: what}));

    render() {
        const { connecting, account, catalog, app, error, centerContent } = this.state;
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
                            <CatalogManager web3={this.web3} manageCenter={this.fixCenter} /> :
                            (app === "none") ?
                                <LoginPage onSubmit={this.submit} web3={this.web3} manageCenter={this.fixCenter} /> :
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
