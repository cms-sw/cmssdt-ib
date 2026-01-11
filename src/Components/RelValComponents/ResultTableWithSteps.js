import React, {Component} from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import ExitCodeStore from "../../Stores/ExitCodeStore";
import * as config from "../../relValConfig";
import {LABEL_COLOR, LABELS_TEXT, RELVAL_STATUS_ENUM} from "../../relValConfig";
import uuid from 'uuid';
import Button from "react-bootstrap/es/Button";
import {Modal, OverlayTrigger, Popover} from "react-bootstrap";
import CommandStore from "../../Stores/CommandStore";
import {
    filterNameList,
    getDisplayName,
    getObjectKeys,
    isRelValKnownFailed, isRelValTrackedForFailed,
    valueInTheList
} from "../../Utils/processing";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import ShowArchStore from '../../Stores/ShowArchStore';

const {urls} = config;

/**
 * returns the link address for a given Ib and an arch
 */
function getLogAddress(arch, ib, step, workflowName, workflowID, wasDASErr, typeKey, nameKey) {
    // TODO fix relvals
    let filename = '';
    if (!wasDASErr) {
        filename = 'step' + step + '_' + workflowName + '.log'
    } else {
        filename = 'step1_dasquery.log';
    }
    return urls.relValLog(arch, ib, workflowID, workflowName, filename, typeKey, nameKey)
}

function getLabelName(name) {
    return LABELS_TEXT[name] ? LABELS_TEXT[name] : name;
}

function getIb(date, que, flavor) {
    // CMSSW_10_1_X_2018-03-21-2300
    return `${que}_${flavor}_${date}`;
}

function getReleaseQue(ibQue) {
    return ibQue + '_X';
}

class ResultTableWithSteps extends Component {
    constructor(props) {
        super(props);
        this._loadData = this._loadData.bind(this);
        this.state = {
            showModal: false,
            workFlowsToShow: [],
        };
    }

    _handleClose() {
        this.setState({showModal: false});
    }

    _loadData() {
        let workflowHashes = this.state.workflowHashes;
        this.setState({
            workFlowsToShow: CommandStore.getWorkFlowList(workflowHashes),
        })
    }

    _handleShow(steps, cmdName) {
        return () => {
            this.setState({
                cmdName,
                showModal: true,
                workflowHashes: steps.map(i => i.workflowHash),
                workFlowsToShow: CommandStore.getWorkFlowList(steps.map(i => i.workflowHash))
            });
        }
    }

    _renderLabel(text, color) {
        return (
            <span style={{backgroundColor: color}} className="label">
                        {text}
                    </span>
        )
    }

    _rowWithLabel(text, number, logUrl, steps, backgroundColor, cmdName, glyphicon) {
        let logComponent;
        let renderedGlyphicon = glyphicon ? (<span className={"glyphicon " + glyphicon}/> ): null;
        if (logUrl) {
            logComponent = (
                <a target="_blank" href={logUrl}>
                    <span style={{backgroundColor: backgroundColor}} className="btn label">
                        {text} {renderedGlyphicon}
                    </span>
                </a>
            )
        } else {
            logComponent = (
                <span style={{backgroundColor: backgroundColor}} className="btn label disabled">
                        {text}
                    </span>
            )
        }
        return (
            <div key={uuid.v4()}>
                <span className="btn label label-default" onClick={this._handleShow(steps, cmdName).bind(this)}>
                    {number}
                </span>
                {logComponent}
            </div>
        )
    }

    _renderSteps({isExpanded, ib, archKey, data, typeKey, nameKey}) {
        /**
         * Return rendered content for the cell
         */
        let renderedStepList = [];
        const {id, name, steps, exitcode} = data;
        for (let i = steps.length; i > 0; i--) {
            let logUrl, label;
            let step = steps[i - 1];
            const {status, errors, warnings} = step;
            let glyphicon = isRelValTrackedForFailed(data) ? "glyphicon-eye-open" : null;
            if (status === RELVAL_STATUS_ENUM.PASSED) {
                let labelColor;
                if (errors > 0) {
                    labelColor = LABEL_COLOR.PASSED_ERRORS_COLOR
                } else if (warnings > 0) {
                    labelColor = LABEL_COLOR.PASSED_WARNINGS_COLOR
                } else {
                    labelColor = LABEL_COLOR.PASSED_COLOR
                }
                logUrl = getLogAddress(archKey, ib, i, name, id, false, typeKey, nameKey);
                label = this._rowWithLabel(getLabelName(step.status), i, logUrl, steps, labelColor, name, glyphicon)
            } else if (status === RELVAL_STATUS_ENUM.FAILED) {
                let labelColor = isRelValKnownFailed(data) ? LABEL_COLOR.PASSED_COLOR : LABEL_COLOR.FAILED_COLOR;
                logUrl = getLogAddress(archKey, ib, i, name, id, false, typeKey, nameKey);
                label = this._rowWithLabel(ExitCodeStore.getExitCodeName(exitcode), i, logUrl, steps, labelColor, name, glyphicon)
            } else if (status === RELVAL_STATUS_ENUM.DAS_ERROR) {
                logUrl = getLogAddress(archKey, ib, i, name, id, true, typeKey, nameKey);
                label = this._rowWithLabel(getLabelName(step.status), i, logUrl, steps, LABEL_COLOR.DAS_ERROR_COLOR, name, glyphicon)
            } else if (status === RELVAL_STATUS_ENUM.NOTRUN) {
                logUrl = getLogAddress(archKey, ib, i, name, id, false, typeKey, nameKey);
                label = this._rowWithLabel(getLabelName(step.status), i, logUrl, steps, LABEL_COLOR.NOT_RUN_COLOR, name, glyphicon)
            } else if (status === RELVAL_STATUS_ENUM.TIMEOUT) {
                logUrl = getLogAddress(archKey, ib, i, name, id, false, typeKey, nameKey);
                label = this._rowWithLabel(getLabelName(step.status), i, logUrl, steps, LABEL_COLOR.FAILED_COLOR, name, glyphicon)
            } else {
                console.error('Unknown status')
            }

            renderedStepList.push(label);
            if (!isExpanded) {
                // if row is not expanded
                break;
            }
        }
        return renderedStepList;
    }

    componentWillMount() {
        CommandStore.on("change", this._loadData);
        ShowArchStore.on("change", this.forceUpdate);
    }

    componentWillUnmount() {
        CommandStore.removeListener("change", this._loadData);
        ShowArchStore.removeListener("change", this.forceUpdate);
    }

    render() {
        let tableConfig = [];
        const {filteredRelVals, selectedArchs, selectedGPUs, selectedOthers, selectedFlavors, style, selectedFilterStatus} = this.props;
        const {structure = {}, ibDate, ibQue} = this.props;
        const archColorScheme = ShowArchStore.getColorsSchemeForQue(
            getReleaseQue(ibQue)
        );
        const doFilterColumn = valueInTheList(selectedFilterStatus, 'On');
        const popoverClickRootClose = (
            <Popover id="popover-trigger-click-root-close">
                Copied!
            </Popover>
        );
        const modalCmd = (
            <Modal show={this.state.showModal} onHide={this._handleClose.bind(this)} bsSize="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <div style={{overflow: 'auto'}}>
                            {this.state.cmdName}
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{overflow: 'auto'}}>
                        {this.state.workFlowsToShow.map((i, index) => {
                            return (
                                <p key={uuid.v4()}>
                                    <b>Step {index + 1}  </b>
                                    <CopyToClipboard text={i.command}>
                                        <OverlayTrigger
                                            trigger="click"
                                            rootClose
                                            placement="bottom"
                                            overlay={popoverClickRootClose}
                                        >
                                            <Button bsStyle="primary" bsSize="small">
                                                Copy to clipboard
                                            </Button>
                                        </OverlayTrigger>
                                    </CopyToClipboard>
                                    <br/>
                                    <code style={{whiteSpace: "pre-line"}}>{i.command}</code>
                                </p>
                            )
                        })}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this._handleClose.bind(this)}>Close</Button>
                </Modal.Footer>
            </Modal>
        );
        if (structure.dataLoaded) {
            let flavorKeys = getObjectKeys(structure.flavors).sort().reverse();
            filterNameList(flavorKeys, selectedFlavors).forEach(flavorKey => {
                let configObject = {
                    Header: () => <div>{getDisplayName(flavorKey)}</div>,
                    columns: []
                };
                let archKeys = getObjectKeys(structure.flavors[flavorKey]);
                filterNameList(archKeys, selectedArchs).forEach(archKey => {
                    Object.keys(structure.flavors[flavorKey][archKey]).forEach(typeKey => {
                        let typeKeys = getObjectKeys(structure.flavors[flavorKey][archKey][typeKey]);
                        let selectedKeys = [];
                        if (typeKey === "gpu") { selectedKeys = filterNameList(typeKeys, selectedGPUs);}
                        else if (typeKey === "other") { selectedKeys = filterNameList(typeKeys, selectedOthers);}
                        else if (selectedGPUs === "" ) {selectedKeys.push("");}
                        selectedKeys.forEach(nameKey => {
                            configObject.columns.push({
                                Header: () => {
                                    const statistics = structure.relvalStatus[flavorKey][archKey][typeKey][nameKey];
                                    const statusLabels = (
                                        <p key={uuid.v4()}>
                                            {this._renderLabel(statistics.passed, LABEL_COLOR.PASSED_COLOR)}
                                            {this._renderLabel(statistics.known_failed, LABEL_COLOR.PASSED_ERRORS_COLOR)}
                                            {this._renderLabel(statistics.failed, LABEL_COLOR.FAILED_COLOR)}
                                            {/*{this._renderLabel(statistics.size, "grey")}*/}
                                        </p>
                                    );
                                    const typeLabel = typeKey !== "" && (
                                        <p key={uuid.v4()}><b>{nameKey}</b></p>
                                    );
                                    const archLabels = archKey.split("_").map(str => (
                                        <div key={uuid.v4()}
                                            style={{backgroundColor: archColorScheme[str],
                                            color: "white",
                                            padding: "2px 6px",
                                            marginBottom: 1,
                                            borderRadius: 2}}
                                        >{str}</div>
                                    ));
                                    return (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", height: "auto", overflow: "visible" }}>
                                            {archLabels}
                                            {typeLabel}
                                            {statusLabels}
                                        </div>
                                    );
                                },
                                // accessor: "id",
                                // Used for filtering
                                accessor: relVal => {
                                    let data;
                                    if (structure.flavors[flavorKey][archKey][typeKey][nameKey]) {
                                        data = structure.flavors[flavorKey][archKey][typeKey][nameKey][relVal.id];
                                    }
                                    if (data) {
                                        const {steps, exitcode} = data;
                                        const last_step = steps[steps.length - 1];
                                        const {status} = last_step;
                                        if (status === RELVAL_STATUS_ENUM.PASSED) {
                                            return getLabelName(status);
                                        } else if (status === RELVAL_STATUS_ENUM.FAILED) {
                                            return ExitCodeStore.getExitCodeName(exitcode);
                                        } else if (status === RELVAL_STATUS_ENUM.DAS_ERROR) {
                                            return getLabelName(status);
                                        } else if (status === RELVAL_STATUS_ENUM.NOTRUN) {
                                            return getLabelName(status);
                                        } else if (status === RELVAL_STATUS_ENUM.TIMEOUT) {
                                            return getLabelName(status);
                                        } else {
                                            return null;
                                        }
                                    } else {
                                        return null;
                                    }
                                },
                                id: flavorKey + "-" + archKey + "-" + typeKey + "-" + nameKey,
                                filterable: doFilterColumn,
                                Cell: props => {
                                    // const id = props.value;
                                    const id = props.original.id;
                                    const {isExpanded} = props;
                                    let data;
                                    if (structure.flavors[flavorKey][archKey][typeKey][nameKey]) {
                                        data = structure.flavors[flavorKey][archKey][typeKey][nameKey][id];
                                    }
                                    if (data) {
                                        const ib = getIb(ibDate, ibQue, flavorKey);
                                        let renderedStepList = this._renderSteps({isExpanded, ib, archKey, data, typeKey, nameKey});
                                        return <div style={{
                                            width: `${props.value}%`,
                                            height: '100%',
                                            padding: '2px 20px',
                                        }}>{renderedStepList}</div>;
                                    } else {
                                        // Render empty div
                                        return <div style={{
                                            // width: `${props.value}%`,
                                            // height: '100%',
                                            textAlign: 'center',
                                            // margin: 'auto',
                                        }}> --- </div>
                                    }
                                },
                            });
                        });
		                });
                });
                tableConfig.push(configObject);
            })
        }
        const columns = [
            {
                columns: [
                    {
                        expander: true,
                    },
                    {
                        // expander: true,
                        Header: "#",
                        accessor: "index",
                        maxWidth: 100,
                        // filterable: true,
                        // Cell: props => <b>{props.value}</b>, // shows index in unfiltered list
                        Cell: props => <b>{props.index + 1}</b>, // Shows index in table
                    },
                    {
                        Header: "Workflow #",
                        accessor: "id",
                        maxWidth: 100,
                        filterable: doFilterColumn,
                        sortMethod: (a, b) => parseFloat(a) > parseFloat(b) ? 1 : -1,
                        Cell: (props) => {
                            const popoverShowCmdName = (
                                <Popover id={'popover-' + props.original.cmdName}>
                                    <div style={{overflow: 'auto'}}>
                                        {props.original.cmdName}
                                    </div>
                                </Popover>
                            );
                            return (
                                <OverlayTrigger
                                    // trigger="click"
                                    // rootClose
                                    placement="top"
                                    overlay={popoverShowCmdName}>
                                    <b>{props.value}</b>
                                </OverlayTrigger>
                            )
                        }
                    },
                ]
            },
            ...tableConfig
        ];
        return (
            [modalCmd,
                <ReactTable
                    //TODO even if data does not change, it close on every re-render
                    collapseOnDataChange={false}
                    data={filteredRelVals}
                    columns={columns}
                    defaultPageSize={100}
                    style={style}
                    pageSizeOptions= {[20, 50, 100, 500, 1000]}
                    className={'-striped -highlight'}
                />
            ]
        )
    }
}

export default ResultTableWithSteps;
