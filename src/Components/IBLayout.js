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


const IBGroupsWithArch = (props) => {
    const { getActiveArchsForQue } = useShowArch();
    const activeArchs = getActiveArchsForQue(props.releaseQue);
    
    console.log('🔵 IBGroupsWithArch - releaseQue:', props.releaseQue);
    console.log('🔵 IBGroupsWithArch - activeArchs:', activeArchs);
    console.log('🔵 IBGroupsWithArch - data length:', props.data?.length);
    
    return <IBGroups {...props} activeArchs={activeArchs} />;
};

class IBLayout extends Component {
    constructor(props) {
        super(props);
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
        window.addEventListener('resize', this.getNavigationHeight.bind(this));
        this.getNavigationHeight();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.params?.prefix !== this.props.params?.prefix) {
            this.updateState(this.props);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.getNavigationHeight.bind(this));
    }

    updateState(props) {
        const releaseQue = props.params?.prefix || "";
        const structure = props.structure || {};
        const IbFlavorList = _.find(structure, (val, key) => key === releaseQue) || [];
        this.setState({ nameList: IbFlavorList, releaseQue });
        this.getData(IbFlavorList);
    }

    getData(ibList) {
        if (!ibList || ibList.length === 0) return;
        
        getMultipleFiles({
            fileUrlList: ibList.map(name => urls.dataDir + name + '.json'),
            onSuccessCallback: (responsesList) => {
                const data = responsesList.filter(r => r && r.data).map(r => r.data);
                this.setState({ dataList: data });
            }
        });
    }

    updateNameListToShow = (newNameList) => {
        this.setState({ nameListToShow: newNameList });
    }

    filterListToShow() {
        const { nameListToShow, dataList } = this.state;
        if (!nameListToShow || nameListToShow.length === 0) return dataList;
        return _.filter(dataList, item => _.contains(nameListToShow, item.release_name));
    }

    getNavigationHeight = () => {
        const navigationHeight = document.getElementById('navigation')?.clientHeight || 50;
        this.setState({ navigationHeight });
    }

    getTopPadding() {
        return this.state.navigationHeight + 20;
    }

    render() {
        const { releaseQue, toLinks, nameList, all_release_queues } = this.state;
        const filteredData = this.filterListToShow();
        
        console.log('🟢 IBLayout - releaseQue:', releaseQue);
        console.log('🟢 IBLayout - filteredData length:', filteredData.length);
        
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
                {/* Use the wrapper component instead of IBGroups directly */}
                <IBGroupsWithArch 
                    data={filteredData} 
                    releaseQue={releaseQue} 
                />
            </div>
        );
    }
}

export default IBLayout;