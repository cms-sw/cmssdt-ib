import React, {Component} from 'react';
import { config, STATUS_ENUM } from '../../config';
import uuid from 'uuid';
import MenuItem from "react-bootstrap/es/MenuItem";
import {Dropdown, Glyphicon} from "react-bootstrap";
import {getCurrentIbTag, getDisplayName} from "../../Utils/processing";
import {GpuRelvalsLabel, GpuQALabel} from './GpuTestLabel';

const {statusLabelsConfigs} = config;

class StatusLabels extends Component {

    constructor(props) {
        super(props);
        this.state = {
            IBGroup: props.IBGroup,
            ib: props.IBGroup[0],
            ibGroupType: props.ibGroupType,
            showOnlyIbTag: props.showOnlyIbTag
        }
    }

    static formatLabel({glyphicon, name, url, labelColor}) {
        if (url) {
            return (
                <a href={url} key={uuid.v4()} style={{background:labelColor}}>
                    <span key={uuid.v4()} className={`glyphicon ${glyphicon}`}/>
                    <span key={uuid.v4()} > {name} </span>
                </a>
            )
        } else {
            return [
                <span key={uuid.v4()} className={`glyphicon ${glyphicon}`}/>,
                <span key={uuid.v4()} style={{background:labelColor}}> {name} </span>
            ]
        }
    };

    static defaultFound(config, ib, result) {
        return {
            name: config.name,
            glyphicon: config.glyphicon ? config.glyphicon : "glyphicon-list-alt",
            url: config.getUrl ? config.getUrl(ib, result) : undefined
        }
    };

    static defaultInProgress(config) {
        return {
            glyphicon: "glyphicon-refresh",
            name: config.name
        }
    };

    static renderLabel(config, ib) {
        /**
         * reads each element in config.statusLabelsConfigs array
         * applies config and renders it
         */
        let status;
        const {key} = config;
        const result = ib[key];
        if (result !== null && Array.isArray(result)){
            status = result  // give all array to check
        } else if (result !== null && typeof result === 'object') {
            status = result.status;  // just get status of the object element
        }  else {
            status = result; // the value is a string
        }
        // if result variable does not follow standard and needs custom interpretation
        if (config.customResultInterpretation) {
            status = config.customResultInterpretation(status);
        }
        let outputConfig;
        if (status === STATUS_ENUM.found || status === STATUS_ENUM.passed) {
            // if the result has information to create more label, do the following logic
            if (result.iterable) {
                let count = 1;
                let configSeperatedByIterable = result.iterable.map(item => {
                    let newConfig = Object.assign({}, config);
                    newConfig.iterateItem = item;
                    newConfig.name = config.name + " " + count;
                    count += 1;
                    return newConfig;
                });
                return configSeperatedByIterable.map((config) => {
                    let outputConfig = config.ifFound ? config.ifFound(ib, result) : StatusLabels.defaultFound(config, ib, result);
                    return StatusLabels.formatLabel(outputConfig);
                })
            } else {
                // create default labels
                outputConfig = config.ifFound ? config.ifFound(ib, result) : StatusLabels.defaultFound(config, ib, result);
            }
        } else if (status === STATUS_ENUM.not_found) {
            // by default, do not show the label
            outputConfig = config.ifNotFound ? config.ifNotFound(ib, result) : undefined;
        } else if (status === STATUS_ENUM.inprogress || status === STATUS_ENUM.inProgress) {
            outputConfig = config.ifInProgress ? config.ifInProgress(ib, result) : StatusLabels.defaultInProgress(config);
        } else if (status === STATUS_ENUM.error) {
            outputConfig = config.ifError ? config.ifError(ib, result) : StatusLabels.defaultInProgress(config);
        }
        else if (status === STATUS_ENUM.warning) {
            outputConfig = config.ifWarning ? config.ifWarning(ib, result) : StatusLabels.defaultInProgress(config);
        }
        else if (status === STATUS_ENUM.success) {
            outputConfig = config.ifSuccess ? config.ifSuccess(ib, result) : StatusLabels.defaultInProgress(config);
        }
        // only if the config object exist, create label
        if (outputConfig) {
            return StatusLabels.formatLabel(outputConfig);
        }
    }

    static renderIBTag(IBGroup, ibGroupType) {
        /**
         * non-standard function to show IB tag
         */
        let config = {};
        switch (ibGroupType) {
            case 'IB':
                config = {
                    name: "IB Tag",
                    glyphicon: "tag",
                    url: 'https://github.com/cms-sw/cmssw/tree/'
                };
                break;
            case 'nextIB':
                config = {
                    name: "See Branch",
                    glyphicon: "list",
                    url: 'https://github.com/cms-sw/cmssw/commits/'
                };
                break;
            case 'fullBuild':
                config = {
                    name: "Release",
                    glyphicon: "tag",
                    url: 'https://github.com/cms-sw/cmssw/releases/tag/'
                };
                break;
            default:
                console.error("wrong case: " + ibGroupType) ;
        }

        if (IBGroup.length > 1) {
            return ([
                <Dropdown key={uuid.v4()} id="dropdown-custom-1" bsSize="small">
                    <Dropdown.Toggle>
                        <Glyphicon glyph={config.glyphicon}/>
                        {" " + config.name}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="super-colors">
                        {IBGroup.map((ib) => {
                            return <MenuItem  key={uuid.v4()}
                                href={config.url + getCurrentIbTag(ib)}>{getDisplayName(ib.release_queue)}</MenuItem>
                        })}
                    </Dropdown.Menu>
                </Dropdown>,
                <span key={uuid.v4()}>   </span>
            ])
        } else {
            config['glyphicon'] = "glyphicon-" + config['glyphicon'];
            config['url'] = config['url'] + getCurrentIbTag(IBGroup[0]);
            return StatusLabels.formatLabel(config);
        }
    }

    render() {
        const {IBGroup, showOnlyIbTag, ibGroupType, ib} = this.state;
        if (showOnlyIbTag) {
            return <p>{StatusLabels.renderIBTag(IBGroup, ibGroupType)}</p>
        } else {
	    let menu_data = [StatusLabels.renderIBTag(IBGroup, ibGroupType)]
	    if (ib && ib.gpu_data){
                if (ib.gpu_data && ib.gpu_data.relvals){
		    menu_data.push(<GpuRelvalsLabel key="gpu-relvals" gpuTests={ib.gpu_data.relvals} />);
		}
		if (ib.gpu_data && ib.gpu_data.qa){
		    menu_data.push(<GpuQALabel key="gpu-qa" gpuTests={ib.gpu_data.qa} />);
		}
	    }
	    menu_data.push(statusLabelsConfigs.map(conf => StatusLabels.renderLabel(conf, ib)));
	    return (<p>{menu_data}</p>)
        }
    }
}

export default StatusLabels;
