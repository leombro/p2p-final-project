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
 *  File: index.js
 *
 *  "Main" application script. It also creates a Material UI palette and applies it to the webapp.
 *
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { blue, orange } from '@material-ui/core/colors';
import App from './components/App';
import './styles/global.css';
import 'typeface-roboto';

const mTheme = createMuiTheme({
    palette: {
        primary: blue,
        secondary: orange,
    },
    typography: {
        useNextVariants: true,
    }
});

ReactDOM.render(
    <MuiThemeProvider theme={mTheme}>
        <HashRouter>
            <Switch>
                <Route exact path="/catalog" render={(props) => <App {...props} isCatalog={true} />} />
                <Route render={(props) => <App {...props} isCatalog={false} />} />
            </Switch>
        </HashRouter>
    </MuiThemeProvider>,
    document.getElementById('root')
);