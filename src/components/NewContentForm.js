import React from 'react';
import PropTypes from 'prop-types';
import BN from 'bn.js';
import {
    withStyles,
    Card,
    CardContent,
    CardActions,
    TextField,
    Button,
    MenuItem,
    CircularProgress,
} from '@material-ui/core';
import { NewContentFormStyle as styles } from "../styles/MaterialCustomStyles";

class NewContentForm extends React.Component {

    constructor(props) {
        super(props);
        this.currencies = [
            {label: "wei",    value: "1"},
            {label: "kwei",   value: "1000"},
            {label: "Mwei",   value: "1000000"},
            {label: "Gwei",   value: "1000000000"},
            {label: "szabo",  value: "1000000000000"},
            {label: "finney", value: "1000000000000000"},
            {label: "ether",  value: "1000000000000000000"}
        ];
        this.state = {
            name: "",
            genre: "",
            author: "",
            price: 1,
            currency: this.currencies[0].value,
        };
    }


    handleChange = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, [target.name]: target.value}))
    };

    checkForm = () => {
        const { name, genre, author, price, currency } = this.state;
        console.log(typeof price);
        if (name && genre && author && (+price > 0) && currency)
            this.props.submitForm(name, genre, author, new BN(currency).muln(+price))
    };

    render() {
        const { classes, loading } = this.props;
        const { name, genre, author, price, currency } = this.state;
        return (
            <Card className={classes.root}>
                <CardContent>
                <form onSubmit={this.checkForm} style={{width: "100%"}}>
                    <div className={classes.formDiv}>
                    <TextField
                        className={classes.textField}
                        name={"name"}
                        label={"Content description"}
                        InputLabelProps={{shrink: true}}
                        required
                        margin={"normal"}
                        value={this.state.name}
                        type={"string"}
                        onChange={this.handleChange}
                    />
                    <TextField
                        className={classes.textField}
                        name={"genre"}
                        label={"Genre"}
                        InputLabelProps={{shrink: true}}
                        required
                        margin={"normal"}
                        type={"string"}
                        value={genre}
                        onChange={this.handleChange}
                    />
                    <TextField
                        className={classes.textField}
                        name={"author"}
                        label={"Author"}
                        InputLabelProps={{shrink: true}}
                        required
                        margin={"normal"}
                        type={"string"}
                        value={author}
                        onChange={this.handleChange}
                    />
                    <div>
                    <TextField
                        className={classes.priceField}
                        name={"price"}
                        label={"Price"}
                        InputLabelProps={{shrink: true}}
                        inputProps={{min: 1, step: 1, style: {textAlign: "right"}}}
                        required
                        error={+price <= 0}
                        type={"number"}
                        margin={"normal"}
                        value={price}
                        onChange={this.handleChange}
                    />
                    <TextField
                        select
                        required
                        InputLabelProps={{shrink: true}}
                        className={classes.currency}
                        name={"currency"}
                        label={"Unit"}
                        margin={"normal"}
                        value={currency}
                        SelectProps={{
                            MenuProps: {
                                className: classes.menu,
                            }
                        }}
                        onChange={this.handleChange}>
                        {this.currencies.map((option, item) =>
                            <MenuItem key={item} value={option.value}>
                                {option.label}
                            </MenuItem>
                        )}
                    </TextField>
                    </div>
                    </div>
                </form>
                </CardContent>
                <CardActions style={{display: "block", width: "100%"}}>
                    <div className={classes.wrapper}>
                    <Button
                        //size={"small"}
                        variant={"contained"}
                        className={classes.button}
                        color={"secondary"}
                        disabled={(!(name && genre && author && (+price > 0) && currency)) || loading}
                        onClick={this.checkForm}>Add</Button>
                        {loading && <CircularProgress size={24} className={classes.buttonProgressPrimary}/>}
                    </div>
                </CardActions>

            </Card>
        );
    }
}

NewContentForm.propTypes = {
    classes: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    submitForm: PropTypes.func.isRequired,
};

export default withStyles(styles)(NewContentForm);