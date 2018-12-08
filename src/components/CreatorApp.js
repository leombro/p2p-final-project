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
import {makeTitle, prettifyWei} from "../Utils";
import { CreatorAppStyle as styles } from "../styles/MaterialCustomStyles";

const Transition = (props) =>
    <Slide direction="up" {...props} />

const Panels = Object.freeze({
    LIST_CONTENT: Symbol("list"),
    NEW_CONTENT: Symbol("new"),
    DEL_CONTENT: Symbol("delete"),
    PUBLISH: Symbol("publish"),
});

class CreatorApp extends React.Component {

    constructor(props) {
        super(props);
        this.notificationRef = React.createRef();
        this.notify = this.notify.bind(this);
        this.web3 = this.props.web3;
        this.props.manageCenter(false);
        const abi = JSON.parse(json.contracts["Catalog.sol:Catalog"].abi);
        this.Catalog = new this.web3.eth.Contract(abi, this.props.catalog);
        this.props.web3.eth.getGasPrice().then((result, error) => {
            if (error) {
                console.log("Could not get gas price from blockchain, faling back to " +
                    "default value of 20 gwei " + error);
                const price = new this.props.web3.utils.BN(this.props.web3.utils.toWei(20, "gwei"));
                this.setState(oldState => ({...oldState, gasPrice: price.toString()}));
            }
            else this.setState(oldState => ({...oldState, gasPrice: result.toString()}));
            console.log('gasprice is ' + this.state.gasPrice);
        });
        this.newContent = {};
        this.registered = [];
    }

    state = {
        panel: Panels.LIST_CONTENT,
        contentList: [],
        gasPrice: "",
        confirmTransition: false,
        transactionProps: {},
        transactPopup: false,
        error: false,
        selContent: "",
        creatingContent: false,
        publishingContent: false,
        closing: false,
        createdContent: "",
        createdPopup: false,
        loading: false,
        monetize: false,
    };

    changePanel = (panel) => () => {
        this.setState(oldState => ({...oldState, panel: panel}));
    };

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

    handleContent = (event) => {
        const { target } = event;
        this.setState(oldState => ({...oldState, selContent: target.value}))
    };

    initiateDelete = () => {
        let error = (this.state.selContent === "");
        const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
        const CMB = new this.web3.eth.Contract(abi);
        try {
            CMB.options.address = this.state.selContent;
        } catch (e) {
            error = true;
            console.log(e);
        }
        if (error) {
            this.setState(oldState => ({...oldState, error: true}));
            this.notify("Error", "Invalid Content address", "danger");
        } else {
            this.setState(oldState => ({...oldState, closing: true, error: false}));
            this.web3.eth.getBalance(this.props.account).then(
                (result) => {
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {...oldState.transactionProps, balance: result.toString()},
                        transactPopup: (oldState.transactionProps.gas && oldState.transactionProps.gasPrice)
                    }));
                },
                (error) => {
                    console.log(error);
                    console.log("could not get balance for current account: " + error);
                    this.notify("Error", error.message.toString(), "danger");
                }
            );
            CMB.methods.closeContract().estimateGas({from: this.props.account}).then(
                (result) => {
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {...oldState.transactionProps, gas: result.toString()},
                        transactPopup: (oldState.transactionProps.balance && oldState.transactionProps.gasPrice)
                    }));
                },
                (error) => {
                    console.log(error);
                    console.log("could not estimate gas: " + error);
                    this.notify("Error", error.message.toString(), "danger");
                }
            );
            this.web3.eth.getGasPrice().then(
                (result) => {
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {...oldState.transactionProps, gasPrice: result.toString()},
                        transactPopup: (oldState.transactionProps.gas && oldState.transactionProps.balance)
                    }));
                },
                (error) => {
                    console.log("could not get balance for account: " + error);
                    this.notify("Error", error.message.toString(), "danger");
                }
            );
        }
    };

    confirmClose = () => {
        const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
        const CMB = new this.web3.eth.Contract(abi, this.state.selContent);
        CMB.methods.closeContract().send({
            from: this.props.account,
            gasPrice: this.state.transactionProps.gasPrice,
            gas: this.state.transactionProps.gas,
        }).then(
            (result) => {
                console.log(result);
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

    requestMonetization = (key) => () => {
        const address = this.state.contentList[key].address;
        this.Catalog.methods.collectPayment(address).estimateGas({from: this.props.account}).then(
            (result) => {
                this.setState(oldState => ({
                    ...oldState,
                    transactionProps: {
                        ...oldState.transactionProps,
                        gas: result.toString()
                    },
                    transactPopup: (oldState.transactionProps.balance && oldState.transactionProps.gasPrice),
                }))
            },
            (error) => {
                this.notify("Error", "Could not request payment, maybe there's no payment available", "danger");
                console.log("Could not estimate monetize gas");
                this.setState(oldState => ({...oldState, transactionProps:{}, transactPopup: false, monetize: ""}))
            }
        );
        this.web3.eth.getBalance(this.props.account).then(
            (result) => {
                this.setState(oldState => ({
                    ...oldState, transactionProps: {
                        ...oldState.transactionProps,
                        balance: result.toString(),
                    },
                    transactPopup: (oldState.transactionProps.gas && oldState.transactionProps.gasPrice),
                }));
                console.log("got balance of " + result.toString());
            },
            (error) => {
                console.log("could not get balance for account");
                this.notify("Error", "Could not check account balance, maybe connection is down", "danger");
                this.setState(oldState => ({...oldState, transactionProps:{}, transactPopup: false, monetize: ""}))
            }
        );
        this.web3.eth.getGasPrice().then(
            (result) => {
                console.log(result);
                this.setState(oldState => ({
                    ...oldState, transactionProps: {
                        ...oldState.transactionProps,
                        gasPrice: result.toString(),
                    },
                    transactPopup: (oldState.transactionProps.gas && oldState.transactionProps.balance),
                }));
                console.log("got gas price of " + result.toString());
            },
            (error) => {
                console.log("could not get gas price");
                this.notify("Error", "Could not check gas price from the blockchain, maybe connection is down", "danger");
                this.setState(oldState => ({...oldState, transactionProps:{}, transactPopup: false, monetize: ""}))
            }
        );
        this.setState(o => ({...o, monetize: address}));
    };

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
            {(this.state.panel === Panels.LIST_CONTENT) ? <Divider/> : null}
            {(this.state.panel === Panels.LIST_CONTENT) ?
                <Tooltip title={"Update Content list"} placement={"right"}>
                    <ListItem button key={"update"} onClick={this.updateContentList}>
                        <ListItemIcon><Update/></ListItemIcon>
                        <ListItemText secondary={"Update List"}/>
                    </ListItem>
                </Tooltip> : null
            }
        </List>;

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
                        this.setState(oldState => {console.log(list); return ({...oldState, contentList: list})});
                        this.notify("List updated!", "List of content has been updated", "material");
                    }
                },
                (error) => {
                    this.notify("Error", "Couldn't fetch Catalog content", "danger");
                    console.log(error);
                }
            )
    };

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
        this.web3.eth.getBalance(this.props.account).then(
            (result) => {
                this.setState(oldState => ({
                    ...oldState, transactionProps: {
                        ...oldState.transactionProps,
                        balance: result.toString(),
                    },
                    transactPopup: (oldState.transactionProps.gas && oldState.transactionProps.gasPrice),
                }));
                console.log("got balance of " + result.toString());
            },
            (error) => console.log("could not get balance for account")
        );
        this.newContent.estimateGas((err, result) => {
            if (err) console.log('could not estimate gas');
            else {
                this.setState(oldState => ({
                    ...oldState, transactionProps: {
                        ...oldState.transactionProps,
                        gas: result.toString(),
                    },
                    transactPopup: (oldState.transactionProps.balance && oldState.transactionProps.gasPrice),
                }));
                console.log("got gas estimation of " + result.toString());
            }
        });
        this.web3.eth.getGasPrice().then(
            (result) => {
                console.log(result);
                this.setState(oldState => ({
                    ...oldState, transactionProps: {
                        ...oldState.transactionProps,
                        gasPrice: result.toString(),
                    },
                    transactPopup: (oldState.transactionProps.gas && oldState.transactionProps.balance),
                }));
                console.log("got gas price of " + result.toString());
            },
            (error) => console.log("could not get gas price")
        );
        this.setState(oldState => ({...oldState, closing: false, creatingContent: true}))
    };

    confirmOpen = () => {
        this.newContent.send({
            from: this.props.account,
            gasPrice: this.state.transactionProps.gasPrice,
            gas: this.state.transactionProps.gas,
        }).then(
            (result) => {
                console.log(result);
                result.methods.isActiveContent().call({from: this.props.account}).then(
                    () => {
                        this.setState(oldState => ({...oldState, createdContent: result.options.address, createdPopup: true, creatingContent: false}));
                        this.newContent = result;
                    },
                    () => {
                        this.notify("Error", "Contract not created...", "danger");
                        this.setState(o => ({...o, loading: false}));
                    }
                )
            },
            (error) => {
                console.log(error);
                this.notify("Error", "Could not create contract...", "danger");
                this.setState(o => ({...o, loading: false}));
            }
        );
        //this.newContent = {};
        this.setState(oldState => ({...oldState, loading: true, closing: false, transactionProps: {}, transactPopup: false}));
    };

    handleDialog = () =>
        this.setState(oldState => ({...oldState, createdPopup: false, createdContent: ""}));

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

    publishContent = () => {
        this.setState(oldState => ({...oldState, publishingContent: true}));
        this.newContent.methods.publish(this.props.catalog).estimateGas({from: this.props.account}).then(
            (result) => {
                this.setState(oldState => ({
                    ...oldState,
                    transactionProps: {
                        ...oldState.transactionProps,
                        gas: result.toString()
                    },
                    transactPopup: (oldState.transactionProps.balance && oldState.transactionProps.gasPrice),
                }))
            },
            (error) => {
                this.notify("Error", "Could not publish content, maybe it's already in the catalog?", "danger");
                console.log("Could not estimate publish gas");
                this.setState(oldState => ({...oldState, transactionProps:{}, loading: false, publishingContent: false, transactPopup: false, createdPopup: false, createdContent: ""}))
            }
        );
        this.web3.eth.getBalance(this.props.account).then(
            (result) => {
                this.setState(oldState => ({
                    ...oldState,
                    transactionProps: {
                        ...oldState.transactionProps,
                        balance: result.toString()
                    },
                    transactPopup: (oldState.transactionProps.gas && oldState.transactionProps.gasPrice),
                }))
            },
            (error) => {
                console.log("could not get balance for account");
                this.notify("Error", "Could not get balance for the current account, check the connection", "danger");
                this.setState(oldState => ({...oldState, transactionProps:{}, loading: false, publishingContent: false, transactPopup: false, createdPopup: false, createdContent: ""}))
            }
        );
        this.web3.eth.getGasPrice().then(
            (result) => {
                this.setState(oldState => ({
                    ...oldState,
                    transactionProps: {
                        ...oldState.transactionProps,
                        gasPrice: result.toString()
                    },
                    transactPopup: (oldState.transactionProps.balance && oldState.transactionProps.gas),
                }))
            },
            (error) => {
                this.notify("Error", "Could not get gas price from the blockchain, check the connection", "danger");
                console.log("could not get gas price for publishing");
                this.setState(oldState => ({...oldState, transactionProps:{}, loading: false, publishingContent: false, transactPopup: false, createdPopup: false, createdContent: ""}))
            }
        );
    };

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

    initiatePublish = () => {
        const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
        this.newContent =  new this.web3.eth.Contract(abi, this.state.selContent);
        this.publishContent();
    };

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

    render() {
        const { classes } = this.props;
        const {
            panel,
            contentList,
            transactionProps,
            transactPopup,
            selContent,
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
                                            value={selContent}
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
                                            value={selContent}
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
                        (closing? this.confirmClose : this.confirmOpen))}
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