import React, { Component } from 'react';
import _ from 'underscore';
import ToggleButtonGroupControlled from "./TogglesShowIBFlawors";
import IBGroups from './IBPageComponents/IBGroups';
import { config } from '../config';
import Navigation from "./Navigation";
import TogglesShowArchs from "./TogglesShowArchs";
import { getMultipleFiles } from "../Utils/ajax";
import { useShowArch } from "../context/ShowArchContext";

const { urls } = config;

// Global cache for already loaded IB json files
const ibDataCache = {};

const IBGroupsWithArch = React.memo((props) => {
    const { getActiveArchsForQue } = useShowArch();
    const activeArchs = getActiveArchsForQue(props.releaseQue);

    return <IBGroups {...props} activeArchs={activeArchs} />;
});

class IBLayout extends Component {
    constructor(props) {
        super(props);

        this.boundGetNavigationHeight = this.getNavigationHeight.bind(this);
        this.lastRequestedIbListSignature = "";

        this.state = {
            nameList: [],
            nameListToShow: [],
            dataList: [],
            all_release_queues: props.structure?.all_release_queues || [],
            toLinks: props.toLinks || [],
            navigationHeight: 50,
            releaseQue: props.params?.prefix || ""
        };
    }

    componentDidMount() {
        this.updateState(this.props);
        window.addEventListener('resize', this.boundGetNavigationHeight);
        this.getNavigationHeight();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.params?.prefix !== this.props.params?.prefix) {
            this.updateState(this.props);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.boundGetNavigationHeight);
    }

    updateState(props) {
        const releaseQue = props.params?.prefix || "";
        const structure = props.structure || {};
        const IbFlavorList = _.find(structure, (val, key) => key === releaseQue) || [];

        this.setState(
            (prevState) => {
                const nextState = {};
                let hasChanges = false;

                if (prevState.releaseQue !== releaseQue) {
                    nextState.releaseQue = releaseQue;
                    hasChanges = true;
                }

                if (prevState.nameList !== IbFlavorList) {
                    nextState.nameList = IbFlavorList;
                    hasChanges = true;
                }

                return hasChanges ? nextState : null;
            },
            () => {
                this.getData(IbFlavorList);
            }
        );
    }

    getData(ibList) {
        if (!ibList || ibList.length === 0) {
            if (this.state.dataList.length > 0) {
                this.setState({ dataList: [] });
            }
            return;
        }

        const listSignature = JSON.stringify(ibList);
        if (this.lastRequestedIbListSignature === listSignature) {
            return;
        }
        this.lastRequestedIbListSignature = listSignature;

        const cachedData = [];
        const missingNames = [];

        ibList.forEach((name) => {
            if (ibDataCache[name]) {
                cachedData.push(ibDataCache[name]);
            } else {
                missingNames.push(name);
            }
        });

        if (missingNames.length === 0) {
            this.setState((prevState) => {
                const sameLength = prevState.dataList.length === cachedData.length;
                const sameRefOrder = sameLength && prevState.dataList.every((item, index) => item === cachedData[index]);

                if (sameRefOrder) return null;
                return { dataList: cachedData };
            });
            return;
        }

        getMultipleFiles({
            fileUrlList: missingNames.map((name) => urls.dataDir + name + '.json'),
            onSuccessCallback: (responsesList) => {
                responsesList.forEach((response, index) => {
                    const name = missingNames[index];
                    if (response && response.data) {
                        ibDataCache[name] = response.data;
                    }
                });

                const mergedData = ibList
                    .map((name) => ibDataCache[name])
                    .filter((item) => item);

                this.setState((prevState) => {
                    const sameLength = prevState.dataList.length === mergedData.length;
                    const sameRefOrder = sameLength && prevState.dataList.every((item, index) => item === mergedData[index]);

                    if (sameRefOrder) return null;
                    return { dataList: mergedData };
                });
            }
        });
    }

    updateNameListToShow = (newNameList) => {
        this.setState((prevState) => {
            const prevSignature = JSON.stringify(prevState.nameListToShow || []);
            const nextSignature = JSON.stringify(newNameList || []);

            if (prevSignature === nextSignature) return null;
            return { nameListToShow: newNameList };
        });
    };

    filterListToShow() {
        const { nameListToShow, dataList } = this.state;
        if (!nameListToShow || nameListToShow.length === 0) return dataList;
        return _.filter(dataList, (item) => _.contains(nameListToShow, item.release_name));
    }

    getNavigationHeight() {
        const navigationHeight = document.getElementById('navigation')?.clientHeight || 50;

        this.setState((prevState) => {
            if (prevState.navigationHeight === navigationHeight) return null;
            return { navigationHeight };
        });
    }

    getTopPadding() {
        return this.state.navigationHeight + 20;
    }

    render() {
        const { releaseQue, toLinks, nameList, all_release_queues } = this.state;
        const filteredData = this.filterListToShow();

        return (
            <div className="container-fluid px-0" style={{ paddingTop: this.getTopPadding() }}>
                <Navigation
                    toLinks={toLinks}
                    flaworControl={
                        <ToggleButtonGroupControlled
                            nameList={nameList}
                            initSelections={all_release_queues}
                            callbackToParent={this.updateNameListToShow}
                        />
                    }
                    archControl={<TogglesShowArchs releaseQue={releaseQue} />}
                />
                <IBGroupsWithArch
                    data={filteredData}
                    releaseQue={releaseQue}
                />
            </div>
        );
    }
}

export default IBLayout;