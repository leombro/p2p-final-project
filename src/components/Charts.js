import React from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Grid,
    Card,
    CardHeader,
    CardContent,
    Chip,
    Typography,
    Avatar,
    List,
    ListItem,
    ListItemText,
    Divider,
    Menu,
    MenuItem,
} from '@material-ui/core';
import {
    DonutSmall,
    FavoriteBorder,
    RecordVoiceOver,
    AttachMoney,
} from '@material-ui/icons';
import { ChartsStyle as styles } from "../styles/MaterialCustomStyles";

class Feedbacks extends React.Component {


    render() {
        const { avg, appreciation, fairness, suggest } = this.props;

        return (
            <div style={{flexGrow: 1}}>
                <Typography variant={"subtitle1"}>
                    Top rated contents
                </Typography>
                <List>
                    <Typography variant={"subtitle2"}>
                        Average
                    </Typography>
                    <ListItem>
                        <Avatar><DonutSmall/></Avatar>
                        <ListItemText primary={avg}/>
                    </ListItem>
                    <Typography variant={"subtitle2"}>
                        Appreciation
                    </Typography>
                    <ListItem>
                        <Avatar><FavoriteBorder/></Avatar>
                        <ListItemText primary={appreciation}/>
                    </ListItem>
                    <Typography variant={"subtitle2"}>
                        Price fairness
                    </Typography>
                    <ListItem>
                        <Avatar><AttachMoney/></Avatar>
                        <ListItemText primary={fairness}/>
                    </ListItem>
                    <Typography variant={"subtitle2"}>
                        Likeliness to suggest to other users
                    </Typography>
                    <ListItem>
                        <Avatar><RecordVoiceOver/></Avatar>
                        <ListItemText primary={suggest}/>
                    </ListItem>
                </List>
            </div>
        );
    }
}

Feedbacks.propTypes = {
    avg: PropTypes.string.isRequired,
    appreciation: PropTypes.string.isRequired,
    fairness: PropTypes.string.isRequired,
    suggest: PropTypes.string.isRequired,
};

class Charts extends React.Component {

    constructor(props) {
        super(props);
        this.state.author.name = this.props.authors[0];
        this.state.genre.name = this.props.genres[0];
    }


    state = {
        global: {
            recentContents: ["Loading...", "Loading...", "Loading...", "Loading...", "Loading..."],
            topRatedAvg: "Loading...",
            topRatedAppreciation: "Loading...",
            topRatedFairness: "Loading...",
            topRatedSuggest: "Loading...",
        },
        author: {
            name: "",
            mostRecent: "Loading...",
            mostViewed: "Loading...",
            topRatedAvg: "Loading...",
            topRatedAppreciation: "Loading...",
            topRatedFairness: "Loading...",
            topRatedSuggest: "Loading...",
        },
        genre: {
            name: "",
            mostRecent: "Loading...",
            mostViewed: "Loading...",
            topRatedAvg: "Loading...",
            topRatedAppreciation: "Loading...",
            topRatedFairness: "Loading...",
            topRatedSuggest: "Loading...",
        },
        authorAnchorEl: null,
        genreAnchorEl: null,
    };

    showAuthors = event => {
        const target = event.currentTarget;
        this.setState(o => ({...o, authorAnchorEl: target}))
    };

    showGenres = event => {
        const target = event.currentTarget;
        this.setState(o => ({...o, genreAnchorEl: target}))
    };

    authorClose = () =>
        this.setState(o => ({...o, authorAnchorEl: null}));

    genreClose = () =>
        this.setState(o => ({...o, genreAnchorEl: null}));

    handleAuthorMenu = (event, index) => {
        console.log(`refreshing author ${this.props.authors[index]}`);
        this.setState(o => ({
            ...o,
            author: {
                name: this.props.authors[index],
                mostRecent: "Loading...",
                mostViewed: "Loading...",
                topRatedAvg: "Loading...",
                topRatedAppreciation: "Loading...",
                topRatedFairness: "Loading...",
                topRatedSuggest: "Loading...",
            }
        }), this.refreshAuthor);
    };

    handleGenreMenu = (event, index) => {
        console.log(`refreshing genre ${this.props.genres[index]}`);
        this.setState(o => ({
            ...o,
            genre: {
                name: this.props.genres[index],
                mostRecent: "Loading...",
                mostViewed: "Loading...",
                topRatedAvg: "Loading...",
                topRatedAppreciation: "Loading...",
                topRatedFairness: "Loading...",
                topRatedSuggest: "Loading...",
            }
        }), this.refreshGenre);
    };

    refreshGenre = () => {
        this.setState(o => ({...o, genreAnchorEl: null}));
        const {Catalog, web3, account} = this.props;
        const genre = web3.utils.asciiToHex(this.state.genre.name);
        Catalog.methods.getLatestByGenre(genre).call({from: account}).then(
            (result) => {
                this.setState(o => ({...o, genre: {...o.genre, mostRecent: web3.utils.hexToAscii(result)}}));
            },
            (error) => {
                console.log(`Error in retrieving latest content with genre ${this.state.genre.name}`);
                this.setState(o => ({...o, genre: {...o.genre, mostRecent: "Error!"}}));
            }
        );
        Catalog.methods.getMostPopularByGenre(genre).call({from: account}).then(
            (result) => {
                this.setState(o => ({...o, genre: {...o.genre, mostViewed: web3.utils.hexToAscii(result)}}));
            },
            (error) => {
                console.log(`Error in retrieving most popular content with genre ${this.state.genre.name}`);
                this.setState(o => ({...o, genre: {...o.genre, mostViewed: "Error!"}}));
            }
        );
        Catalog.methods.getMostRatedByGenre(genre).call({from: account}).then(
            (result) => {
                this.setState(o => ({...o, genre: {...o.genre, topRatedAvg: web3.utils.hexToAscii(result)}}));
            },
            (error) => {
                console.log(`Error in retrieving most rated (average) content with genre ${this.state.genre.name}`);
                this.setState(o => ({...o, genre: {...o.genre, topRatedAvg: "Error!"}}));
            }
        );
        ["Appreciation", "Fairness", "Suggest"].forEach((category, idx) => {
            Catalog.methods.getMostRatedByGenre(genre, idx+1).call({from: account}).then(
                (result) => {
                    this.setState(o => ({...o, genre: {...o.genre, ["topRated" + category]: web3.utils.hexToAscii(result)}}));
                },
                (error) => {
                    console.log(`Error in retrieving most rated (${category}) content with genre ${this.state.genre.name}`);
                    this.setState(o => ({...o, genre: {...o.genre, ["topRated" + category]: "Error!"}}));
                }
            );
        });
    };

    refreshAuthor = () => {
        this.setState(o => ({...o, authorAnchorEl: null}));
        const { Catalog, web3, account } = this.props;
        const author = web3.utils.asciiToHex(this.state.author.name);
        Catalog.methods.getLatestByAuthor(author).call({from: account}).then(
            (result) => {
                this.setState(o => ({...o, author: {...o.author, mostRecent: web3.utils.hexToAscii(result)}}));
            },
            (error) => {
                console.log(`Error in retrieving latest content with author ${this.state.author.name}`);
                this.setState(o => ({...o, author: {...o.author, mostRecent: "Error!"}}));
            }
        );
        Catalog.methods.getMostPopularByAuthor(author).call({from: account}).then(
            (result) => {
                this.setState(o => ({...o, author: {...o.author, mostViewed: web3.utils.hexToAscii(result)}}));
            },
            (error) => {
                console.log(`Error in retrieving most popular content with author ${this.state.author.name}`);
                this.setState(o => ({...o, author: {...o.author, mostViewed: "Error!"}}));
            }
        );
        Catalog.methods.getMostRatedByAuthor(author).call({from: account}).then(
            (result) => {
                this.setState(o => ({...o, author: {...o.author, topRatedAvg: web3.utils.hexToAscii(result)}}));
            },
            (error) => {
                console.log(`Error in retrieving most rated (average) content with author ${this.state.author.name}`);
                this.setState(o => ({...o, author: {...o.author, topRatedAvg: "Error!"}}));
            }
        );
        ["Appreciation", "Fairness", "Suggest"].forEach((category, idx) => {
            Catalog.methods.getMostRatedByAuthor(author, idx+1).call({from: account}).then(
                (result) => {
                    this.setState(o => ({...o, author: {...o.author, ["topRated" + category]: web3.utils.hexToAscii(result)}}));
                },
                (error) => {
                    console.log(`Error in retrieving most rated (${category}) content with author ${this.state.author.name}`);
                    this.setState(o => ({...o, author: {...o.author, ["topRated" + category]: "Error!"}}));
                }
            );
        });
    };

    componentDidMount() {
        console.log("CDM");
        const { Catalog, web3, account } = this.props;
        Catalog.methods.getNewContentsList(5).call({from: account}).then(
            (result) => {
                const list = result.map(item => web3.utils.hexToString(item));
                if (list.length < 5) {
                    list.concat(new Array(5 - list.length).fill("N/A"));
                }
                this.setState(o => ({...o, global: {...o.global, recentContents: list}}))
            },
            (error) => {
                console.log("Error in retrieving recent contents");
                const list = [1,2,3,4,5].map(() => "Error!");
                this.setState(o => ({...o, global: {...o.global, recentContents: list}}))
            }
        );
        Catalog.methods.getMostRated().call({from: account}).then(
            (result) => {
                this.setState(o => ({...o, global: {...o.global, topRatedAvg: web3.utils.hexToString(result)}}))
            },
            (error) => {
                console.log("Error in retrieving top rated content (average)");
                this.setState(o => ({...o, global: {...o.global, topRatedAvg: "Error!"}}))
            }
        );
        ["Appreciation", "Fairness", "Suggest"].forEach((category, idx) => {
            Catalog.methods.getMostRated(idx+1).call({from: account}).then(
                (result) => {
                    this.setState(o => ({
                        ...o,
                        global: {
                            ...o.global,
                            ["topRated" + category]: web3.utils.hexToString(result),
                        }
                    }));
                },
                (error) => {
                    console.log(`Error in retrieving top rated content (${category})`);
                    this.setState(o => ({...o, global: {...o.global, ["topRated" + category]: "Error!"}}))
                }
            );
        });
        this.refreshAuthor();
        this.refreshGenre();
    }

    render() {
        const { classes } = this.props;
        const {
            global,
            author,
            genre,
            authorAnchorEl,
            genreAnchorEl,
        } = this.state;

        const authorOpen = Boolean(authorAnchorEl), genreOpen = Boolean(genreAnchorEl);

        return (
            <Grid container className={classes.root} spacing={24}>
                <Grid item xs={12}>
                    <Card className={classes.card}>
                        <CardHeader
                            avatar={
                                <Avatar className={classes.avatarRed}>
                                    O
                                </Avatar>
                            }
                            title={"Overview"}
                            subheader={"Information about all contents"}
                        />
                        <CardContent>
                            <div style={{display: 'flex', flexDirection: 'row'}}>
                                <div style={{flexGrow: 1}}>
                                    <Typography variant={"subtitle1"}>
                                        Latest contents added to the catalog
                                    </Typography>
                                    <List>
                                        {global.recentContents.map((item, idx) => (
                                            <ListItem key={idx}>
                                                <Avatar>{idx+1}</Avatar>
                                                <ListItemText primary={item}/>
                                            </ListItem>
                                        ))}
                                    </List>
                                </div>
                                <Divider/>
                                <Feedbacks
                                    avg={global.topRatedAvg}
                                    appreciation={global.topRatedAppreciation}
                                    fairness={global.topRatedFairness}
                                    suggest={global.topRatedSuggest}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card className={classes.card}>
                        <CardHeader
                            avatar={
                                <Avatar className={classes.avatarGreen}>
                                    A
                                </Avatar>
                            }
                            title={"Author"}
                            subheader={"Information about contents by a specific author"}
                            action={<Chip onClick={this.showAuthors} variant={"outlined"} color={"secondary"} label={author.name} avatar={<Avatar>{author.name[0].toUpperCase()}</Avatar>}/>}
                        />
                        <Menu
                            id={"-menu"}
                            anchorEl={authorAnchorEl}
                            open={authorOpen}
                            onClose={this.authorClose}
                            PaperProps={{
                                style: {
                                    maxHeight: 48 * 4.5,
                                    width: 200,
                                }
                            }}>
                            {this.props.authors.map((item, idx) => (
                                <MenuItem key={item} onClick={event => this.handleAuthorMenu(event, idx)}>
                                    {item}
                                </MenuItem>
                                ))}
                        </Menu>
                        <CardContent>
                            <Grid container>
                                <Grid item xs={6}>
                                    <Typography variant={"subtitle1"}>
                                        Latest
                                    </Typography>
                                    <List>
                                        <ListItem>
                                            <Avatar>{author.mostRecent[0].toUpperCase()}</Avatar>
                                            <ListItemText primary={author.mostRecent}/>
                                        </ListItem>
                                    </List>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant={"subtitle1"}>
                                        Most viewed
                                    </Typography>
                                    <List>
                                        <ListItem>
                                            <Avatar>{author.mostViewed[0].toUpperCase()}</Avatar>
                                            <ListItemText primary={author.mostViewed}/>
                                        </ListItem>
                                    </List>
                                </Grid>
                                <Grid item xs={12}>
                                    <Feedbacks
                                        avg={author.topRatedAvg}
                                        appreciation={author.topRatedAppreciation}
                                        fairness={author.topRatedFairness}
                                        suggest={author.topRatedSuggest}/>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card className={classes.card}>
                        <CardHeader
                            avatar={
                                <Avatar className={classes.avatarBlue}>
                                    G
                                </Avatar>
                            }
                            title={"Genre"}
                            subheader={"Information about contents of a specific genre"}
                            action={<Chip onClick={this.showGenres} variant={"outlined"} color={"secondary"} label={genre.name} avatar={<Avatar>{genre.name[0].toUpperCase()}</Avatar>}/>}
                        />
                        <Menu
                            id={"-menu"}
                            anchorEl={genreAnchorEl}
                            open={genreOpen}
                            onClose={this.genreClose}
                            PaperProps={{
                                style: {
                                    maxHeight: 48 * 4.5,
                                    width: 200,
                                }
                            }}>
                            {this.props.genres.map((item, idx) => (
                                <MenuItem key={item} onClick={event => this.handleGenreMenu(event, idx)}>
                                    {item}
                                </MenuItem>
                                ))}
                        </Menu>
                        <CardContent>
                            <Grid container>
                                <Grid item xs={6}>
                                    <Typography variant={"subtitle1"}>
                                        Latest
                                    </Typography>
                                    <List>
                                        <ListItem>
                                            <Avatar>{genre.mostRecent[0].toUpperCase()}</Avatar>
                                            <ListItemText primary={genre.mostRecent}/>
                                        </ListItem>
                                    </List>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant={"subtitle1"}>
                                        Most viewed
                                    </Typography>
                                    <List>
                                        <ListItem>
                                            <Avatar>{genre.mostViewed[0].toUpperCase()}</Avatar>
                                            <ListItemText primary={genre.mostViewed}/>
                                        </ListItem>
                                    </List>
                                </Grid>
                                <Grid item xs={12}>
                                    <Feedbacks
                                        avg={genre.topRatedAvg}
                                        appreciation={genre.topRatedAppreciation}
                                        fairness={genre.topRatedFairness}
                                        suggest={genre.topRatedSuggest}/>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    }
}

Charts.propTypes = {
    classes: PropTypes.object.isRequired,
    authors: PropTypes.array.isRequired,
    genres: PropTypes.array.isRequired,
    web3: PropTypes.object.isRequired,
    Catalog: PropTypes.object.isRequired,
    account: PropTypes.string.isRequired,
};

export default withStyles(styles)(Charts);