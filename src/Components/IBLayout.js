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

/** Keep IB JSON fresh for 15 minutes */
const IB_MEMORY_TTL_MS = 15 * 60 * 1000;
const ibDataCache = {};

function isFreshCache(entry, ttlMs) {
    if (!entry || !entry.cachedAt) return false;
    return Date.now() - entry.cachedAt < ttlMs;
}

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
        this._isMounted = false;

        this.state = {
            nameList: [],
            nameListToShow: [],
            dataList: [],
            all_release_queues: props.structure?.all_release_queues || [],
            toLinks: props.toLinks || [],
            navigationHeight: 50,
            releaseQue: props.params?.prefix || "",
            showUnauthorizedMessage: false,
            unauthorizedMessage: ""
        };
    }

    componentDidMount() {
        this._isMounted = true;
        this.updateState(this.props);
        window.addEventListener('resize', this.boundGetNavigationHeight);
        window.addEventListener('app:unauthorized', this.handleUnauthorized);
        this.getNavigationHeight();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.params?.prefix !== this.props.params?.prefix) {
            this.updateState(this.props);
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('resize', this.boundGetNavigationHeight);
        window.removeEventListener('app:unauthorized', this.handleUnauthorized);
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
    handleUnauthorized = (event) => {
        this.setState({
            showUnauthorizedMessage: true,
            unauthorizedMessage:
                event?.detail?.message ||
                "Your session has expired. Please refresh the page and sign in again."
        });
    };
    closeUnauthorizedMessage = () => {
        this.setState({
            showUnauthorizedMessage: false,
            unauthorizedMessage: ""
        });
    };
    getData(ibList) {
        if (!ibList || ibList.length === 0) {
            if (this.state.dataList.length > 0) {
                this.setState({ dataList: [] });
            }
            return;
        }

        const listSignature = JSON.stringify(ibList);
        if (this.lastRequestedIbListSignature === listSignature) {
            // Even if the list is the same, we still want to rebuild from cache
            // because some entries may have expired and been refreshed.
            // So do not return early here.
        }
        this.lastRequestedIbListSignature = listSignature;

        const cachedData = [];
        const missingNames = [];

        ibList.forEach((name) => {
            if (isFreshCache(ibDataCache[name], IB_MEMORY_TTL_MS)) {
                cachedData.push(ibDataCache[name].data);
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
                        ibDataCache[name] = {
                            data: response.data,
                            cachedAt: Date.now()
                        };
                    }
                });

                const mergedData = ibList
                    .map((name) => ibDataCache[name]?.data)
                    .filter((item) => item);

                if (!this._isMounted) return;

                this.setState((prevState) => {
                    const sameLength = prevState.dataList.length === mergedData.length;
                    const sameRefOrder =
                        sameLength &&
                        prevState.dataList.every((item, index) => item === mergedData[index]);

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
        return this.state.navigationHeight + 4;
    }

    render() {
        const { releaseQue, toLinks, nameList, all_release_queues, showUnauthorizedMessage, unauthorizedMessage } = this.state;
        const filteredData = this.filterListToShow();

        return (
            <div className="container-fluid px-0" >
                    {showUnauthorizedMessage && (
                    <div
                        style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 3000,
                        background: "rgba(0,0,0,0.45)", // dark overlay
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                        }}
                    >
                        <div
                        style={{
                            background: "#ffffff",
                            color: "#111827",
                            padding: "24px 28px",
                            borderRadius: "14px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                            maxWidth: "420px",
                            width: "90%",
                            textAlign: "center"
                        }}
                        >
                        <h5 style={{ marginBottom: "12px", color: "#dc3545" }}>
                            Session Expired
                        </h5>

                        <div style={{ marginBottom: "18px", fontSize: "0.95rem" }}>
                            {unauthorizedMessage}
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#2563eb",
                                color: "#ffffff",
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                            >
                            Refresh Page
                            </button>

                            <button
                            onClick={() => this.setState({ showUnauthorizedMessage: false })}
                            style={{
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                background: "#f9fafb",
                                cursor: "pointer"
                            }}
                            >
                            Close
                            </button>
                        </div>
                        </div>
                    </div>
                    )}
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