import React, {Component} from 'react';
import RelValNavigation from "./RelValComponents/RelValNavigation";
import RelValStore from "../Stores/RelValStore";
import ExitCodeStore from "../Stores/ExitCodeStore";
import queryString from 'query-string';
import TogglesShowRow from "./TogglesShowRow";
import {goToLinkWithoutHistoryUpdate, partiallyUpdateLocationQuery} from "../Utils/commons";
import 'react-table/react-table.css';
import ResultTableWithSteps from "./RelValComponents/ResultTableWithSteps";
import {filterRelValStructure} from "../Utils/processing";
import {STATUS_ENUM, STATUS_ENUM_LIST} from "../relValConfig";

const NAV_CONTROLS_ENUM = {
    SELECTED_ARCHS: "selectedArchs",
    SELECTED_FLAVORS: "selectedFlavors",
    SELECTED_STATUS: "selectedStatus",
    SELECTED_GPUS: "selectedGPUs",
    SELECTED_OTHERS: "selectedOthers",
    SELECTED_FILTER_STATUS: "selectedFilterStatus"
};

// Smart component tracking data change and laying basic layout
class RelValLayout extends Component {
    constructor(props) {
        super(props);
        this.doUpdateData = this.doUpdateData.bind(this);
        this.state = {
            navigationHeight: 62,
        };
    }

    componentWillMount() {
        RelValStore.on("change", this.doUpdateData);
        ExitCodeStore.on("change", this.forceUpdate);
    }

    doUpdateData() {
        const {date, que} = this.props.match.params;
        const allArchs = RelValStore.getAllArchsForQue({date, que});
        const allGPUs = RelValStore.getAllGPUsForQue({date, que});
        const allOthers = RelValStore.getAllOthersForQue({date, que});
        const allFlavors = RelValStore.getAllFlavorsForQue({date, que});
        const structure = RelValStore.getFlavorStructure({date, que});
        this.setState({structure, allArchs, allGPUs, allOthers, allFlavors, date, que});

        const {location, history} = this.props;
        if (location.search === "") {
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_ARCHS, allArchs);
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_GPUS, allGPUs);
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_OTHERS, allOthers);
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_FLAVORS, allFlavors);
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_STATUS, [STATUS_ENUM.FAILED]);
            goToLinkWithoutHistoryUpdate(history, location);
        }

    }

    componentWillReceiveProps(newProps) {
        const {date, que} = newProps.match.params;
        const oldDate = this.props.match.params.date;
        const oldQue = this.props.match.params.que;
        if (date !== oldDate || que !== oldQue) {
            const allArchs = RelValStore.getAllArchsForQue({date, que});
            const allGPUs = RelValStore.getAllGPUsForQue({date, que});
            const allOthers = RelValStore.getAllOthersForQue({date, que});
            const allFlavors = RelValStore.getAllFlavorsForQue({date, que});
            const structure = RelValStore.getFlavorStructure({date, que});
            this.setState({structure, allArchs, allGPUs, allOthers, allFlavors, date, que});

            const {location, history} = newProps;
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_ARCHS, allArchs);
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_GPUS, allGPUs);
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_OTHERS, allOthers);
            partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_FLAVORS, allFlavors);
            goToLinkWithoutHistoryUpdate(history, location);
        }
    }

    getNavigationHeight() {
        const navigationHeight = document.getElementById('navigation').clientHeight;
        this.setState({navigationHeight});
    }

    componentDidMount() {
        window.addEventListener('resize', this.getNavigationHeight.bind(this));
        this.doUpdateData();
        this.getNavigationHeight();
    }

    componentWillUnmount() {
        RelValStore.removeListener("change", this.doUpdateData);
        ExitCodeStore.removeListener("change", this.forceUpdate);
        window.removeEventListener('resize', this.getNavigationHeight.bind(this));
    }

    getTopPadding() {
        return this.state.navigationHeight + 20;
    }

    getSizeForTable() {
        return document.documentElement.clientHeight - this.getTopPadding() - 20
    }

    render() {
        const {allArchs = [], allGPUs = [], allOthers = [], allFlavors = []} = this.state;
        let {selectedArchs, selectedGPUs, selectedOthers, selectedFlavors, selectedStatus, selectedFilterStatus} = queryString.parse(this.props.location.search);
        const {structure = {}} = this.state;
        const {date, que} = this.props.match.params;
        const {location, history} = this.props;
        if (!selectedGPUs){selectedGPUs="";}
        if (!selectedOthers){selectedOthers="";}
        if (typeof selectedGPUs !== 'string') {
            selectedGPUs = selectedGPUs.filter(item => item !== "");
            if (selectedGPUs.length === 0){selectedGPUs = "";}
            else if (selectedGPUs.length === 1){selectedGPUs = selectedGPUs[0];}
        }
        if (typeof selectedOthers !== 'string') {
          selectedOthers = selectedOthers.filter(item => item !== "");
          if (selectedOthers.length === 0){selectedOthers = "";}
          else if (selectedOthers.length === 1){selectedOthers = selectedOthers[0];}
        }
        const controlList = [
            <TogglesShowRow
                rowName={'Flavors'}
                nameList={allFlavors}
                initSelections={selectedFlavors}
                callbackToParent={(v) => {
                    partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_FLAVORS, v);
                    goToLinkWithoutHistoryUpdate(history, location);
                }}/>,
            <TogglesShowRow
                rowName={'Architectures'}
                nameList={allArchs}
                initSelections={selectedArchs}
                callbackToParent={(v) => {
                    partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_ARCHS, v);
                    goToLinkWithoutHistoryUpdate(history, location);
                }}/>,
          <TogglesShowRow
                rowName={'GPUs'}
                nameList={allGPUs}
                initSelections={selectedGPUs}
                callbackToParent={(v) => {
                    partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_GPUS, v);
                    goToLinkWithoutHistoryUpdate(history, location);
                }}/>,
            <TogglesShowRow
                rowName={'Others'}
                nameList={allOthers}
                initSelections={selectedOthers}
                callbackToParent={(v) => {
                    partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_OTHERS, v);
                    goToLinkWithoutHistoryUpdate(history, location);
                }}/>,
            [
                <TogglesShowRow
                    rowName={'Status'}
                    nameList={STATUS_ENUM_LIST}
                    initSelections={selectedStatus}
                    callbackToParent={(v) => {
                        partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_STATUS, v);
                        goToLinkWithoutHistoryUpdate(history, location);
                    }}/>,
                <TogglesShowRow
                    rowName={' Column filter'}
                    nameList={['On']}
                    initSelections={selectedFilterStatus}
                    callbackToParent={(v) => {
                        
                        partiallyUpdateLocationQuery(location, NAV_CONTROLS_ENUM.SELECTED_FILTER_STATUS, v);
                        goToLinkWithoutHistoryUpdate(history, location);
                    }}/>
            ]
        ];

        const resultTableWithStepsSettings = {
            style: {height: this.getSizeForTable()},
            allArchs,
            allGPUs,
            allOthers,
            allFlavors,
            selectedArchs,
            selectedGPUs,
            selectedOthers,
            selectedFlavors,
            selectedStatus,
            structure,
            selectedFilterStatus,
            ibDate: date,
            ibQue: que,
            filteredRelVals: filterRelValStructure({structure, selectedArchs, selectedGPUs, selectedOthers, selectedFlavors, selectedStatus})
        };

        return (
            
            <div className={'container'} style={{paddingTop: this.getTopPadding()}}>
                <RelValNavigation que={que} relvalInfo={que + " " + date} controlList={controlList} history={history}/>
                <ResultTableWithSteps
                    {...resultTableWithStepsSettings}
                />
            </div>
        );
    }
}

export default RelValLayout;
