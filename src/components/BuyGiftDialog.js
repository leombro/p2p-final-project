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
 *  File: BuyGiftDialog.js
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    FormControl,
    FormControlLabel,
    DialogContentText,
    Radio,
    RadioGroup,
    TextField,
    Button,
} from '@material-ui/core';
import {prettifyWei} from "../Utils";
import {BuyGiftDialogStyle as styles} from "../styles/MaterialCustomStyles";

/*
 * BuyGiftDialog Class
 *
 * A React Component that displays a dialog window, reviewing the purchase of a Content and asking the user
 * if they want to buy it for themselves or gift it to another user.
 */
class BuyGiftDialog extends React.Component {

    state = {
        selected: 'me',
        account: '',
    };

    handleChange = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, selected: target.value}));
    };

    handleAccount = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, account: target.value}))
    };

    render() {
        const {classes, callback, cancel, price} = this.props;

        return (
            <div className={classes.root}>
            <Dialog
                open={true}
                keepMounted
                onBackdropClick={cancel}
                onEscapeKeyDown={cancel}>
                <DialogTitle>Purchase details</DialogTitle>
                <DialogContent>
                    <DialogContentText>You need to pay {prettifyWei(price)} to access this content.</DialogContentText>
                    <FormControl component={"fieldset"} className={classes.formControl}>
                        <RadioGroup
                            name={"recipient"}
                            className={classes.group}
                            value={this.state.selected}
                            onChange={this.handleChange}>
                            <FormControlLabel control={<Radio/>} label={"Buy it for me"} value={"me"}/>
                            <FormControlLabel control={<Radio/>} label={
                                <div style={{display: "flex", alignItems: "center"}}>
                                    Buy it for someone else:
                                <TextField
                                    name={"account"}
                                    type={"string"}
                                    placeholder={"Account address..."}
                                    value={this.state.account}
                                    className={classes.textField}
                                    onChange={event => this.handleAccount(event)}
                                    onClick={() => this.setState(oldState => ({...oldState, selected: 'other'}))}
                                />
                                </div>
                            } value={"other"}/>
                        </RadioGroup>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button color={"inherit"} onClick={cancel}>Cancel</Button>
                    <Button color={"secondary"} onClick={this.state.selected === 'me' ? callback() : callback(this.state.account)}>Ok</Button>
                </DialogActions>
            </Dialog>
            </div>
        );
    }

}

BuyGiftDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    callback: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    price: PropTypes.string.isRequired,
};

export default withStyles(styles)(BuyGiftDialog);