import React from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField, Button,
} from '@material-ui/core';
import { prettifyWei } from '../Utils';
import { BuyGiftPremiumDialogStyle as styles} from "../styles/MaterialCustomStyles";

class BuyGiftPremiumDialog extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            giftTo: '',
            retrieving: true,
            price: 0,
        };
    }

    handleChange = (event) => {
        const { target } = event ;
        this.setState(oldState => ({...oldState, giftTo: target.value}));
    };

    componentDidMount() {
        console.log(this.props.catalog);
        this.props.catalog.methods.getPremiumPrice().call({from: this.props.account}).then(
            (result) => {
                this.setState(oldState => ({giftTo: oldState.giftTo, retrieving: false, price: result}))
            },
            (error) => {
                console.log(error);
                this.props.cancel(true);
            }
        );
    }

    render() {
        console.log("rendering buyGift");
        const { classes, gifting, confirm, cancel } = this.props;
        const { giftTo, retrieving, price } = this.state;

        return (
            <div className={classes.root}>
                <Dialog
                    open={true}
                    keepMounted
                    onBackdropClick={cancel(false)}
                    onEscapeKeyDown={cancel(false)}>
                    <DialogTitle>Purchase Premium subscription</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {retrieving ?
                                "Fetching subscription price..." :
                                `The subscription costs ${prettifyWei(price)}.`}
                        </DialogContentText>
                        <div style={{display: (gifting? "block" : "none")}}>
                            <DialogContentText>Insert the account to gift.</DialogContentText>
                            <form onChange={this.handleChange}>
                                <TextField
                                    name={"account"}
                                    type={"string"}
                                    placeholder={"Account address..."}
                                    value={giftTo}
                                    className={classes.textField}
                                />
                            </form>
                        </div>
                        <DialogContentText>Purchase?</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button color={"inherit"} onClick={cancel(false)}>Cancel</Button>
                        {gifting ? <Button
                            disabled={retrieving || !giftTo}
                            color={"secondary"}
                            onClick={confirm(price, giftTo)}>
                            Gift
                        </Button> :
                            <Button
                                disabled={retrieving}
                                color={"secondary"}
                                onClick={confirm(price)}>
                                Ok
                            </Button>
                        }
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

BuyGiftPremiumDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    gifting: PropTypes.bool.isRequired,
    confirm: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    catalog: PropTypes.object.isRequired,
    account: PropTypes.string.isRequired,
};

export default withStyles(styles)(BuyGiftPremiumDialog);