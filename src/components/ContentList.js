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
import {
    ExpandMore
} from '@material-ui/icons';
import { ContentListStyle as styles } from "../styles/MaterialCustomStyles";

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

class ContentList extends React.Component {

    constructor(props) {
        super(props);
        this.divRef = React.createRef();
        this.handleResize = this.handleResize.bind(this);
    }


    state = {
        smallerBox: false,
    };

    handleResize() {
        console.log(this.divRef);
        if (this.divRef) {
            this.setState({smallerBox: (this.divRef.getBoundingClientRect().width < 531)});
        }
    }

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