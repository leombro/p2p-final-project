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
 *  File: Web3LoginForm.js
 *
 */

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { Grid,
         Typography,
         TextField,
         MenuItem,
         FormControl,
         InputLabel,
         Input,
         InputAdornment,
         IconButton,
         Button,
         CircularProgress,
         Paper } from '@material-ui/core';
import { Visibility,
         VisibilityOff,
         Update,
         LockOpen } from "@material-ui/icons";
import mainLogo from '../assets/logo.png';
import { Web3LoginFormStyle as styles } from "../styles/MaterialCustomStyles";

/*
 * Web3LoginForm Class
 *
 * A React Component that queries the Web3 instance for the list of available EOAs and allows the user to unlock one
 * of them in order to be used as the main account for performing operations on the blockchain.
 */
class Web3LoginForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            account: "",
            password: "",
            accounts: [],
            loaded: false,
            bottomText: "",
            showPassword: false,
        };
    }

    /*
     * This is a React state function that will be called only once, after the component is mounted in the virtual
     * DOM but before it gets rendered.
     *
     * In particular, this function asks the underlying Web3 instance for the list of available EOAs.
     */
    componentDidMount() {
        const { web3, noLogin, onUnlock } = this.props;
        if (noLogin) {
            web3.eth.getAccounts().then(
                (list) => {
                    if (list.length > 0) onUnlock(list[0]);
                    else onUnlock("error");
                },
                (err) => console.log(err)
            );
        } else {
            web3.eth.getAccounts().then(this.showAccounts, (err) => console.log(err));
        }
    }

    /*
     * Populates the list data structure containing the available EOAs.
     */
    showAccounts = accounts => {
        if (accounts && accounts.length > 0) {
            const accountList = accounts.map((account, index) => ({
                    label: `Account #${index+1} (${account.replace(account.slice(5, -3), "...")})`,
                    value: account,
                })
            );
            this.setState(oldState => ({...oldState, accounts: accountList, loaded: true}));
        } else {
            this.setState(oldState => ({...oldState, accounts: [{label: "No accounts found", value: null}]}));
        }
    };

    /*
     * Submits the form; asks the Web3 instance to unlock the selected account, then reports back to the
     * enclosing component.
     */
    submit = event => {
        event.preventDefault();
        const { account, password } = this.state;
        if (!account || !password) return;
        const { web3 } = this.props;
        web3.eth.personal.unlockAccount(account, password, 0).then(
            () => {
                this.setState(oldState => ({...oldState, loading: false}));
                this.props.onUnlock(account);
            },
            (error) => {
                console.log(error);
                this.setState(oldState => ({...oldState, loading: false, bottomText: "Wrong username and/or password"}))
            }
        );
        this.setState(oldState => ({...oldState, loading: true}));
    };

    // Handles the show/hide password button.
    handleShowPassword = () => {
        this.setState(oldState => ({...oldState, showPassword: !oldState.showPassword}));
    };

    // Handles changes made in the form.
    changedForm = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, [target.name]: target.value}));
    };

    render() {
        const { classes } = this.props;
        const { account, password, accounts, showPassword, loading, loaded } = this.state;

        return (
            <Paper className={classes.root} id="paper" elevation={1}>
                <Grid
                    container
                    spacing={0}
                    display="flex"
                    direction="column"
                    alignItems="center"
                    justify="center">
                    <Grid item style={{width: "fit-content"}} ><img src={mainLogo} alt={"logo"} className={classes.image} /></Grid>
                    <Grid item style={{margin: "8px"}}>
                        <Typography variant="h5" color="textPrimary">
                            Welcome! Please login.
                        </Typography>
                    </Grid>
                    {this.state.bottomText && <Grid item >
                        <Typography variant={"body1"} color={"error"} id="bottomText">{this.state.bottomText}&nbsp;</Typography>
                    </Grid>}
                    <Grid style={{display: "flex", alignItems: "center", flexDirection: "column"}} item xs={6}>
                        <form className={classes.container} noValidate autoComplete="off" onSubmit={this.submit}>
                                <TextField
                                    id="list-accounts"
                                    select
                                    required
                                    name="account"
                                    label="Account"
                                    className={classes.textField}
                                    value={account}
                                    onChange={this.changedForm}
                                    SelectProps={{MenuProps: {className: classes.menu}}}
                                    margin="normal" >
                                    {accounts.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            <FormControl required className={classes.textField}>
                                <InputLabel htmlFor="password">Password</InputLabel>
                                <Input
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={this.changedForm}
                                    type={showPassword ? 'text' : 'password'}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="Toggle password visibility"
                                                onClick={this.handleShowPassword} >
                                                {showPassword ? <Visibility/> : <VisibilityOff/>}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                            <div style={{display: "flex", alignItems: "center"}}>
                            <div className={classes.wrapper}>
                                <IconButton
                                    onClick={() => {
                                        this.setState(oldState => ({...oldState, loaded: false}));
                                        this.props.web3.eth.getAccounts().then(this.showAccounts);
                                    }}
                                    disabled={!loaded}
                                    className={classes.button}>
                                    <Update/>
                                </IconButton>
                                {!loaded && <CircularProgress size={24} className={classes.buttonProgressSecondary}/>}
                            </div>
                            <div className={classes.wrapper}>
                                <Button
                                    variant="extendedFab"
                                    color="primary"
                                    aria-label="Unlock"
                                    onClick={this.submit}
                                    className={classes.button}
                                    disabled={loading || (!account || !password)}>
                                    <LockOpen className={classes.extendedIcon}/>
                                    Unlock
                                </Button>
                                {loading && <CircularProgress size={24} className={classes.buttonProgressPrimary}/>}
                            </div>
                            </div>
                        </form>
                    </Grid>
                </Grid>
            </Paper>
        );
    }
}



Web3LoginForm.propTypes = {
    noLogin: PropTypes.bool.isRequired,
    web3: PropTypes.object.isRequired,
    onUnlock: PropTypes.func.isRequired,
};


export default withStyles(styles)(Web3LoginForm);