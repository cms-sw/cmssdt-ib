import * as React from "react";
import uuid from 'uuid';

export const LABEL_COLOR = {
    PASSED_COLOR: 'rgb(92, 184, 92)',
    PASSED_WARNINGS_COLOR: 'rgb(92, 145, 92)',
    PASSED_ERRORS_COLOR: 'rgb(230, 188, 99)',
    FAILED_COLOR: 'rgb(217, 83, 79)',
    NOT_RUN_COLOR: 'rgb(153, 153, 153)',
    DAS_ERROR_COLOR: 'rgb(255, 153, 204)',
    // TIMEOUT_COLOR: 'rgb(0, 128, 255)'
};
export const LABELS_TEXT = {
    PASSED: 'Passed',
    FAILED: 'Failed ',
    NOTRUN: 'NotRun',
    DAS_ERROR: 'DAS-Err',
    TIMEOUT: 'TimeOut',
    STARTED: 'Started'
};
export const STATUS_ENUM = {
    PASSED: 'passed',
    FAILED: 'failed',
    KNOWN_FAILED: 'known_failed'
};
export const STATUS_ENUM_LIST = [
    STATUS_ENUM.FAILED, STATUS_ENUM.KNOWN_FAILED, STATUS_ENUM.PASSED
];
export const RELVAL_STATUS_ENUM = {
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    DAS_ERROR: 'DAS_ERROR',
    TIMEOUT: 'TIMEOUT',
    NOTRUN: 'NOTRUN'
};
const cmssdt_server = process.env.REACT_APP_CMSSDT_SERVER || "";
export const urls = {
    exitcodes: "https://cms-sw.github.io/exitcodes.json",
    RelvalsAvailableResults: "/SDT/public/cms-sw.github.io/data/RelvalsAvailableResults.json",
    relValsResult: (arch, date, que, flavor, type, name) =>
        type && type !== ""
          ? `/SDT/public/cms-sw.github.io/data/relvals/${arch}/${date}/${type}/${name}/${que}_${flavor}.json`
          : `/SDT/public/cms-sw.github.io/data/relvals/${arch}/${date}/${que}_${flavor}.json`,
    relValWorkFlowToIdHash: (arch, date, que, flavor, type, name) =>
        type && type !== ""
          ? `/SDT/public/cms-sw.github.io/data/commands/${arch}/${date}/${type}/${name}/${que}_${flavor}.json`
          : `/SDT/public/cms-sw.github.io/data/commands/${arch}/${date}/${que}_${flavor}.json`,
    relValCmd:
        (digit1, digitsRest) => `/SDT/public/cms-sw.github.io/data/commands/objs/${digit1}/${digitsRest}`,
    relValLog:
        (arch, ib, workflowID, workflowName, filename, type, name) =>
          type && type !== ""
            ? `${cmssdt_server}/SDT/cgi-bin/logreader/${arch}/${ib}/${type}/${name}/pyRelValMatrixLogs/run/${workflowID}_${workflowName}/${filename}`
            : `${cmssdt_server}/SDT/cgi-bin/logreader/${arch}/${ib}/pyRelValMatrixLogs/run/${workflowID}_${workflowName}/${filename}`
};
const _legendConf = [
    {color: LABEL_COLOR.PASSED_COLOR, code: LABELS_TEXT.PASSED, text: 'Passed without error or warning messages'},
    {color: LABEL_COLOR.PASSED_ERRORS_COLOR, code: LABELS_TEXT['PASSED'], text: 'Passed with error messages'},
    {color: LABEL_COLOR.NOT_RUN_COLOR, code: LABELS_TEXT['NOTRUN'], text: 'Not run'},
    {color: LABEL_COLOR.PASSED_WARNINGS_COLOR, code: LABELS_TEXT['PASSED'], text: 'Passed with warning messages'},
    {color: LABEL_COLOR.FAILED_COLOR, code: LABELS_TEXT['FAILED'], text: 'Failed'},
    {color: LABEL_COLOR.DAS_ERROR_COLOR, code: LABELS_TEXT['DAS_ERROR'], text: 'DAS error'},
    {color: LABEL_COLOR.PASSED_COLOR, code: "OtherCMS", text: 'Known failed', glyphicon: "glyphicon-eye-open"},
    // {color: LABEL_COLOR.TIMEOUT_COLOR, code: LABELS_TEXT['TIMEOUT'], text: 'Timed Out'}
];
// TODO could be made better
export const legend = [_legendConf.map(i => {
        let renderedGlyphicon = i.glyphicon ? (<span class={"glyphicon " + i.glyphicon}/> ): null;
        return (
        <p key={uuid.v4()}>
            <span style={{backgroundColor: i.color}}
                className="label">{i.code} {renderedGlyphicon}</span> {i.text} 
        </p>
        )
    }),
];

// Color coding
// Help message config
// TODO Default hidden archs
