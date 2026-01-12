import React from 'react';
import uuid from 'uuid';
import {Dropdown, MenuItem} from "react-bootstrap";
import { config } from '../../config';
const {urls} = config;

const RelvalsLabel = ({tests, type_name}) => {
    if (!tests || Object.keys(tests).length === 0) return null;
    const anyFailure = Object.values(tests).some(t => t.details && t.details.num_failed > 0);
    let selected = "";
    let title = "";
    if (type_name === "gpu") {
        selected="GPUs";
        title = "GPU";
    } else if (type_name === "rntuple") {
        selected = "Others";
        title = "RNTuple";
    }
    return ([
        <Dropdown key={uuid.v4()} id={`dropdown-{type_name}-relval-1`} bsSize="small">
        <Dropdown.Toggle bsStyle={anyFailure ? 'danger' : 'default'} id={`${type_name}-relvals-toggle`}>
            <span className="glyphicon" style={{ marginRight: '5px' }}></span>
            <span style={{ color: anyFailure ? '#fff' : '#000' }}>{title} Relvals</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="super-colors">
        {
	          Object.entries(tests).map(([key, item], idx) => {
                let num = 0;
                let done = "*"
	              let state = "failed";
	              let label_type = "btn label label-danger";
                if (item.done){done = "";}
                if (item.details) {
		                num = Number(item.details.num_failed) || 0;
                    if (num === 0){
		                    state = "passed";
		                    label_type = "btn label label-success";
                        num = Number(item.details.num_passed) || 0;
                    }
                }
                const match = item.release_name.match(/^(CMSSW_\d+_\d+)_((.+_|)X)_(.*)$/);
                let selected_item = "";
                if (type_name === "gpu") {
                    selected_item = item.gpu;
                } else if (type_name === "rntuple") {
                    selected_item = item.other;
                }
                const url = urls.newRelValsSpecific(match[1], match[4], match[2], item.arch, "&selected" + selected +"=" + selected_item + "&selectedStatus=" + state);
	              return (
                    <MenuItem key={uuid.v4()} href={url}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><b>{key}</b></div>
                            <div style={{ marginLeft: '5px' }}>
		                            <span className={label_type}>{num}{done}</span>
		                        </div>
                        </div>
                    </MenuItem>
                );
            }
        )}
        </Dropdown.Menu>
        </Dropdown>,
        <span key={uuid.v4()}>   </span>
    ]);
}

export { RelvalsLabel };
