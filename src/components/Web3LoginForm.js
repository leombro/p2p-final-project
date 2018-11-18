import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const styles = theme => {

};

class Web3LoginForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            account: "",
            password: "",
        }
    }

}

Web3LoginForm.propTypes = {
};


export default withStyles(styles)(Web3LoginForm);