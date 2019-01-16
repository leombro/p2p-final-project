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
 *  File: CreatorApp.js
 *
 */

import React from 'react';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import ReactNotification from 'react-notifications-component';
import AppDrawer from './AppDrawer'
import ContentList from './ContentList'
import TransactionConfirmation from './TransactionConfirmation';
import NewContentForm from './NewContentForm';
import {
    List,
    ListItemIcon,
    ListItemText,
    ListItem,
    Tooltip,
    Divider,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Slide,
} from '@material-ui/core';
import {
    List as ListIcon,
    LibraryAdd,
    Delete,
    Update,
    Publish,
} from '@material-ui/icons';
import CopyToClipboard from 'react-copy-to-clipboard';
import 'react-notifications-component/dist/theme.css';
import 'animate.css';
import json from '../solidity/compiled.json';
import {getTransactionParameters, makeTitle, prettifyWei} from "../Utils";
import { CreatorAppStyle as styles } from "../styles/MaterialCustomStyles";

/*
 * "Slide up" transition for the animation of a React component.
 */
const Transition = (props) =>
    <Slide direction="up" {...props} />;

/*
 * Enum-like object for the various sections of the application.
 */
const Panels = Object.freeze({
    LIST_CONTENT: Symbol("list"),
    NEW_CONTENT: Symbol("new"),
    DEL_CONTENT: Symbol("delete"),
    PUBLISH: Symbol("publish"),
});

/*
 * CreatorApp Class
 *
 * A React Component that represents the entire Creators portion for the app.
 * It allows a Creator to publish new contents, delete existing ones, and request monetization for their work.
 */
class CreatorApp extends React.Component {

    constructor(props) {
        super(props);
        this.notificationRef = React.createRef();
        this.notify = this.notify.bind(this);
        this.web3 = this.props.web3;
        this.props.manageCenter(false);
        const abi = JSON.parse(json.contracts["Catalog.sol:Catalog"].abi);
        this.Catalog = new this.web3.eth.Contract(abi, this.props.catalog);
        this.newContent = {};
        this.registered = [];
    }

    state = {
        panel: Panels.LIST_CONTENT,
        contentList: [],
        transactionProps: {},
        transactPopup: false,
        error: false,
        selectedContent: "",
        creatingContent: false,
        publishingContent: false,
        closing: false,
        createdContent: "",
        createdPopup: false,
        loading: false,
        monetize: false,
    };

    // Changes the current panel (section of the app).
    changePanel = (panel) => () => {
        this.setState(oldState => ({...oldState, panel: panel}));
    };

    // Displays a notification in the upper right portion of the screen.
    notify(title, message, type, time) {
        this.notificationRef.current.addNotification({
            title,
            message,
            type,
            insert: "top",
            container: "top-right",
            animationIn: ["animated", "fadeIn"],
            animationOut: ["animated", "fadeOut"],
            dismiss: { duration: time || 2000 },
            dismissable: { click: true },
        });
    }

    // Callback function to handle user input for the publishing/deletion of a content.
    handleContent = (event) => {
        const { target } = event;
        this.setState(oldState => ({...oldState, selectedContent: target.value}))
    };

    // Closes the "new Content created" popup dialog.
    handleDialog = () =>
        this.setState(oldState => ({...oldState, createdPopup: false, createdContent: ""}));

    /*
     * Begins the deletion of a ContentManagementBase contract, checking the correctness of the operation
     * (i.e. if the content exists and is owned by the current selected EOA) and estimating the gas cost.
     */
    initiateDelete = () => {
        let error = (this.state.selectedContent === "");
        const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
        const CMB = new this.web3.eth.Contract(abi);
        try {
            CMB.options.address = this.state.selectedContent;
        } catch (err) {
            error = true;
            console.log(err);
        }
        if (error) {
            this.setState(oldState => ({...oldState, error: true}));
            this.notify("Error", "Invalid Content address", "danger");
        } else {
            this.setState(oldState => ({...oldState, closing: true, error: false}));
            getTransactionParameters(this.web3, CMB.methods.closeContract(), this.props.account).then(
                (result) => this.setState(o => ({...o, transactionProps: result, transactPopup: true})),
                (error) => {
                    console.log("Error in getting parameters for initiateDelete");
                    console.log(error);
                    this.notify("Error", error.stackTrace.message.toString(), "danger");
                }
            );
        }
    };

    /*
     * Invoked when the user confirms the transaction (after reviewing it in an informative dialog), this function
     * effectively closes and deletes a content, checking afterwards that the operation was successful.
     */
    confirmDelete = () => {
        const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
        const CMB = new this.web3.eth.Contract(abi, this.state.selectedContent);
        CMB.methods.closeContract().send({
            from: this.props.account,
            gasPrice: this.state.transactionProps.gasPrice,
            gas: this.state.transactionProps.gas,
        }).then(
            (result) => {
                CMB.methods.isActiveContent().call({from: this.props.account}).then(
                    () => this.notify("Error", "Contract NOT closed! Are you the owner?", "danger"),
                    () => this.notify("Success!", "Content contract was closed!", "success")
                );
                this.setState(o => ({...o, loading: false}));
            },
            (error) => {
                console.log(error);
                this.notify("Error", "Could not close contract...", "danger");
                this.setState(o => ({...o, loading: false}));
            }
        );
        this.setState(oldState => ({...oldState, loading: true, closing: false, transactionProps: {}, transactPopup: false}));
    };

    // Starts a request for monetization of a Content to the Catalog, estimating the gas cost.
    requestMonetization = (key) => () => {
        const address = this.state.contentList[key].address;
        getTransactionParameters(this.web3, this.Catalog.methods.collectPayment(address), this.props.account).then(
            (result) => this.setState(o => ({...o, transactionProps: result, transactPopup: true})),
            (error) => {
                console.log("Error in getting parameters for requestMonetization");
                console.log(error.stackTrace);
                switch (error.type) {
                    case "estimateGas":
                        this.notify("Error", "Could not request payment, maybe there's no payment available", "danger");
                        break;
                    case "getBalance":
                        this.notify("Error", "Could not check account balance, maybe connection is down", "danger");
                        break;
                    case "getGasPrice":
                        this.notify("Error", "Could not check gas price from the blockchain, maybe connection is down", "danger");
                        break;
                    default:
                        this.notify("Error", error.stackTrace.message.toString(), "danger");
                }
                this.setState(o => ({...o, monetize: ""}));
            }
        );
        this.setState(o => ({...o, monetize: address}));
    };

    /*
     * Invoked when the user confirms the transaction (after reviewing it in an informative dialog), this function
     * effectively sends a request for payment to the Catalog and (upon success) shows the Creator their new balance.
     */
    confirmMonetize = () => {
        this.Catalog.methods.collectPayment(this.state.monetize).send({
            from: this.props.account,
            gas: this.state.transactionProps.gas,
            gasPrice: this.state.transactionProps.gasPrice
        }).then(
            () => {
                this.web3.eth.getBalance(this.props.account).then(
                    (result) => {
                        this.notify("Success!",
                            `You've been paid for views of your content, balance is now ${prettifyWei(result.toString())}`,
                            "success");
                    },
                    (error) => {
                        this.notify("Success",
                            `You've been paid for views of your content, but could not fetch new balance`,
                            "material");
                    }
                );
                this.setState(o => ({...o, loading: false}));
            },
            (error) => {
                console.log("Could not monetize", error);
                this.notify("Error", "There's been a problem with monetization, check console logs", "danger");
                this.setState(o => ({...o, loading: false}));
            }
        );
        this.setState(o => ({...o, transactionProps: {}, transactPopup: false, monetize: "", loading: true}));
    };

    // Begins the creation of a new ContentManagementBase contract, estimating its gas cost.
    createContent = (name, genre, author, price) => {
        const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
        const bin = "0x" + json.contracts["ContentManagementBase.sol:ContentManagementBase"].bin;
        const CMB = new this.web3.eth.Contract(abi);
        this.newContent = CMB.deploy({
            data: bin,
            arguments: [
                this.web3.utils.asciiToHex(name),
                this.web3.utils.asciiToHex(genre),
                this.web3.utils.asciiToHex(author),
                price.toString(),
            ]});
        getTransactionParameters(this.web3, this.newContent, this.props.account).then(
            (result) => this.setState(o => ({...o, transactionProps: result, transactPopup: true})),
            (error) =>  {
                console.log("Error in getting parameters for createContent");
                console.log(error.stackTrace);
                this.notify("Error", `Could not complete operation (error in ${error.type})`, "danger");
                this.setState(o => ({...o, creatingContent: false}));
            }
        );
        this.setState(oldState => ({...oldState, closing: false, creatingContent: true}))
    };

    /*
     * Invoked when the user confirms the transaction (after reviewing it in an informative dialog), this function
     * effectively creates a new ContentManagementBase contract and checks if it has been correctly deployed.
     *
     * This function WILL NOT publish the new Content on the Catalog, but will ask the user if they want to.
     */
    confirmCreate = () => {
        this.newContent.send({
            from: this.props.account,
            gasPrice: this.state.transactionProps.gasPrice,
            gas: this.state.transactionProps.gas,
        }).then(
            (result) => {
                result.methods.isActiveContent().call({from: this.props.account}).then(
                    () => {
                        this.setState(oldState => ({...oldState, createdContent: result.options.address, createdPopup: true, creatingContent: false}));
                        this.newContent = result;
                    },
                    () => {
                        this.notify("Error", "Contract not created...", "danger");
                        this.setState(o => ({...o, loading: false, creatingContent: false}));
                    }
                )
            },
            (error) => {
                console.log(error);
                this.notify("Error", "Could not create contract...", "danger");
                this.setState(o => ({...o, loading: false, creatingContent: false}));
            }
        );
        this.setState(oldState => ({...oldState, loading: true, closing: false, transactionProps: {}, transactPopup: false}));
    };

    /*
     * Begins the publishing of a Content (either a freshly-created or a user-provided one) to the Catalog,
     * estimating the operation's gas cost.
     */
    publishContent = () => {
        this.setState(oldState => ({...oldState, publishingContent: true}));
        getTransactionParameters(this.web3, this.newContent.methods.publish(this.props.catalog), this.props.account).then(
            (result) => this.setState(o => ({...o, transactionProps: result, transactPopup: true})),
            (error) => {
                console.log("Error in getting parameters for publishContent");
                console.log(error);
                if (error.type === "estimateGas")
                    this.notify("Error", "Could not publish content, maybe it's already in the catalog?", "danger");
                else
                    this.notify("Error", `Could not complete operation (error in ${error.type})`, "danger");
                this.setState(o => ({...o, loading: false, publishingContent: false, createdPopup: false, createdContent: ""}));
            }
        );
    };

    /*
     * Invoked when the user confirms the transaction (after reviewing it in an informative dialog), this function
     * effectively publishes a Content to the Catalog.
     */
    confirmPublish = () => {
        this.newContent.methods.publish(this.props.catalog).send({
            from: this.props.account,
            gas: this.state.transactionProps.gas,
            gasPrice: this.state.transactionProps.gasPrice,
        }).then(
            (result) => {
                this.notify("Success!", `Contract published! Refresh the list to see it`, "success");
                this.setState(o => ({...o, loading: false}));
            },
            (error) => {
                this.notify("Error", "Error in publishing contract!", "danger");
                this.setState(o => ({...o, loading: false}));
            }
        );
        this.newContent = {};
        this.setState(oldState => ({...oldState, loading: true, transactionProps:{}, publishingContent: false, transactPopup: false, createdPopup: false, createdContent: ""}))
    };

    // Renders the drawer menu.
    menu = () =>
        <List>
            <Tooltip title={"List this account's Contents"} placement={"right"}>
                <ListItem button key={"list"} onClick={this.changePanel(Panels.LIST_CONTENT)}>
                    <ListItemIcon><ListIcon /></ListItemIcon>
                    <ListItemText secondary={"My Contents"}/>
                </ListItem>
            </Tooltip>
            <Tooltip title={"Create a new Content"} placement={"right"}>
                <ListItem button key={"new"} onClick={this.changePanel(Panels.NEW_CONTENT)}>
                    <ListItemIcon><LibraryAdd /></ListItemIcon>
                    <ListItemText secondary={"New Content"}/>
                </ListItem>
            </Tooltip>
            <Tooltip title={"Publish an already-existing content"} placement={"right"}>
                <ListItem button key={"publish"} onClick={this.changePanel(Panels.PUBLISH)}>
                    <ListItemIcon><Publish/></ListItemIcon>
                    <ListItemText secondary={"Publish a Content"}/>
                </ListItem>
            </Tooltip>
            <Divider/>
            <Tooltip title={"Delete a Content from the Catalog"} placement={"right"}>
                <ListItem button key={"delete"} onClick={this.changePanel(Panels.DEL_CONTENT)}>
                    <ListItemIcon><Delete/></ListItemIcon>
                    <ListItemText secondary={"Delete a Content"}/>
                </ListItem>
            </Tooltip>
            {(this.state.panel === Panels.LIST_CONTENT) && <Divider/>}
            {(this.state.panel === Panels.LIST_CONTENT) &&
                <Tooltip title={"Update Content list"} placement={"right"}>
                    <ListItem button key={"update"} onClick={this.updateContentList}>
                        <ListItemIcon><Update/></ListItemIcon>
                        <ListItemText secondary={"Update List"}/>
                    </ListItem>
                </Tooltip>}
        </List>;

    // Renders the app bar title (depending on the current panel).
    renderTitle = () => {
        const { classes } = this.props;
        switch (this.state.panel) {
            case Panels.LIST_CONTENT: return [makeTitle("My Contents", classes.grow)];
            case Panels.NEW_CONTENT: return [makeTitle("Add a new Content", classes.grow)];
            case Panels.PUBLISH: return [makeTitle("Publish a Content", classes.grow)];
            case Panels.DEL_CONTENT: return [makeTitle("Delete a Content", classes.grow)];
            default: return [makeTitle("", classes.grow)];
        }
    };

    /*
     * Updates the list of content belonging to the current Creator, also registering callbacks for the "Content
     * Provided" Solidity events.
     */
    updateContentList = () => {
        this.Catalog.methods.getCreatorContentList().call({from: this.props.account})
            .then(
                (result) => {
                    if (!result[0] || !result[1]) {
                        this.notify("Error", "Couldn't fetch Catalog content", "danger");
                        console.log(result);
                    }
                    else {
                        const list = [];
                        for (let i = 0; i < result[0].length; i++) {
                            list.push({
                                index: i,
                                description: this.web3.utils.hexToAscii(result[0][i]),
                                address: result[1][i],
                            });
                            this.registerProvide(result[1][i]);
                        }
                        this.setState(oldState => ({...oldState, contentList: list}));
                        this.notify("List updated!", "List of content has been updated", "material");
                    }
                },
                (error) => {
                    this.notify("Error", "Couldn't fetch Catalog content", "danger");
                    console.log(error);
                }
            )
    };

    // Registers a callback for the "Provide Content" event relative to the selected Content.
    registerProvide = (address) => {
        if (!this.registered.some(item => item === address)) {
            const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
            const CMB = new this.web3.eth.Contract(abi, address);

            CMB.events.ProvideContent({filter: {content: address}, fromBlock: "latest"})
                .on('error', error => console.log("Error in event Providecontent", error))
                .on('data', event => {
                    const content = this.state.contentList.find((item) => item.address === address);
                    if (content) {
                        this.notify("Notice!", `Content ${address} provided to user ${event.returnValues.user}!`, "material", 10000);
                    }
                });

            this.registered.push(address);
        }
    };

    /*
     * This is a React state function that will be called only once, after the component is mounted in the virtual
     * DOM but before it gets rendered.
     *
     * In particular, this function adds an event listener that reacts to Solidity "Payment Available" events.
     */
    componentDidMount() {
        this.updateContentList();
        this.Catalog.events.PaymentAvailable({fromBlock: "latest"})
            .on('error', error => console.log("PaymentAvailable error: ", error))
            .on('data', event => {
                const content = this.state.contentList.find((item) => item.address === event.returnValues.contentPayable);
                if (content) {
                    this.notify("Notice!", `Payment is available for content ${content.description}!`, "material", 10000);
                }
            });
    };

    // Starts the publishing of the Content selected by the Creator.
    initiatePublish = () => {
        const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
        this.newContent =  new this.web3.eth.Contract(abi, this.state.selectedContent);
        this.publishContent();
    };

    render() {
        const { classes } = this.props;
        const {
            panel,
            contentList,
            transactionProps,
            transactPopup,
            selectedContent,
            error,
            creatingContent,
            publishingContent,
            closing,
            createdPopup,
            createdContent,
            loading,
            monetize,
        } = this.state;

        const attributes = [
            {
                name: "address",
                description: "Account address",
                copy: true,
                makeSmall: (what) => what.replace(what.slice(5, -3), "..."),
            }
        ];

        return (
            <AppDrawer drawer={true} writeTitle={this.renderTitle} render={this.menu} loading={loading}>
                <ReactNotification
                    ref={this.notificationRef}
                    types={[{
                        htmlClasses: classes.notification,
                        name: "material",
                    }]} />
                {(() => {
                    switch (panel) {
                        case Panels.LIST_CONTENT: {
                            return (
                                <div>
                                    <ContentList
                                        attributes={attributes}
                                        action={this.requestMonetization}
                                        actionName={"Request Monetization"}
                                        list={contentList}
                                        notify={this.notify}
                                    />
                                </div>
                            );
                        }
                        case Panels.NEW_CONTENT:
                            return (
                                <div>
                                    <NewContentForm loading={creatingContent} submitForm={this.createContent}/>
                                </div>
                            );
                        case Panels.PUBLISH:
                            return (
                                <div>
                                    <Tooltip
                                        title={`Make sure your content isn't already published`}
                                        placement={"bottom"} >
                                        <TextField
                                            id="contentAddress"
                                            required
                                            name="Content"
                                            label="Content Address"
                                            className={classes.textField}
                                            value={selectedContent}
                                            onChange={this.handleContent}
                                            error={error}
                                        />
                                    </Tooltip>
                                    <Button color={"primary"} className={classes.button} variant={"extendedFab"} onClick={this.initiatePublish}>
                                        <Publish className={classes.extendedIcon} />
                                        Publish
                                    </Button>
                                </div>
                            );
                        case Panels.DEL_CONTENT:
                            return (
                                <div>
                                    <Tooltip
                                        title={`You can copy a Content's address from the "My Contents" section`}
                                        placement={"bottom"} >
                                        <TextField
                                            id="contentAddress"
                                            required
                                            name="Content"
                                            label="Content Address"
                                            className={classes.textField}
                                            value={selectedContent}
                                            onChange={this.handleContent}
                                            error={error}
                                        />
                                    </Tooltip>
                                    <Button className={classes.warn} variant={"extendedFab"} onClick={this.initiateDelete}>
                                        <Delete className={classes.extendedIcon} />
                                        Delete
                                    </Button>
                                </div>
                            );
                        default:
                            return "";
                    }
                })()}
                {transactPopup ? <TransactionConfirmation
                    {...transactionProps}
                    ok={(createdPopup || publishingContent)? this.confirmPublish :
                        (monetize? this.confirmMonetize :
                        (closing? this.confirmDelete : this.confirmCreate))}
                    cancel={() => this.setState(oldState => ({...oldState, closing: false, transactionProps: {}, transactPopup: false}))}
                /> : ""}
                <Dialog
                    open={createdPopup}
                    keepMounted
                    TransitionComponent={Transition}
                    onEscapeKeyDown={this.handleDialog}
                    onBackdropClick={this.handleDialog} >
                    <DialogTitle>Content contract created!</DialogTitle>
                    <DialogContent>
                        <DialogContentText>The desired Content contract has been created at address:</DialogContentText>
                        <Tooltip title={"Click to copy"} placement={"right"}>
                            <CopyToClipboard text={createdContent} onCopy={() => this.notify("Success!", "Copied to clipboard", "success")}>
                                <DialogContentText style={{cursor: "pointer"}}>{createdContent}</DialogContentText>
                            </CopyToClipboard>
                        </Tooltip>
                        <DialogContentText>Do you want to publish it right away?</DialogContentText>
                        <DialogContentText>
                            Make sure to hold on to the contract address if you want to publish it later.
                        </DialogContentText>
                        <DialogContentText>
                            You can click on the address in this window to copy it into the clipboard.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            color={"primary"}
                            disabled={publishingContent}
                            onClick={this.handleDialog}
                            className={classes.button}>
                            Cancel
                        </Button>
                        <Button
                            color={"secondary"}
                            disabled={publishingContent}
                            onClick={this.publishContent}
                            className={classes.button}>
                            Publish
                        </Button>
                    </DialogActions>
                </Dialog>
            </AppDrawer>
        );
    }
}

CreatorApp.propTypes = {
    classes: PropTypes.object.isRequired,
    web3: PropTypes.object.isRequired,
    catalog: PropTypes.string.isRequired,
    account: PropTypes.string.isRequired,
    manageCenter: PropTypes.func.isRequired,
};

export default withStyles(styles)(CreatorApp);