import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Slide from '@material-ui/core/Slide';
import Button from '@material-ui/core/Button';
import '../styles/login.css'
import Web3LoginForm from "./Web3LoginForm";
import json from '../solidity/compiled.json';
import AppDrawer from './AppDrawer'
import {makeTitle} from "../Utils";
import { LoginPageStyle as styles } from "../styles/MaterialCustomStyles";

const Transition = (props) =>
    <Slide direction="up" {...props} />;

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

    unlockCallback = account =>
        this.setState(oldState => ({...oldState, loggedAccount: account, logged: true}));

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
                        console.log(result);
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

    handleChange = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, catalogAccount: target.value}));
    };

    render() {
        const { web3, classes } = this.props;
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
                <Web3LoginForm onUnlock={this.unlockCallback} web3={ web3 }/>}
            </AppDrawer>
        );
    }
}

LoginPage.propTypes = {
    web3: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    manageCenter: PropTypes.func.isRequired,
};

export default withStyles(styles)(LoginPage);