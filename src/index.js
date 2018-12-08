import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch } from 'react-router-dom';
import 'typeface-roboto';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import orange from '@material-ui/core/colors/orange';
import red from '@material-ui/core/colors/red';
import App from './components/App';
import './styles/global.css'
import BuyGiftDialog from "./components/BuyGiftDialog";

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
                <Route exact path="/test" render={(props) => <BuyGiftDialog {...props} cancel={() => console.log("cancel")} callback={(a)  => {console.log("call" + a)}} />}/>
                <Route render={(props) => <App {...props} isCatalog={false} />} />
            </Switch>
        </HashRouter>
    </MuiThemeProvider>,
    document.getElementById('root')
);