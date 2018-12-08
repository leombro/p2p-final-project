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
    MenuItem,
    Button
} from '@material-ui/core';
import { FeedbackFormStyle as styles } from "../styles/MaterialCustomStyles";

class FeedbackForm extends React.Component {
    state = {
        appreciation: -1,
        fairness: -1,
        suggest: -1
    };

    changeFields = event => {
        const { target } = event;
        this.setState(oldState => ({...oldState, [target.name]: target.value}))
    };

    render() {

        const { classes, cancel, confirm } = this.props;

        const categories = [
            {
                label: "0 (worst)",
                value: 0,
            },
            {
                label: "1",
                value: 1,
            },
            {
                label: "2",
                value: 2,
            },
            {
                label: "3",
                value: 3,
            },
            {
                label: "4",
                value: 4,
            },
            {
                label: "5 (best)",
                value: 5,
            }
        ];

        return (
            <Dialog
                open={true}
                keepMounted
                onBackdropClick={cancel}
                onEscapeKeyDown={cancel} >
                <DialogTitle>Rate your experience</DialogTitle>
                <DialogContent>
                    <ul>
                        <li>
                            <div>
                                <DialogContentText>How much did you enjoy the content?</DialogContentText>
                                <TextField
                                    id={"appreciation"}
                                    select
                                    required
                                    name={"appreciation"}
                                    className={classes.textField}
                                    value={this.state.appreciation}
                                    onChange={this.changeFields}
                                    SelectProps={{
                                        MenuProps: {
                                            className: classes.menu,
                                        }
                                    }}
                                    margin={"normal"} >
                                    {categories.map((item) => (
                                        <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                                    ))}
                                </TextField>
                            </div>
                        </li>
                        <li>
                            <div>
                                <DialogContentText>Do you think that the price was fair?</DialogContentText>
                                <TextField
                                    id={"fairness"}
                                    select
                                    required
                                    name={"fairness"}
                                    className={classes.textField}
                                    value={this.state.fairness}
                                    onChange={this.changeFields}
                                    SelectProps={{
                                        MenuProps: {
                                            className: classes.menu,
                                        }
                                    }}
                                    margin={"normal"} >
                                    {categories.map((item) => (
                                        <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                                    ))}
                                </TextField>
                            </div>
                        </li>
                        <li>
                            <div>
                                <DialogContentText>How likely are you to recommend this content to others?</DialogContentText>
                                <TextField
                                    id={"suggest"}
                                    select
                                    required
                                    name={"suggest"}
                                    className={classes.textField}
                                    value={this.state.suggest}
                                    onChange={this.changeFields}
                                    SelectProps={{
                                        MenuProps: {
                                            className: classes.menu,
                                        }
                                    }}
                                    margin={"normal"} >
                                    {categories.map((item) => (
                                        <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                                    ))}
                                </TextField>
                            </div>
                        </li>
                    </ul>
                </DialogContent>
                <DialogActions>
                    <Button
                        color={"inherit"}
                        className={classes.button}
                        onClick={cancel}>Cancel</Button>
                    <Button
                        color={"secondary"}
                        disabled={!((this.state.appreciation > -1) && (this.state.fairness > -1) && (this.state.suggest > -1))}
                        className={classes.button}
                        onClick={confirm(this.state)}>Ok</Button>
                </DialogActions>
            </Dialog>
        );
    }
}

FeedbackForm.propTypes = {
    classes: PropTypes.object.isRequired,
    cancel: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired,
};

export default withStyles(styles)(FeedbackForm);