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
        this.showAccounts = this.showAccounts.bind(this);
        this.unlockCallback = this.unlockCallback.bind(this);
        this.errorCallback = this.errorCallback.bind(this);
        this.submit = this.submit.bind(this);
        this.handleShowPassword = this.handleShowPassword.bind(this);
        this.changedForm = this.changedForm.bind(this);
    }

    componentDidMount() {
        const { web3 } = this.props;
        web3.eth.getAccounts().then(this.showAccounts);
    }

    showAccounts(accounts) {
        if (accounts) {
            const accountList = accounts.map((account, index) => ({
                    label: `Account #${index+1} (${account.replace(account.slice(5, -3), "...")})`,
                    value: account,
                })
            );
            this.setState(oldState => ({...oldState, accounts: accountList, loaded: true}));
        } else {
            this.setState(oldState => ({...oldState, accounts: [{label: "No accounts found", value: null}]}));
        }
    }

    unlockCallback = account => () =>
        this.props.onUnlock(account);


    errorCallback() {
        this.setState(oldState => ({...oldState, bottomText: "Wrong username and/or password"}));
    }

    submit(e) {
        e.preventDefault();
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
    }

    handleShowPassword() {
        this.setState(oldState => ({...oldState, showPassword: !oldState.showPassword}));
    }

    changedForm(event) {
        const { target } = event;
        this.setState(oldState => ({...oldState, [target.name]: target.value}));
    }

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
                                    SelectProps={{
                                        MenuProps: {
                                            className: classes.menu,
                                        },
                                    }}
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
                                                onClick={this.handleShowPassword}
                                            >
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
    web3: PropTypes.object.isRequired,
    onUnlock: PropTypes.func.isRequired,
};


export default withStyles(styles)(Web3LoginForm);