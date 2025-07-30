import React from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import {Dropdown, MenuItem, Glyphicon} from "react-bootstrap";
import { config, showLabelConfig } from '../../config';
import getBuildOrUnitUrl from "./ComparisonTable";
const {urls} = config;

//import { renderIBTag } from './StatusLabels';

const xrenderIBTag = (label, isRed) => {
return	(
  <span
    className={`badge badge-pill ${isRed ? 'badge-danger' : 'badge-light'} mr-1`}
  >
    {label}
  </span>
);};

const renderIBTag = (label, isRed) => (
  <span
    className={`badge ${isRed ? 'badge-danger' : 'badge-default'} mr-1`}
    style={{ backgroundColor: isRed ? '#d9534f' : '#eee', color: isRed ? '#fff' : '#000' }}
  >
    {label}
  </span>
);

const GpuRelvalsLabel = ({ gpuTests , ib}) => {
  if (!gpuTests || Object.keys(gpuTests).length === 0) return null;
  const anyFailure = Object.values(gpuTests).some(t => t.details && t.details.num_failed > 0);
  return ([
    <Dropdown key={uuid.v4()} id="dropdown-gpurelval-1" bsSize="small">
      <Dropdown.Toggle bsStyle={anyFailure ? 'danger' : 'default'} id="gpu-test-toggle">
        <span className="glyphicon" style={{ marginRight: '5px' }}></span>
        <span style={{ color: anyFailure ? '#fff' : '#000' }}>GPU Relvals</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className="super-colors">
        {
	  Object.entries(gpuTests).map(([key, item], idx) => {
            let num = 0;
            let done = "*"
	    let state = "failed";
	    let label_type = "btn label label-danger";
            if (item.done){done = "";}
            if (item.details) {
		num = Number(item.details.num_failed) || 0;
                if (num == 0){
		    state = "passed";
		    label_type = "btn label label-success";
                    num = Number(item.details.num_passed) || 0;
                }
            }
            const match = item.release_name.match(/^(CMSSW_\d+_\d+)_((.+_|)X)_(.*)$/);
            const url = urls.newRelValsSpecific(match[1], match[4], match[2], item.arch, "&selectedGPUs=" + item.gpu + "&selectedStatus=" + state);
	    return (
              <MenuItem key={uuid.v4()} href={url}>
                <span className="badge badge-default" style={{ marginRight: '5px' }}>{key}</span>
                <span className={label_type}>{num}{done}</span>
              </MenuItem>
            );
        })}
      </Dropdown.Menu>
    </Dropdown>,
    <span key={uuid.v4()}>   </span>
  ]
  );
};

const GpuQALabel = ({ gpuTests , ib}) => {
  if (!gpuTests || Object.keys(gpuTests).length === 0) return null;
  const anyFailure = Object.values(gpuTests).some(t => t.details && Number(t.details.num_fails) > 0);
  return ([
    <Dropdown key={uuid.v4()} id="dropdown-gputest-1" bsSize="small">
      <Dropdown.Toggle bsStyle={anyFailure ? 'danger' : 'default'} id="gpu-test-toggle">
        <span className="glyphicon" style={{ marginRight: '5px' }}></span>
        <span style={{ color: anyFailure ? '#fff' : '#000' }}>GPU Test</span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {
          Object.entries(gpuTests).map(([key, item], idx) => {
            const failed = item.details && Number(item.details.num_fails) || 0;
            //getUrl({"file": details.file, "arch": details.arch, "ibName": ibName, "urlParameter": urlParameter})
            const url = `/report/${key}`; // Replace with real URL logic
            return (
              <MenuItem key={key || idx}>
                <span className="badge badge-default" style={{ marginRight: '5px' }}>{key}</span>
                {failed === 0 ? (
                   <a className="btn label label-success" href={url}><span className="glyphicon glyphicon-ok-circle"></span></a>
                   ) : (
                   <a className="btn label label-danger" href={url}>{failed}</a>
                )}
              </MenuItem>
            );
        })}
      </Dropdown.Menu>
    </Dropdown>,
    <span key={uuid.v4()}>   </span>]
  );
};

export { GpuRelvalsLabel, GpuQALabel };
