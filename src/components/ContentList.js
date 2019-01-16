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
 *  File: ContentList.js
 *
 */
import React from 'react';
import PropTypes from 'prop-types';
import CopyToClipboard from 'react-copy-to-clipboard';
import { withStyles } from '@material-ui/core/styles';
import {
    ExpansionPanel,
    ExpansionPanelActions,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    Typography,
    Button,
    Tooltip
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { ContentListStyle as styles } from "../styles/MaterialCustomStyles";

/*
 * CopyWrapper Class
 *
 * A React Component that wraps another component and makes it clickable; when clicked, the component's text
 * gets copied into the clipboard
 */
const CopyWrapper = ({condition, placement, what, onCopy, children}) => (
    condition ?
        <Tooltip title={"Click to copy"} placement={placement}>
            <CopyToClipboard text={what} onCopy={onCopy}>
                {children}
            </CopyToClipboard>
        </Tooltip> :
        <div>
            {children}
        </div>
);

/*
 * ContentList Class
 *
 * A React Component that displays a list where each item has several (displayable) attributes.
 * The component is completely generic and can be used in a multitude of ways.
 */

class ContentList extends React.Component {

    constructor(props) {
        super(props);
        this.divRef = React.createRef();
        this.handleResize = this.handleResize.bind(this);
    }


    state = {
        smallerBox: false,
    };

    /*
     * Function that handles the resizing of the browser window.
     */
    handleResize() {
        if (this.divRef) {
            this.setState({smallerBox: (this.divRef.getBoundingClientRect().width < 531)});
        }
    }

    // React lifecycle methods to add/remove a 'resize' event listener when the component gets mounted/unmounted.
    componentDidMount() {
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    render() {
        const { classes, className, list, action, attributes, actionName, action2, action2Name, notify } = this.props;
        const percent = (100/attributes.length) + "%";
        return (
            <div className={className ? className : classes.root} ref={element => this.divRef = element}>
                {list.map((item, key) =>
                    <ExpansionPanel key={key}>
                        <ExpansionPanelSummary expandIcon={<ExpandMore/>}>
                            <Typography className={classes.heading}>{item.description}</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails className={classes.details}>
                            {attributes.map((attr, index) => (
                                <div key={index} style={{flexBasis: percent}}>
                                    <Typography variant={"subtitle2"} style={{marginRight: 12}}>{attr.description}</Typography>
                                    <CopyWrapper
                                        condition={attr.copy}
                                        placement={"bottom"}
                                        what={item[attr.name]}
                                        onCopy={() => notify("Copied!", "Copied to clipboard", "success")}>
                                        <Typography style={{cursor: attr.copy? "pointer" : "default"}}>
                                            {attr.extra ?
                                                (this.state.smallerBox ?
                                                    attr.makeSmall(attr.extra(item[attr.name])) :
                                                    attr.extra(item[attr.name])) :
                                                (this.state.smallerBox ?
                                                    attr.makeSmall(item[attr.name]) :
                                                    item[attr.name])}
                                        </Typography>
                                    </CopyWrapper>
                                </div>
                            ))}
                        </ExpansionPanelDetails>
                            <ExpansionPanelActions>
                                {Boolean(action) &&
                                <Button size={"small"} color={"secondary"} onClick={action(item.index)}>
                                    {actionName}
                                </Button>}
                                {Boolean(action2) &&
                                <Button size={"small"} color={"default"} onClick={action2(item.index)}>
                                    {action2Name}
                                </Button>}
                            </ExpansionPanelActions>
                    </ExpansionPanel>
                )}
            </div>
        );
    }

}

ContentList.propTypes = {
    classes: PropTypes.object.isRequired,
    list: PropTypes.arrayOf(PropTypes.object).isRequired,
    attributes: PropTypes.arrayOf(PropTypes.object).isRequired,
    action: PropTypes.func,
    actionName: PropTypes.string,
    action2: PropTypes.func,
    action2Name: PropTypes.string,
    notify: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default withStyles(styles)(ContentList);