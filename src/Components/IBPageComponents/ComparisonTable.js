import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { Label, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {
    checkLabelType,
    getAllActiveArchitecturesFromIBGroupByFlavor, getDisplayName, getInfoFromRelease,
    valueInTheList
} from '../../Utils/processing';
import _ from 'underscore';
import uuid from 'uuid';
import { config, showLabelConfig } from '../../config';
import ShowArchStore from "../../Stores/ShowArchStore";

const {tooltipDelayInMs, urls} = config;

function renderTooltip(cellContent, tooltipContent) {
    return (
        <OverlayTrigger key={uuid.v4()} placement="top"
                        overlay={<Tooltip id={uuid.v4()}>{tooltipContent}</Tooltip>}
                        delay={tooltipDelayInMs}>
            {cellContent}
        </OverlayTrigger>
    )
}

function renderCell(cellInfo) {
    return (
        <td key={uuid.v4()}>
            {cellInfo}
        </td>
    )
}

function renderLabel({colorType = "default", value, glyphicon, link, tooltipContent} = {}) {
    if (tooltipContent !== undefined) {
        const cellContent = (
            <a href={link} className={`btn label label-${colorType}`}>
                {glyphicon ? <span className={`glyphicon ${glyphicon}`}/> : value}
            </a>
        );
        return renderTooltip(cellContent, tooltipContent);

    } else {
        return (
            <a href={link} className={`btn label label-${colorType}`}>
                {glyphicon ? <span className={`glyphicon ${glyphicon}`}/> : value}
            </a>
        );
    }
}

const getBuildOrUnitUrl = function (params) {
    const {file, arch, ibName} = params;
    const urlParameter = params.urlParameter ? params.urlParameter : '';
    if (!file) {
        // do nothing
    } else if (file === 'not-ready') {
        return urls.scramDetailUrl + arch + ";" + ibName
    } else {
        let link_parts = file.split('/');
        const si = 4;
        link_parts = link_parts.slice(si, si + 5);
        return urls.buildOrUnitTestUrl + link_parts.join('/') + urlParameter;
    }
};

const getRelValUrl = function (params) {
    const {file, arch, ibName, selectedStatus} = params;
    if (!file) {
        // do nothing
    } else if (file === 'not-ready') {
        return urls.relVals + arch + ';' + ibName
    } else {
        const [ , que, flavor, date] = getInfoFromRelease(ibName);  // fullMatch, que, flavor, date
        return urls.newRelValsSpecific(que, date, flavor, arch, selectedStatus );
    }
};

const getFWliteUrl = function (params) {
    const {file} = params;
    if (file === 'not-ready') {
        // return nothing
    } else {
        const si = 4;
        let link_parts = file.split('/');
        link_parts = link_parts.slice(si, si + 5);
        return urls.fwliteUrl + link_parts.join('/');
    }
};

const getOtherTestUrl = function (params) {
    const {file} = params;
    const si = 4;
    let link_parts = file.split('/');
    link_parts = link_parts.slice(si, si + 5);
    return urls.showAddOnLogsUrls + link_parts.join('/') + '/addOnTests/';
};

class ComparisonTable extends Component {
    static propTypes = {
        data: PropTypes.array
    };

    constructor(props) {
        super(props);
        this.getArchSettings = this.getArchSettings.bind(this);
        const {data, releaseQue} = props;
        let  que,  date;
        if (data[0]){
            [, que, , date] = getInfoFromRelease( data[0].release_name);  // fullMatch, que, flavor, date
            this.state = {date: date}
        }
        this.state = {
            ibComparison: data,
            que,
            date,
            archsByIb: getAllActiveArchitecturesFromIBGroupByFlavor(data, ShowArchStore.getActiveArchsForQue(releaseQue)),
            releaseQue: releaseQue,
            archColorScheme: ShowArchStore.getColorsSchemeForQue(releaseQue)
        };

    }

    componentWillMount() {
        ShowArchStore.on("change", this.getArchSettings);
    }

    componentWillUnmount() {
        ShowArchStore.removeListener("change", this.getArchSettings);
    }

    getArchSettings() {
        const {ibComparison, releaseQue} = this.state;
        this.setState({
            archsByIb: getAllActiveArchitecturesFromIBGroupByFlavor(ibComparison, ShowArchStore.getActiveArchsForQue(releaseQue)),
            archColorScheme: ShowArchStore.getColorsSchemeForQue(releaseQue)
        })
    }

    renderRowCells({resultType, ifWarning, ifError, ifFailed, ifPassed, ifUnknown}) {
        /**
         * General purpose function, it will re-render row according to given config
         * */
        const {archsByIb, ibComparison} = this.state;
        return ibComparison.map((ib, pos) => {
            const el = archsByIb[pos];
            // generate cell for each arch
            return el.archs.map(arch => {
                const results = _.findWhere(ib[resultType], {"arch": arch});
                if (!results) {
                    // if not found,
                    return renderCell();
                }
                let defaultTooltipContent, defaultCellInfo = undefined;
                if (_.isEmpty(results)) {
                    defaultTooltipContent = <p>Results are unknown</p>;
                    defaultCellInfo = renderLabel({
                        colorType: 'default',
                        glyphicon: 'glyphicon-question-sign',
                        defaultTooltipContent
                    });
                    return renderCell(defaultCellInfo);
                }
                switch (results.passed) {
                    case true:
                    case "passed":
                        defaultTooltipContent = <p>All good!</p>;
                        defaultCellInfo = renderLabel(
                            {
                                colorType: 'success',
                                glyphicon: 'glyphicon-ok-circle',
                                tooltipContent: defaultTooltipContent
                            }
                        );
                        return ifPassed ? ifPassed(results, ib.release_name) : renderCell(defaultCellInfo);
                    case false:
                    case "error":
                        return ifError ? ifError(results, ib.release_name) : renderCell();
                    case "failed":
                        return ifFailed ? ifFailed(results, ib.release_name) : renderCell();
                    case "warning":
                        return ifWarning ? ifWarning(results, ib.release_name) : renderCell();
                    case "unknown":
                        defaultTooltipContent = <p>Results are unknown</p>;
                        defaultCellInfo = renderLabel(
                            {glyphicon: 'glyphicon-question-sign', tooltipContent: defaultTooltipContent}
                        );
                        return ifUnknown ? ifUnknown(arch, ib) : renderCell(defaultCellInfo);
                    default:
                        console.error("There is new value: " + results.passed);
                        return renderCell();
                }
            })
        })
    }

    renderRowCellsWithDefaultPreConfig({resultType, getUrl, showLabelConfig, urlParameter=''}) {
        const showGeneralResults = this.showGeneralResults(showLabelConfig, getUrl, urlParameter);
        const config = {
            resultType: resultType,
            ifPassed: function (details, ibName) {
                let tooltipContent = <p><strong>All good!</strong> Click for more info.</p>;
                let cellInfo = renderLabel(
                    {
                        colorType: 'success',
                        glyphicon: 'glyphicon-ok-circle',
                        tooltipContent,
                        link: getUrl({"file": details.file, "arch": details.arch, "ibName": ibName, "urlParameter": urlParameter})
                    }
                );
                return renderCell(cellInfo);
            },
            ifError: showGeneralResults,
            ifFailed: showGeneralResults,
            ifWarning: showGeneralResults
        };
        return this.renderRowCells(config);
    }

    renderRowCellsDuplicateDictonaryConfig({resultType, getUrl, showLabelConfig, urlParameter=''}) {
        const showGeneralResults = this.showGeneralResults(showLabelConfig, getUrl, urlParameter);
        const config = {
            resultType: resultType,
            ifPassed: function (details, ibName) {
                let tooltipContent = <p><strong>All good!</strong> Click for more info.</p>;
                let cellInfo = renderLabel(
                    {
                        colorType: 'success',
                        glyphicon: 'glyphicon-search',
                        tooltipContent,
                        link: getUrl(details.arch, ibName)
                    }
                );
                return renderCell(cellInfo);
            },
            ifError: function (details, ibName) {
                let tooltipContent = <p><strong>Duplicate dictionary found!</strong> Click for more info.</p>;
                let cellInfo = renderLabel(
                    {
                        colorType: 'danger',
                        glyphicon: 'glyphicon-search',
                        tooltipContent,
                        link: getUrl(details.arch, ibName)
                    }
                );
                return renderCell(cellInfo);
            },
            ifFailed: showGeneralResults,
            ifWarning: showGeneralResults
        };
        return this.renderRowCells(config);
    }

    renderRelVals({resultType, getUrl, showLabelConfig}) {
        const showRelValsResults = this.showRelValsResults(showLabelConfig, getUrl);
        const config = {
            resultType: resultType,
            ifPassed: showRelValsResults,
            ifError: showRelValsResults,
            ifFailed: showRelValsResults,
            ifWarning: showRelValsResults
        };
        return this.renderRowCells(config);
    }

    showRelValsResults(showLabelConfig, getUrl) {
        return function (result, ib) {
            const {details, done} = result;
            const resultKeys = Object.keys(details); //get all object properties name

            let labelConfig = checkLabelType(showLabelConfig, details);
            if (done === false) {
                labelConfig.value = '' + labelConfig.value + '*';
            }
            const tooltipContent = resultKeys.map(key => {
                return <p key={uuid.v4()} >{key}: {details[key]}</p>
            });

            let selectedStatus;
            switch (labelConfig.colorType){
                case "danger":
                    selectedStatus = "&selectedStatus=failed";
                    break;
                case "warning":
                    selectedStatus = "&selectedFlavors=X&selectedStatus=failed&selectedStatus=known_failed";
                    break;
                case "success":
                    selectedStatus = "&selectedFlavors=X&selectedStatus=failed&selectedStatus=known_failed&selectedStatus=passed";
                    break;
                default:
                    console.error("wrong 'labelConfig.colorType' value in switch statement:" + labelConfig.colorType)
            }

            return renderCell(renderLabel(
                {
                    colorType: labelConfig.colorType, value: labelConfig.value, tooltipContent,
                    link: getUrl({"file": result.file, "arch": result.arch, "ibName": ib, "selectedStatus": selectedStatus })
                })
            );

        };
    }

    showGeneralResults(showLabelConfig, getUrl, urlParameter) {
        return function (result, ib) {
            const {details, done} = result;
            if  (! details ) {
                console.error("empty 'details'object");
                return renderCell()
            }
            const resultKeys = Object.keys(details); //get all object properties name
            let labelConfig = {value: 0};

            for (let i = 0; i < showLabelConfig.length; i++) {
                let el = showLabelConfig[i];
                el.groupFields.forEach((predicate) => {
                    if (typeof predicate === "function") {
                        resultKeys.forEach(key => {
                            if (predicate(key)) {
                                labelConfig.value += details[key] * 1;
                            }
                        });
                    } else {
                        if (valueInTheList(resultKeys, predicate)) {
                            labelConfig.value += details[predicate] * 1;
                        }
                    }
                });
                if (labelConfig.value > 0) {
                    labelConfig.colorType = el.color;
                    break;
                }
            }
            if (done === false) {
                labelConfig.value = '' + labelConfig.value + '*';
            }
            const tooltipContent = resultKeys.map(key => {
                return <p key={uuid.v4()} >{key}: {details[key]}</p>
            });
            return renderCell(renderLabel(
                {
                    colorType: labelConfig.colorType, value: labelConfig.value, tooltipContent,
                    link: getUrl({"file": result.file, "arch": result.arch, "ibName": ib, "urlParameter": urlParameter })
                })
            );

        };
    }

    renderOtherTestResults({resultType, getUrl, showLabelConfig}) {
        const showGeneralResults = this.showGeneralResults(showLabelConfig, getUrl);
        const config = {
            resultType: resultType,
            ifPassed: function (details, ib) {
                let tooltipContent = <p><strong>All good!</strong> Click for more info.</p>;
                let cellInfo = renderLabel(
                    {
                        colorType: 'success',
                        glyphicon: 'glyphicon-ok-circle',
                        tooltipContent,
                        link: getUrl({"file": details.file, "arch": details.arch, "ibName": ib})
                    }
                );
                return renderCell(cellInfo);
            },
            ifError: function (details, ib) {
                let tooltipContent = <p><strong>There are errors!</strong> Click for more info.</p>;
                let cellInfo = renderLabel(
                    {
                        colorType: 'danger',
                        glyphicon: 'glyphicon-remove-sign',
                        tooltipContent,
                        link: getUrl({"file": details.file, "arch": details.arch, "ibName": ib})
                    }
                );
                return renderCell(cellInfo);
            },
            ifFailed: showGeneralResults,
            ifWarning: showGeneralResults
        };
        return this.renderRowCells(config);
    }

    shouldShowRow(resultType){
        /**
         checks if there is at least 1 field to show
         ibField - the row
         */
        const {archsByIb, ibComparison} = this.state;
        let result  =  ibComparison.map((ib, pos) => {
            const el = archsByIb[pos];
            // generate cell for each arch
            return el.archs.map(arch => {
                const results = _.findWhere(ib[resultType], {"arch": arch});
                if (!results) {
                    // if not found,
                    return 0
                }
                return 1;
            }).reduce((total, int ) => total + int, 0);
        }).reduce((total, int ) => total + int, 0);
        return result  // 0 - false, 1 and more - true
    }

    render() {
        const {archsByIb} = this.state;
        console.log(archsByIb);
        return (
            <div className="table-responsive">
                <Table striped={true} bordered={true} condensed={true} hover>
                    <thead>
                    <tr>
                        <th className={'name-column'} rowSpan={2}/>
                        {/* IB flavors row*/}
                        {archsByIb.map(item => {
                            if (item.archs.length > 0) {
                                return <th key={uuid.v4()}
                                           colSpan={item.archs.length}>{getDisplayName(item.flavor)}</th>
                            }
                            return null;
                        })}
                    </tr>
                    <tr>
                        {/* Arch names row */}
                        {archsByIb.map(item => {
                            return item.archs.map(arch => {
                                const linkWrapper = (link, result) => {
                                    return (
                                        <a href={link} style={{color: 'blue', textDecoration: 'underline'}}>
                                            {result}
                                        </a>
                                    )
                                };
                                const cellContent = () => {
                                    return (
                                        arch.split("_").map(str => {
                                            const color = this.state.archColorScheme;
                                            return (
                                                <div style={{backgroundColor: color[str], paddingLeft: 6.3}}
                                                     key={uuid.v4()}>
                                                    <span style={{color: "white"}}>{" " + str}</span>
                                                </div>
                                            )
                                        })
                                    )
                                };
                                const checkIfItIsAPatch = (current_tag, architecture, tagName) => {
                                    const intendedTagName1 = 'IB/'.concat(current_tag, '/', architecture);
                                    const intendedTagName2 = 'ERR/'.concat(current_tag, '/', architecture);
                                    return ( tagName !== intendedTagName1 && tagName !== intendedTagName2 );
                                };
                                let link, tooltipText;
                                let patchOrFullBuild = '---';
                                let {cmsdistTags, current_tag} = item;
                                let cmsdistTag = cmsdistTags[arch];
                                if (cmsdistTag === "Not Found") {
                                } else if (!cmsdistTag) {
                                } else {
                                    link = urls.commits + cmsdistTag;
                                    if (checkIfItIsAPatch(current_tag, arch, cmsdistTag)) {
                                        tooltipText = 'Used same cmsdist tag as ' + cmsdistTag.replace('IB/', '').replace('/' + arch, '');
                                        patchOrFullBuild = 'Patch';
                                    } else {
                                        tooltipText = 'See cmsdist tag used for this build';
                                        patchOrFullBuild = 'Full Build';
                                    }
                                }
                                return (
                                    <th key={uuid.v4()}>
                                        {(link) ? renderTooltip(linkWrapper(link, cellContent()), tooltipText) : cellContent()}
                                        <Label bsStyle="default"> {patchOrFullBuild}</Label>
                                    </th>
                                );
                            })
                        })}
                    </tr>
                    </thead>
                    <tbody>
                    {  this.shouldShowRow("builds") ?
                        <tr>
                        <td className={'name-column'}>
                            <b>Builds</b>
                        </td>
                        {this.renderRowCellsWithDefaultPreConfig({
                                resultType: 'builds',
                                getUrl: getBuildOrUnitUrl,
                                // first group will be showed as label,
                                // if not found, then second group will be shown
                                showLabelConfig: [
                                    {
                                        groupFields: [(key) => key.includes("Error")],
                                        color: "danger"
                                    },
                                    {
                                        groupFields: ["compWarning"],
                                        color: "warning"
                                    }
                                ]
                            }
                        )}
                        </tr>
                    : null}
                    {  this.shouldShowRow("utests") ?
                        <tr>
                            <td className={'name-column'}><b>Unit Tests</b></td>
                            {this.renderRowCellsWithDefaultPreConfig({
                                    resultType: 'utests',
                                    getUrl: getBuildOrUnitUrl,
                                    showLabelConfig: [{
                                        groupFields: ["num_fails"],
                                        color: "danger"
                                    }],
                                    urlParameter: '?utests'
                                }
                            )}
                        </tr>
                    : null}
                    { this.shouldShowRow("relvals") ?
                        <tr>
                            <td className={'name-column'}>
                                    <a href={urls.newRelVals(this.state.que, this.state.date)}> <b>RelVals </b> </a>
                            </td>
                            {this.renderRelVals({
                                    resultType: 'relvals',
                                    getUrl: getRelValUrl,
                                    showLabelConfig: showLabelConfig.relvals
                                }
                            )}
                        </tr>
                    : null}
                    { this.shouldShowRow("addons") ?
                        <tr>
                            <td className={'name-column'}><b>Other Tests</b></td>
                            {this.renderOtherTestResults({
                                    resultType: 'addons',
                                    getUrl: getOtherTestUrl,
                                    showLabelConfig: showLabelConfig.addons
                                }
                            )}
                        </tr>
                    : null}
                    { this.shouldShowRow("dupDict") ?
                        <tr>
                            <td className={'name-column'}><b>Q/A</b></td>
                            {this.renderRowCellsDuplicateDictonaryConfig({
                                    resultType: 'dupDict',
                                    getUrl: urls.q_a
                                }
                            )}
                        </tr>
                        : null}
                    </tbody>
                </Table>
            </div>
        )
    }

}

export default ComparisonTable;
