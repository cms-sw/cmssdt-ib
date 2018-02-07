import React, {Component} from 'react';
import Commits from "./Commits";
import StatusLabels from "./StatusLabels";
import ComparisonTable from "./ComparisonTable";
import {Panel} from "react-bootstrap";
import JSONPretty from 'react-json-pretty';


/**
 * ib_date - field grouped by
 * isIB - true(IB)/ false(next realise, integration build)
 * next_ib - is the record next IB build
 * */

class IBGroupFrame extends Component {
    static propTypes = {
        // TODO fix
        // IBGroup: PropTypes.arrayOf(PropTypes)
    };

    constructor(props) {
        super(props);
        this.state = {
            IBGroup: props.IBGroup
        };
    }

    getIbGroupType() {
        const firstIbFromList = this.state.IBGroup[0];
        const {isIB, next_ib} = firstIbFromList;
        if (isIB === true) {
            return 'IB'
        } else if (isIB === false && next_ib === true) {
            return 'nextIB'
        } else {
            return 'fullBuild'
        }
    }

    render() {
        const firstIbFromList = this.state.IBGroup[0];
        if (!firstIbFromList) {
            return (<div><h1>Error: IB group is empty</h1></div>)
        }

        let statusLabels, comparisonTable, commitPanelProps = null;
        let panelHeader;
        let showOnlyIbTag = false;
        const ibGroupType = this.getIbGroupType();
        switch (ibGroupType) {
            case 'IB':
                showOnlyIbTag = false;
                panelHeader = firstIbFromList.release_name;
                comparisonTable = <ComparisonTable data={this.state.IBGroup}/>;
                commitPanelProps = {
                    defaultExpanded: false,
                    collapsible: true,
                };
                break;
            case 'nextIB':
                showOnlyIbTag = true;
                panelHeader = 'nextIB';
                commitPanelProps = {
                    collapsible: false,
                };
                break;
            case 'fullBuild':
                showOnlyIbTag = true;
                panelHeader = firstIbFromList.release_name;
                commitPanelProps = {
                    collapsible: false,
                };
        }
        statusLabels = <StatusLabels ib={firstIbFromList} ibGroupType={ibGroupType} showOnlyIbTag={showOnlyIbTag}/>;

        return (
            <Panel collapsible
                   defaultExpanded
                   header={panelHeader}>
                <Panel collapsible
                       header={'DEVELOPMENT real data'}>
                    <JSONPretty json={this.state.IBGroup}/>
                </Panel>
                {statusLabels}
                {comparisonTable}
                <Commits commitPanelProps={commitPanelProps} data={this.state.IBGroup}/>
            </Panel>
        )

    }

}

export default IBGroupFrame;
