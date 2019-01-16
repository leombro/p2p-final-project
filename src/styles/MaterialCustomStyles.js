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
 *  File: MaterialCustomStyles.js
 *
 *  Contains all the custom styles for each React Component, using the Material UI framework.
 *
 */

import {blue, green, red} from "@material-ui/core/colors";
import {fade} from "@material-ui/core/styles/colorManipulator";

export const AppStyle = theme => ({
    toolbar: theme.mixins.toolbar,
    centered: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
});

export const AppDrawerStyle = theme => {
    const drawerWidth = 240;
    return ({
    root: {
        display: 'flex',
    },
    mask: {
        display: 'flex',
        width: '100%',
        height: '100%',
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    menuButton: {
        marginLeft: 12,
        marginRight: 36,
    },
    hide: {
        display: 'none',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
    },
    drawerOpen: {
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerClose: {
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        overflowX: 'hidden',
        width: theme.spacing.unit * 7 + 1,
        [theme.breakpoints.up('sm')]: {
            width: theme.spacing.unit * 9 + 1,
        },
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 8px',
        ...theme.mixins.toolbar,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing.unit * 3,
    },
    linearProgress: {
        position: 'absolute',
        left: 0,
        zIndex: 1400,
        width: '100%',
        top: 0
    },
    darken: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        position: 'fixed',
        zIndex: 1300,
        left: 0,
        right: 0,
        bottom: 0,
        top: 5,
    },
    grow: {
        flexGrow: 1,
    },
    logo: {
        maxHeight: 0,
        "@media (min-width:450px)" : {
            maxHeight: theme.mixins.toolbar.minHeight - (theme.spacing.unit * 4),
        }
    },
    rightGutter: {
        paddingRight: theme.mixins.gutters().paddingRight,
        "@media (min-width:600px)": {
            paddingRight: theme.mixins.gutters()["@media (min-width:600px)"].paddingRight,
        }
    }
})};

export const BuyGiftDialogStyle = theme => ({
    formControl: {
        margin: theme.spacing.unit * 3,
    },
    group: {
        margin: `${theme.spacing.unit}px 0`,
    },
    root: {
        display: 'flex',
    },
    textField: {
        margin: theme.spacing.unit * 2,
        width: 200,
    },
    root2: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
    }
});

export const BuyGiftPremiumDialogStyle = theme => ({
    root: {
        display: 'flex',
    },
    textField: {
        margin: theme.spacing.unit,
        width: "80%",
    }
});

export const CatalogManagerStyle = theme => ({
    typography: {
        padding: theme.spacing.unit,
    },
    holder: {
        display: 'flex',
        justifyContent: 'center',
    },
    warn: {
        color: theme.palette.getContrastText(red['A700']),
        backgroundColor: red['A700'],
        '&:hover': {
            backgroundColor: red[900],
        }
    },
    extendedIcon: {
        marginRight: theme.spacing.unit,
    },
    button: {
        margin: theme.spacing.unit,
    },
    elements: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing.unit,
    },
    grow: {
        flexGrow: 1,
    }
});

export const ChartsStyle = theme => ({
    root: {
        flexGrow: 1,
    },
    avatarRed: {
        backgroundColor: red[500],
    },
    avatarGreen: {
        backgroundColor: green[500],
    },
    avatarBlue: {
        backgroundColor: blue[500],
    },
    card: {
        padding: theme.spacing.unit * 2,
    },
});

export const ContentListStyle = theme => ({
    root: {
        width: "100%",
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
    details: {
        alignItems: "center",
    }
});

export const CreatorAppStyle = theme => ({
    notification: {
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.secondary.main,
        borderLeft: "8px solid " + theme.palette.secondary.dark,
    },
    textField: {
        margin: theme.spacing.unit,
        width: 400,
    },
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    },
    sameline: {
        marginTop: "-12px",
    },
    warn: {
        margin: theme.spacing.unit,
        color: theme.palette.getContrastText(red['A700']),
        backgroundColor: red['A700'],
        '&:hover': {
            backgroundColor: red[900],
        }
    },
    extendedIcon: {
        marginRight: theme.spacing.unit,
    },
    button: {
        margin: theme.spacing.unit,
    },
    grow: {
        flexGrow: 1,
    }
});

export const FeedbackFormStyle = theme => ({
    textField: {
        margin: theme.spacing.unit * 2,
        width: 100,
    },
    menu: {
        width: 100,
    },
});

export const LoginPageStyle = theme => ({
    textField: {
        margin: theme.spacing.unit,
        width: '200px',
    },
    grow: {
        flexGrow: 1,
    }
});

export const NewContentFormStyle = theme => ({
    root: {
        ...theme.mixins.gutters(),
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: theme.spacing.unit * 3,
        paddingBottom: theme.spacing.unit * 3,
        height: 'auto',
        margin: theme.spacing.unit * 2,
    },
    textField: {
        margin: theme.spacing.unit,
        width: 180,
    },
    priceField: {
        marginTop: theme.spacing.unit,
        marginLeft: theme.spacing.unit,
        marginBottom: theme.spacing.unit,
        marginRight: 5,
        width: 95,
    },
    currency: {
        marginTop: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        marginBottom: theme.spacing.unit,
        marginLeft: 0,
        width: 80,
    },
    menu: {
        width: 80,
    },
    formDiv: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
    },
    buttonProgressPrimary: {
        color: theme.palette.secondary.main,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    },
    wrapper: {
        display: "inline-block",
        float: "right",
        margin: theme.spacing.unit,
        position: 'relative',
    },
});


export const TransactionConfirmationStyle = theme => ({
    buttonOk: {
        margin: theme.spacing.unit,
    },
    buttonNo: {
        margin: theme.spacing.unit,
        color: red[700],
    }
});

export const UserAppStyle = theme => ({
    notification: {
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.secondary.main,
        borderLeft: "8px solid " + theme.palette.secondary.dark,
    },
    button: {
        margin: theme.spacing.unit,
    },
    searchField: {
        width: 400,
        margin: theme.spacing.unit,
    },
    sameline: {
        marginTop: "-12px",
    },
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginRight: theme.spacing.unit * 2,
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing.unit * 3,
            width: 'auto',
        },
    },
    searchIcon: {
        width: theme.spacing.unit * 5,
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
        width: '100%',
    },
    inputInput: {
        paddingTop: theme.spacing.unit,
        paddingRight: theme.spacing.unit,
        paddingBottom: theme.spacing.unit,
        paddingLeft: theme.spacing.unit * 6,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: 200,
        },
    },
    grow: {
        flexGrow: 1,
    },
    subheading: {
        marginTop: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
    },
    subMargin: {
        margin: theme.spacing.unit,
        marginTop: 0,
    },
    normalMargin: {
        margin: theme.spacing.unit,
    },
    prFetch: {
        color: theme.palette.secondary.main,
    },
    premium: {
        color: green.A400,
    },
    notPremium: {
        color: red.A400,
    },
    extendedIcon: {
        marginRight: theme.spacing.unit,
    },
});

export const Web3LoginFormStyle = theme => ({
    root: {
        ...theme.mixins.gutters(),
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
        height: 'auto',
        //minHeight: 500,
        "@media (min-height:550px)" : {
            minHeight: 500,
        }
    },
    container: {
        width: 'auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    textField: {
        margin: theme.spacing.unit * 2,
        width: 200,
    },
    menu: {
        width: 250,
    },
    extendedIcon: {
        marginRight: theme.spacing.unit,
    },
    button: {
        margin: 0,
    },
    buttonProgressPrimary: {
        color: theme.palette.secondary.main,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    },
    buttonProgressSecondary: {
        color: theme.palette.primary.main,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    },
    wrapper: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        position: 'relative',
    },
    fabProgress: {
        color: theme.palette.primary.main,
        position: 'absolute',
        top: 2,
        left: 2,
        zIndex: 1,
    },
    image: {
        maxWidth: 0,
        "@media (min-height:450px)" : {
            maxWidth: 200,
        }
    }
});

