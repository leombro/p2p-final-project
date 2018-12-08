import React from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Tooltip,
    Divider,
    Typography,
    InputBase,
    Button,
} from '@material-ui/core';
import {
    List as ListIcon,
    Search,
    Stars,
    Subscriptions,
    BarChart,
    ShopTwo,
    Update,
    CardGiftcard,
    Timelapse,
    QueuePlayNext
} from '@material-ui/icons';
import ReactNotification from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css';
import AppDrawer from "./AppDrawer";
import ContentList from "./ContentList";
import json from '../solidity/compiled.json';
import {getTransactionParameters, makeTitle, prettifyWei} from "../Utils";
import BuyGiftDialog from "./BuyGiftDialog";
import TransactionConfirmation from "./TransactionConfirmation";
import BuyGiftPremiumDialog from "./BuyGiftPremiumDialog";
import FeedbackForm from "./FeedbackForm";
import Charts from "./Charts";
import { UserAppStyle as styles } from "../styles/MaterialCustomStyles";

const Panels = Object.freeze({
    FULL_LIST: Symbol("list"),
    CHARTS: Symbol("charts"),
    PLAY: Symbol("play"),
    FEEDBACK: Symbol("feedback"),
    BUY: Symbol("buy")
});

class UserApp extends React.Component {

    constructor(props) {
        super(props);
        this.notify = this.notify.bind(this);
        this.notificationRef = React.createRef();
        this.props.manageCenter(false);
        this.web3 = this.props.web3;
        const abi = JSON.parse(json.contracts["Catalog.sol:Catalog"].abi);
        this.Catalog = new this.web3.eth.Contract(abi, this.props.catalog);
        this.premiumUpdates = null;
    }


    state = {
        authorList: [],
        genreList: [],
        loading: false,
        panel: Panels.FULL_LIST,
        contentList: [],
        searchTerm: "",
        filteredList: [],
        boughtContent: [],
        feedbackToLeave: [],
        feedbackLeaving: null,
        feedback: null,
        feedbackOpen: false,
        buyingPrice: 0,
        buyingAction: false,
        consuming: null,
        gifting: "",
        premiumFetching: true,
        isPremium: false,
        buyingPremium: false,
        premiumMethod: null,
        giftingPremium: false,
        transactPopup: false,
        transactionProps: {},
    };

    otherState = {
        contentBuying: -1,
        isPremiumTransaction: false,
    };

    notify(title, message, type, time) {
        console.log(time + " " + (time || 2000));
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

    changePanel = (panel) => () => {
        this.setState(oldState => ({...oldState, panel: panel}));
    };

    menu = () =>
        <List>
            <Tooltip title={"List all contents in the Catalog"} placement={"right"}>
                <ListItem button key={"list"} onClick={this.changePanel(Panels.FULL_LIST)}>
                    <ListItemIcon><ListIcon /></ListItemIcon>
                    <ListItemText secondary={"Show all Contents"}/>
                </ListItem>
            </Tooltip>
            <Tooltip title={"Discover trending content"} placement={"right"}>
                <ListItem button key={"charts"} onClick={this.changePanel(Panels.CHARTS)}>
                    <ListItemIcon><BarChart/></ListItemIcon>
                    <ListItemText secondary={"Trending"}/>
                </ListItem>
            </Tooltip>
            <Divider/>
            <Tooltip title={"Obtain a Content that you've bought"} placement={"right"}>
                <ListItem button key={"play"} onClick={this.changePanel(Panels.PLAY)}>
                    <ListItemIcon><Subscriptions/></ListItemIcon>
                    <ListItemText secondary={"Consume Content"}/>
                </ListItem>
            </Tooltip>
            <Tooltip title={"Leave feedback for consumed Contents"} placement={"right"}>
                <ListItem button key={"feedback"} onClick={this.changePanel(Panels.FEEDBACK)}>
                    <ListItemIcon><Stars/></ListItemIcon>
                    <ListItemText secondary={"Leave Feedback"}/>
                </ListItem>
            </Tooltip>
            <Tooltip title={"Buy or gift a Premium subscription"} placement={"right"}>
                <ListItem button key={"buy"} onClick={this.changePanel(Panels.BUY)}>
                    <ListItemIcon><ShopTwo/></ListItemIcon>
                    <ListItemText secondary={"Buy Premium"}/>
                </ListItem>
            </Tooltip>
            {(this.state.panel === Panels.FULL_LIST) && <Divider/>}
            {(this.state.panel === Panels.FULL_LIST) &&
                <Tooltip title={"Update Content list"} placement={"right"}>
                    <ListItem button key={"update"} onClick={this.updateContentList}>
                        <ListItemIcon><Update/></ListItemIcon>
                        <ListItemText secondary={"Update List"}/>
                    </ListItem>
                </Tooltip>
            }
        </List>;

    renderTitle = () => {
        const { classes } = this.props;
        const { panel, searchTerm } = this.state;
        switch(panel) {
            //case Panels.SEARCH: return "Search";
            case Panels.FULL_LIST:
                return (
                    [
                    makeTitle("List of available Content", classes.grow),
                    <div key={"search"} className={classes.search}>
                        <div className={classes.searchIcon}>
                            <Search />
                        </div>
                        <InputBase
                            placeholder="Search…"
                            classes={{
                                root: classes.inputRoot,
                                input: classes.inputInput,
                            }}
                            onChange={this.filterContent}
                            value={searchTerm}
                        />
                    </div>
                    ]
                );
            case Panels.PLAY:
                return [makeTitle("Consume Content", classes.grow)];
            case Panels.BUY:
                return [makeTitle("Premium Subscriptions", classes.grow)];
            case Panels.FEEDBACK:
                return [makeTitle("Rate your Contents", classes.grow)];
            case Panels.CHARTS:
                return [makeTitle("Discover trending", classes.grow)];
            default:
                return [makeTitle("Something went wrong", classes.grow)];
        }
    };

    filterContent = (event) => {
        const { target } = event;
        const filtered = this.state.contentList.filter(value => (
            value.description.toLowerCase().includes(target.value.toLowerCase())
            || value.genre.toLowerCase().includes(target.value.toLowerCase())
            || value.author.toLowerCase().includes(target.value.toLowerCase())
        ));
        this.setState(oldState => ({...oldState, filteredList: filtered, searchTerm: target.value}));
    };

    updateContentList = () => {
        this.setState(o => ({...o, loading: true}));
        this.Catalog.methods.getStatistics().call({from: this.props.account})
            .then(
                (result) => {
                    if (!result[0] || !result[1] || !result[2] || !result[3] || !result[4] ) {
                        this.notify("Error", "Couldn't fetch Catalog content", "danger");
                        console.log(result);
                    } else {
                        const list = [];
                        for (let i = 0; i < result[0].length; i++) {
                            list.push({
                                index: i,
                                description: this.web3.utils.hexToAscii(result[0][i]),
                                genre: this.web3.utils.hexToAscii(result[1][i]),
                                author: this.web3.utils.hexToAscii(result[2][i]),
                                price: result[3][i],
                                views: result[4][i],
                            })
                        }
                        const authors = new Set(), genres = new Set();
                        for (let j = 0; j < list.length; j++) {
                            authors.add(list[j].author);
                            genres.add(list[j].genre);
                        }
                        this.setState(oldState => ({
                            ...oldState,
                            loading: false,
                            contentList: list,
                            filteredList: list,
                            authorList: [...authors],
                            genreList: [...genres],
                        }));
                        this.notify("List updated!", "List of content has been updated", "material");
                    }
                },
                (error) => {
                    this.notify("Error", "Couldn't fetch Catalog content", "danger");
                    console.log(error);
                    this.setState(o => ({...o, loading: false}));
                }
            )
    };


    buy = acc => () => {
        const { contentList } = this.state;
        const { contentBuying, isPremiumTransaction: premium } = this.otherState;
        if (contentBuying < 0) {
            this.notify("Error", "No selected content", "danger");
        } else {
            premium && console.log("content is " + contentList[contentBuying].description);
            const content = this.web3.utils.asciiToHex(contentList[contentBuying].description);
            console.log("buying for " + (acc ? acc : "me"));
            const method = (premium)? this.Catalog.methods.getContentPremium(content) :
                ((acc) ? this.Catalog.methods.giftContent(content, acc) : this.Catalog.methods.getContent(content));

            const value = premium ? 0 : contentList[contentBuying].price;
            getTransactionParameters(this.web3, method, this.props.account, {value}).then(
                (result) => {
                    this.setState(o => ({...o, transactionProps: result, transactPopup: true}))
                },
                (error) => {
                    console.log(error.stackTrace);
                    switch(error.type) {
                        case "estimateGas":
                            this.notify("Error",
                                (premium) ? "Unable to obtain access to Content, check if you have a subscription" :
                                "Unable to buy Content, check if already bought or if recipient has a premium subscription",
                                "danger");
                            break;
                        case "getGasPrice":
                            this.notify("Error", "Could not get gas price from the blockchain, check the connection", "danger");
                            break;
                        case "getBalance":
                            this.notify("Error", "Could not get balance for the current account, check the connection", "danger");
                            break;
                        default:
                            break;
                    }
                    this.otherState.contentBuying = -1;
                    this.otherState.isPremiumTransaction = false;
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {},
                        transactPopup: false,
                        buyingAction: false,
                        gifting: "",
                    }));
                }
            );

            /*method.estimateGas({from: this.props.account, value: (premium ? 0 : contentList[contentBuying].price)}).then(
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
                    this.notify("Error",
                        (premium) ? "Unable to obtain access to Content, check if you have a subscription" :
                        "Unable to buy Content, check if already bought or if recipient has a premium subscription",
                        "danger");
                    console.log("Could not estimate get/gift gas");
                    console.log(error);
                    this.otherState.contentBuying = -1;
                    this.otherState.isPremiumTransaction = false;
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {},
                        transactPopup: false,
                        buyingAction: false,
                        gifting: "",
                    }))
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
                    this.otherState.contentBuying = -1;
                    this.otherState.isPremiumTransaction = false;
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {},
                        transactPopup: false,
                        buyingAction: false,
                        gifting: "",
                    }))
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
                    this.otherState.contentBuying = -1;
                    this.otherState.isPremiumTransaction = false;
                    console.log("could not get gas price for publishing");
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {},
                        transactPopup: false,
                        buyingAction: false,
                        gifting: "",
                    }))
                }
            );*/
            this.setState(oldState => ({...oldState, gifting: acc, buyingPrice: 0, buyingAction: true}));
        }
    };

    confirmBuy = () => {
        const { contentList, gifting, transactionProps } = this.state;
        const { contentBuying, isPremiumTransaction } = this.otherState;
        console.log("isPremiumTransaction: " + isPremiumTransaction);
        if (contentBuying < 0) {
            this.notify("Error", "No selected content", "danger");
        } else {
            const content = this.web3.utils.asciiToHex(contentList[contentBuying].description);
            const method = (isPremiumTransaction)? this.Catalog.methods.getContentPremium(content) :
                ((gifting) ? this.Catalog.methods.giftContent(content, gifting) : this.Catalog.methods.getContent(content));

            method.send({
                from: this.props.account,
                gas: transactionProps.gas,
                gasPrice: transactionProps.gasPrice,
                value: (isPremiumTransaction ? 0 : contentList[contentBuying].price),
            }).then(
                (result) => this.setState(o => ({...o, loading: false})),
                (error) => {
                    console.log(error);
                    this.notify("Error", "Could not complete purchase", "danger");
                    this.setState(o => ({...o, loading: false}));
                }
            );

        }
        this.otherState = {contentBuying: -1, isPremiumTransaction: false};
        this.setState(oldState => ({...oldState, loading: true, gifting: "", buyingAction: false, transactionProps: {}, transactPopup: false}))
    };

    refreshBought = () => {
        this.Catalog.methods.grantsAvailable().call({from: this.props.account}).then(
            (result) => {
                console.log(result);
                if (!result) {
                    this.notify("Error", "Could not retrieve bought content", "danger");
                } else {
                    const list = [];
                    for (let i = 0; i < result.length; i++) {
                        list.push({
                            index: i,
                            description: this.web3.utils.hexToAscii(result[i]),
                        })
                    }
                    this.setState(oldState => ({...oldState, loading: false, boughtContent: list}));
                    this.notify("Success!", "Bought Content list updated!", "success");
                }
            },
            (error) => {
                console.log(error);
                this.notify("Error", "Could not retrieve bought content", "danger");
                this.setState(o => ({...o, loading: false}))
            }
        );
        this.setState(o => ({...o, loading: true}));
    };

    refreshFeedback = () => {
        this.Catalog.methods.feedbackAvailable().call({from: this.props.account}).then(
            (result) => {
                console.log(result);
                if (!result[0] || !result[1]) {
                    this.notify("Error", "Could not retrieve list of content to leave feedback for", "danger");
                } else {
                    const list = [];
                    for (let i = 0; i < result[0].length; i++) {
                        list.push({
                            index: i,
                            description: this.web3.utils.hexToAscii(result[0][i]),
                            address: result[1][i],
                        })
                    }
                    this.setState(oldState => ({...oldState, loading: false, feedbackToLeave: list}));
                    this.notify("Success!", "List of feedbacks to leave updated!", "success");
                }
            },
            (error) => {
                console.log(error);
                this.notify("Error", "Could not retrieve list of content to leave feedback for", "danger");
                this.setState(o => ({...o, loading: false}));
            }
        );
        this.setState(o => ({...o, loading: true}))
    };

    leaveFeedback = (idx) => () => {
        const content = this.state.feedbackToLeave[idx];
        if (content.address) {
            console.log("feedback " + content);
            this.Catalog.methods.leaveFeedback(content.address, 5, 5, 5).estimateGas({from: this.props.account}).then(
                (result) => this.setState(o => ({
                    ...o,
                    transactionProps: {...o.transactionProps, gas: result.toString()},
                    transactPopup: (o.transactionProps.balance && o.transactionProps.gasPrice && o.feedback),
                })),
                (error) => {
                    this.notify("Error", "Could not estimate gas for leaving feedback", "danger");
                    console.log("Could not estimate feedback gas");
                    console.log(error);
                    this.setState(oldState => ({
                        ...oldState,
                        feedbackLeaving: null,
                        feedbackOpen: false,
                        transactionProps: {},
                        transactPopup: false,
                    }));
                }
            );
            this.web3.eth.getBalance(this.props.account).then(
                (result) => this.setState(o => ({
                    ...o,
                    transactionProps: {...o.transactionProps, balance: result.toString()},
                })),
                (error) => {
                    console.log("could not get balance for account");
                    this.notify("Error", "Could not get balance for the current account, check the connection", "danger");
                    this.setState(o => ({
                        ...o,
                        feedbackLeaving: null,
                        feedbackOpen: false,
                        transactionProps: {},
                        transactPopup: (o.transactionProps.gas && o.transactionProps.gasPrice && o.feedback),
                    }));
                }
            );
            this.web3.eth.getGasPrice().then(
                (result) => this.setState(o => ({
                    ...o,
                    transactionProps: {...o.transactionProps, gasPrice: result.toString()},
                    transactPopup: (o.transactionProps.balance && o.transactionProps.gas && o.feedback),
                })),
                (error) => {
                    this.notify("Error", "Could not get gas price from the blockchain, check the connection", "danger");
                    console.log("could not get gas price for publishing");
                    this.setState(oldState => ({
                        ...oldState,
                        feedbackLeaving: null,
                        feedbackOpen: false,
                        transactionProps: {},
                        transactPopup: false,
                    }));
                }
            );
            this.setState(o => ({...o, feedbackLeaving: idx, feedbackOpen: true}));
        }
    };

    confirmedFeedback = () => {
        const { feedbackLeaving, feedbackToLeave, transactionProps, feedback } = this.state;
        const { appreciation, fairness, suggest } = feedback;
        console.log("confirm feedback");
        console.log(feedback);
        console.log(feedbackLeaving);
        console.log(feedbackToLeave[feedbackLeaving]);
        this.Catalog.methods
            .leaveFeedback(feedbackToLeave[feedbackLeaving].address, appreciation, fairness, suggest)
            .send({from: this.props.account, gas: transactionProps.gas, gasPrice: transactionProps.gasPrice})
            .then(
                (result) => {
                    this.notify("Success!", `Left feedback for content ${feedbackToLeave[feedbackLeaving].description}`, "success");
                    const feedList = feedbackToLeave.filter((item, idx) => idx !== feedbackLeaving).map((item, idx) =>
                        ({...item, index: idx})
                    );
                    console.log(feedList);
                    this.setState(o => ({...o, loading: false, feedbackLeaving: null, feedback: null, feedbackToLeave: feedList}));
                },
                (error) => {
                    console.log("error in confirm feedback");
                    console.log(error);
                    this.notify("Error", `Could not leave feedback for ${feedbackToLeave[feedbackLeaving].description}`, "danger");
                    this.setState(o => ({...o, loading: false, feedbackLeaving: null, feedback: null}));
                }
            );
        this.setState(o => ({...o, loading: true, feedbackOpen: false, transactionProps: {}, transactPopup: false}));
    };

    consume = (idx) => () => {
        console.log("consume" + idx);
        const content = this.state.boughtContent[idx];
        if (content.address) {
            const abi = JSON.parse(json.contracts["ContentManagementBase.sol:ContentManagementBase"].abi);
            const CMB = new this.web3.eth.Contract(abi, content.address);

            CMB.methods.consumeContent().estimateGas({from: this.props.account}).then(
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
                    this.notify("Error", "Could not estimate gas for consuming content", "danger");
                    console.log("Could not estimate consume gas");
                    console.log(error);
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {},
                        transactPopup: false,
                        consuming: null,
                    }))
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
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {},
                        transactPopup: false,
                        consuming: null,
                    }))
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
                    this.setState(oldState => ({
                        ...oldState,
                        transactionProps: {},
                        transactPopup: false,
                        consuming: null,
                    }))
                }
            );
            this.setState(oldState => ({
                ...oldState,
                /*transactionProps: {...oldState.transactionProps, gas: "8000000"},
                transactPopup: (oldState.transactionProps.balance && oldState.transactionProps.gasPrice),*/
                consuming: CMB
            }));
        } else {
            console.log("asking for address of content " + content.description);
            this.Catalog.methods.getContentAddress(this.web3.utils.asciiToHex(content.description)).call(
                {from: this.props.account}
            ).then(
                (result) => {
                    console.log(`returned address ${result.toString()}`);
                    this.setState(oldState => ({
                        ...oldState,
                        boughtContent: oldState.boughtContent.map((v, i) =>
                            (i === idx) ? {...v, address: result.toString()} : v
                        )
                    }));
                    this.consume(idx)();
                },
                (error) => {
                    console.log(error);
                    this.notify("Error", "Could not get Content's address", "danger");
                }
            )
        }
    };

    confirmConsume = () => {
        this.state.consuming.once('ProvideContent', {filter: {user: this.props.account}},
            (error, event) => {
                if (error) console.log("provideContent error: " + error);
                else {
                    const contentName = this.web3.utils.hexToAscii(event.returnValues.content);
                    this.notify("Success!", `Content "${contentName}" has been provided!`, "success", 10000);
                    const bought = this.state.boughtContent
                        .filter(content => content.description !== contentName)
                        .map((item, idx) => ({...item, index: idx}));
                    console.log(bought);
                    this.setState(oldState => ({...oldState, boughtContent: bought}));
                }
            }
        );
        this.state.consuming.once('CanLeaveFeedback', {filter: {user: this.props.account}},
            (error, event) => {
                if (error) console.log("canLeaveFeedback error: " + error);
                else  {
                    const contentName = this.web3.utils.hexToAscii(event.returnValues.content);
                    this.notify("Leave feedback", `You can now leave feedback for ${contentName}`, "material", 10000);
                    const feedbacks = [...this.state.feedbackToLeave, {
                        index: this.state.feedbackToLeave.length,
                        description: contentName,
                        address: event.address,
                    }];
                    this.setState(oldState => ({...oldState, feedbackToLeave: feedbacks}));
                }
            }
        );
        this.state.consuming.methods.consumeContent().send({
            from: this.props.account,
            gas: this.state.transactionProps.gas,
            gasPrice: this.state.transactionProps.gasPrice,
        }).then(
            (result) => {
                console.log(result);
                this.setState(o => ({...o, loading: false}));
                this.notify("Success!", "Request for access sent", "success");
            },
            (error) => {
                console.log(error);
                this.setState(o => ({...o, loading: false}));
                this.notify("Error", "Request for access denied or other error, check console log", "danger");
            }
        );
        this.setState(oldState => ({...oldState, loading: true, consuming: null, transactionProps: {}, transactPopup: false}));
    };

    buyPremium = (price, acc) => () => {
        console.log("buypremium");
        const method = (acc) ? this.Catalog.methods.giftPremium(acc) : this.Catalog.methods.buyPremium();
        method.estimateGas({from: this.props.account, value: price}).then(
            (result) => this.setState(o => ({...o,
                transactionProps: {...o.transactionProps, gas: result.toString()},
                transactPopup: o.transactionProps.gasPrice && o.transactionProps.balance,
            })),
            (error) => {
                this.notify("Error", "Could not estimate gas for purchasing subscriptions", "danger");
                this.setState(o => ({...o, transactionProps: {}, transactPopup: false, giftingPremium: false, premiumMethod: null}))
            }
        );
        this.web3.eth.getBalance(this.props.account).then(
            (result) => this.setState(o => ({...o,
                transactionProps: {...o.transactionProps, balance: result.toString()},
                transactPopup: o.transactionProps.gasPrice && o.transactionProps.gas,
            })),
            (error) => {
                this.notify("Error", "Could not get balance for the current account, check the connection", "danger");
                this.setState(o => ({...o, transactionProps: {}, transactPopup: false, giftingPremium: false, premiumMethod: null}))
            }
        );
        this.web3.eth.getGasPrice().then(
            (result) => this.setState(o => ({...o,
                transactionProps: {...o.transactionProps, gasPrice: result.toString()},
                transactPopup: o.transactionProps.gas && o.transactionProps.balance,
            })),
            (error) => {
                this.notify("Error", "Could not get gas price from the blockchain, check the connection", "danger");
                this.setState(o => ({...o, transactionProps: {}, transactPopup: false, giftingPremium: false, premiumMethod: null}))
            }
        );
        this.setState(o => ({...o, transactionProps: {price: price}, buyingPremium: false, premiumMethod: method}));
    };

    confirmPremium = () => {
        this.state.premiumMethod.send({
            from: this.props.account,
            gas: this.state.transactionProps.gas,
            gasPrice: this.state.transactionProps.gasPrice,
            value: this.state.transactionProps.price
        }).then(
            (result) => {
                let premium;
                if (this.state.giftingPremium) {
                    this.notify("Success!", "Gifted a premium subscription to the other user", "success");
                    premium = this.state.isPremium;
                } else {
                    this.notify("Success!",
                        `You ${this.state.isPremium ? "extended your" : "bought a"} Premium subscription!`, "success");
                    premium = true;
                }
                this.setState(o => ({...o, loading: false, isPremium: premium, premiumMethod: null, giftingPremium: false}));
            },
            (error) => {
                console.log(error);
                this.notify("Error", "Could not buy/gift content", "danger");
                this.setState(o => ({...o, loading: false, premiumMethod: null, giftingPremium: false}));
            }
        );
        this.setState(o => ({...o, transactionProps: {}, transactPopup: false, loading: true}));
    };

    componentDidMount() {
        this.updateContentList();
        this.Catalog.events.NewContentAvailable({fromBlock: "latest"}).on('data', (event) => {
            this.notify("New content!",
                `Content ${this.web3.utils.hexToAscii(event.returnValues.descr)} has been published on the Catalog!`,
                "material", 10000);
            const list = [...this.state.contentList, {
                index: this.state.contentList.length,
                description: this.web3.utils.hexToAscii(event.returnValues.descr),
                genre: this.web3.utils.hexToAscii(event.returnValues.genre),
                author: this.web3.utils.hexToAscii(event.returnValues.author),
                price: event.returnValues.price,
                views: 0,
            }];
            this.setState(oldState => ({...oldState, contentList: list, filteredList: list}));
        }).on('error', console.log);
        this.Catalog.events.GrantedAccess({filter: {user: this.props.account}, fromBlock: "latest"})
            .on('error', error => console.log("GrantedAccess: " + error))
            .on('data', event => {
                const { boughtContent, contentList } = this.state;
                console.log(event);
                const description = this.web3.utils.hexToAscii(event.returnValues.description);
                this.notify("Access!", `Obtained access to "${description}"!`, "success", 10000);
                const refresh = [...boughtContent, {
                    description: description,
                    index: boughtContent.length,
                    address: event.returnValues.requested
                }];
                console.log(contentList);
                const newList = contentList.map((item) =>
                    (item.description === description) ?
                        {...item, address: event.returnValues.requested} :
                        item
                );
                console.log("Granted Access modified contentList");
                console.log(newList);
                this.setState(oldState => ({...oldState, contentList: newList, boughtContent: refresh}));
            });
        this.Catalog.events.GotPremium({filter: {user: this.props.account}, fromBlock: "latest"})
            .on('error', error => console.log("GotPremium: " + error))
            .on('data', event => {
                console.log(event);
                console.log("user equals this account? " + (event.returnValues.user === this.props.account));
                this.notify("Premium!", `Obtained or extended a Premium subscription!`, "success", 10000);
                this.setState(oldState => ({...oldState, premiumFetching: false, isPremium: true}));
            });
        const premiumfun = () => {
            this.setState(oldState => ({...oldState, premiumFetching: true}));
            this.Catalog.methods.isPremium(this.props.account).call({from: this.props.account}).then(
                (result) => {
                    console.log("isPremium result: " + result);
                    this.setState(oldState => ({...oldState, premiumFetching: false, isPremium: result}));
                },
                (error) => {
                    this.notify("Error", "Could not retrieve premium subscription status", "danger");
                    this.setState(oldState => ({...oldState, premiumFetching: false}))
                }
            );
        };
        this.premiumUpdates = window.setInterval(premiumfun, 20000);
        premiumfun();
    }

    componentWillUnmount() {
        if (this.premiumUpdates) window.clearInterval(this.premiumUpdates);
    }

    render() {
        const {
            classes,
        } = this.props;

        const {
            authorList,
            genreList,
            panel,
            filteredList,
            contentList,
            boughtContent,
            feedbackToLeave,
            buyingPrice,
            buyingAction,
            consuming,
            premiumFetching,
            isPremium,
            transactionProps,
            transactPopup,
            buyingPremium,
            premiumMethod,
            giftingPremium,
            feedbackOpen,
            feedback,
        } = this.state;

        const defaultFun = x => x;

        const attributes = [
            {
                name: "genre",
                description: "Genre",
                copy: false,
                makeSmall: defaultFun
            },
            {
                name: "author",
                description: "Author",
                copy: false,
                makeSmall: defaultFun,
            },
            {
                name: "price",
                description: "Price",
                copy: false,
                makeSmall: defaultFun,
                extra: prettifyWei,
            },
            {
                name: "views",
                description: "Number of views",
                copy: false,
                makeSmall: defaultFun,

            },
        ];

        return (
            <div>
                <AppDrawer drawer={true} writeTitle={this.renderTitle} render={this.menu} loading={this.state.loading}>
                    <ReactNotification
                        ref={this.notificationRef}
                        types={[{
                            htmlClasses: classes.notification,
                            name: "material",
                        }]}
                    />
                    {(() => {
                        switch (panel) {
                            case Panels.FULL_LIST:
                                return(
                                    <div>
                                        <ContentList
                                            attributes={attributes}
                                            action={(i) => () => {
                                                console.log(contentList);
                                                this.otherState.contentBuying = i;
                                                this.setState(oldState => ({...oldState, buyingPrice: contentList[i].price}));
                                            }}
                                            actionName={"Buy"}
                                            action2={(i) => () => {
                                                this.otherState = { contentBuying: i, isPremiumTransaction: true };
                                                this.buy()()}
                                            }
                                            action2Name={"Obtain (Premium)"}
                                            list={filteredList}
                                            notify={this.notify}
                                        />
                                    </div>
                                );
                            case Panels.PLAY:
                                return(
                                    <div>
                                        <div className={classes.subheading}>
                                            <Typography variant={"body1"} className={classes.subMargin}>
                                                The list may not be synced with the server.
                                            </Typography>
                                            <Button variant={"contained"}
                                                    size={"small"}
                                                    onClick={this.refreshBought}
                                                    color={"secondary"}
                                                    className={classes.subMargin}>
                                                Refresh now
                                            </Button>
                                        </div>
                                        <ContentList
                                            className={classes.normalMargin}
                                            attributes={[]}
                                            action={this.consume}
                                            actionName={"Consume"}
                                            list={boughtContent}
                                            notify={this.notify}
                                        />
                                    </div>
                                );
                            case Panels.FEEDBACK:
                                return(
                                    <div>
                                        <div className={classes.subheading}>
                                            <Typography variant={"body1"} className={classes.subMargin}>
                                                The list may not be synced with the server.
                                            </Typography>
                                            <Button variant={"contained"}
                                                    size={"small"}
                                                    onClick={this.refreshFeedback}
                                                    color={"secondary"}
                                                    className={classes.subMargin}>
                                                Refresh now
                                            </Button>
                                        </div>
                                        <ContentList
                                            className={classes.normalMargin}
                                            attributes={[]}
                                            action={this.leaveFeedback}
                                            actionName={"Leave Feedback"}
                                            list={feedbackToLeave}
                                            notify={this.notify}
                                        />
                                    </div>
                                );
                            case Panels.BUY:
                                return (
                                    <div>
                                        <div style={{display: "flex"}}>
                                            <Typography variant={"subtitle2"}>Premium subscription:</Typography>
                                            <Typography
                                                style={{marginLeft: 16}}
                                                variant={"subtitle2"}
                                                color={"inherit"}
                                                className={premiumFetching ?
                                                    classes.prFetch :
                                                    (isPremium ? classes.premium : classes.notPremium)}>
                                                {premiumFetching ?
                                                    "Fetching..." :
                                                    (isPremium ? "Active" : "Not active")}
                                            </Typography>
                                        </div>
                                        <div style={{display: "flex", justifyContent: "center"}}>
                                            <Button
                                                color={"primary"}
                                                variant={"extendedFab"}
                                                className={classes.button}
                                                onClick={() => this.setState(o => ({...o, buyingPremium: true, giftingPremium: false}))} >
                                                {isPremium ?
                                                    <Timelapse className={classes.extendedIcon}/> :
                                                    <QueuePlayNext className={classes.extendedIcon}/>}
                                                {isPremium ? "Extend" : "Buy"}
                                            </Button>
                                            <Button
                                                color={"primary"}
                                                variant={"extendedFab"}
                                                className={classes.button}
                                                onClick={() => this.setState(o => ({...o, buyingPremium: true, giftingPremium: true}))} >
                                                <CardGiftcard className={classes.extendedIcon}/>
                                                Gift
                                            </Button>
                                        </div>
                                    </div>
                                );
                            case Panels.CHARTS:
                                return(
                                    <Charts authors={authorList} genres={genreList} web3={this.web3} Catalog={this.Catalog} account={this.props.account}/>
                                );
                            default:
                                return (
                                    <div>
                                        Not implemented.
                                    </div>
                                );
                        }
                    })()}
                    {feedbackOpen ?
                        <FeedbackForm
                            cancel={() => {console.log('de'); this.setState(o => ({...o, transactionProps: {}, feedbackOpen: false, feedbackLeaving: null}))}}
                            confirm={(feedback) => () => { console.log('de1');
                                this.setState(o => ({
                                    ...o,
                                    feedback: feedback,
                                    transactPopup: (o.transactionProps.gasPrice && o.transactionProps.gas && o.transactionProps.balance)
                                }))}}
                        /> : null
                    }
                    {buyingPrice ?
                    <BuyGiftDialog
                        price={buyingPrice}
                        cancel={() => this.setState(oldState => ({...oldState, buyingPrice: 0, buyingAction: false}))}
                        callback={this.buy}
                    /> : null}
                    {buyingPremium &&
                    <BuyGiftPremiumDialog
                        account={this.props.account}
                        catalog={this.Catalog}
                        confirm={this.buyPremium}
                        gifting={giftingPremium}
                        cancel={(error) => () => {
                            console.log("huehue");
                            this.setState(o => ({...o, buyingPremium: false, giftingPremium: false}));
                            error && this.notify("Error", "Could not fetch Premium subscription price from Catalog", "danger");
                        }}
                    />}
                    {transactPopup &&
                    <TransactionConfirmation
                        {...transactionProps}
                        ok={buyingAction ? this.confirmBuy :
                            (premiumMethod? this.confirmPremium :
                                (consuming? this.confirmConsume :
                                    (feedback ? this.confirmedFeedback : null)))}
                        cancel={() => this.setState(oldState => ({...oldState, buyingAction: false, consuming: false, transactionProps: {}, transactPopup: false}))}
                    />}
                </AppDrawer>
            </div>
        );
    }
}

UserApp.propTypes = {
    classes: PropTypes.object.isRequired,
    web3: PropTypes.object.isRequired,
    account: PropTypes.string.isRequired,
    catalog: PropTypes.string.isRequired,
    manageCenter: PropTypes.func.isRequired,
};

export default withStyles(styles)(UserApp);