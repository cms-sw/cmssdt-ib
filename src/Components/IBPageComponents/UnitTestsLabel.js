import React from 'react';
import uuid from 'uuid';
import {Dropdown, MenuItem} from "react-bootstrap";
import { config } from '../../config';
const {urls} = config;

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
}

const UnitTestsLabel = ({ tests, type_name}) => {
    if (!tests || Object.keys(tests).length === 0) return null;
    const anyFailure = Object.values(tests).some(t => t.details && Number(t.details.num_fails) > 0);
    let selected = "";
    let title = "";
    if (type_name === "gpu") {
        selected="gpu";
        title = "GPU";
    } else if (type_name === "rntuple") {
        selected = "other";
        title = "RNTuple";
    }
    return ([
        <Dropdown key={uuid.v4()} id="dropdown-gputest-1" bsSize="small">
            <Dropdown.Toggle bsStyle={anyFailure ? 'danger' : 'default'} id={`${type_name}-unit-test-toggle`}>
            <span className="glyphicon" style={{ marginRight: '5px' }}></span>
            <span style={{ color: anyFailure ? '#fff' : '#000' }}>{title} Test</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="super-colors">
        {
            Object.entries(tests).map(([key, item], idx) => {
                const failed = (item.details && Number(item.details.num_fails)) || 0;
                let selected_item = "";
                if (type_name === "gpu") {
                    selected_item = item.gpu;
                } else if (type_name === "rntuple") {
                    selected_item = item.other;
                }
                const url = getBuildOrUnitUrl({"file": item.file, "arch": item.arch, "ibName": item.release_name, "urlParameter": "?utests/"+selected+"/"+selected_item});
                return (
                    <MenuItem key={uuid.v4()} href={url}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><b>{key}</b></div>
		                        <div style={{ marginLeft: '5px' }}>
                            {
                                failed === 0 ? (
                                    <span className="label label-success"><span className="glyphicon glyphicon-ok-circle"></span></span>
                                ) : (
                                    <span className="label label-danger">{failed}</span>
                                )
                            }
		                        </div>
                        </div>
                    </MenuItem>
                );
            })
        }
        </Dropdown.Menu>
        </Dropdown>,
        <span key={uuid.v4()}>   </span>
    ]);
}

export {UnitTestsLabel};
