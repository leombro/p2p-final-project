import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
    withStyles,
    Drawer,
    AppBar,
    Toolbar,
    CssBaseline,
    IconButton,
    LinearProgress,
} from '@material-ui/core';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@material-ui/icons';
import secondaryLogo from '../assets/logo2.png';
import { AppDrawerStyle as styles } from "../styles/MaterialCustomStyles";

class AppDrawer extends React.Component {
    state = {
        open: false,
    };

    handleDrawerOpen = () => {
        this.setState({ open: true });
    };

    handleDrawerClose = () => {
        this.setState({ open: false });
    };

    render() {
        const { classes, theme, drawer, writeTitle, loading, children } = this.props;

        return (
            <div className={classes.root}>
                <CssBaseline />
                <AppBar
                    position="fixed"
                    className={classNames(classes.appBar, {
                        [classes.appBarShift]: this.state.open,
                    })}>
                    <Toolbar className={classes.rightGutter} disableGutters={drawer && !this.state.open}>
                        {drawer &&
                            <IconButton
                                color="inherit"
                                aria-label="Open drawer"
                                onClick={this.handleDrawerOpen}
                                className={classNames(classes.menuButton, {
                                    [classes.hide]: this.state.open,
                                })}>
                                <MenuIcon />
                            </IconButton>}
                        {writeTitle()}
                        <img src={secondaryLogo} alt={"logo"} className={classes.logo} />
                    </Toolbar>
                </AppBar>
                {drawer? <Drawer
                    variant="permanent"
                    className={classNames(classes.drawer, {
                        [classes.drawerOpen]: this.state.open,
                        [classes.drawerClose]: !this.state.open,
                    })}
                    classes={{
                        paper: classNames({
                            [classes.drawerOpen]: this.state.open,
                            [classes.drawerClose]: !this.state.open,
                        }),
                    }}
                    open={this.state.open}
                >
                    <div className={classes.toolbar}>
                        <IconButton onClick={this.handleDrawerClose}>
                            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        </IconButton>
                    </div>
                    {this.props.render(this.state)}
                </Drawer> : null}
                <main className={classes.content}>
                    {loading && <LinearProgress color={"secondary"} className={classes.linearProgress}/>}
                    {loading && <div className={classes.darken} />}
                    <div className={classes.toolbar} />
                        {children}
                </main>
            </div>
        );
    }
}

AppDrawer.propTypes = {
    classes: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
    drawer: PropTypes.bool.isRequired,
    render: PropTypes.func.isRequired,
    writeTitle: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default withStyles(styles, { withTheme: true })(AppDrawer);