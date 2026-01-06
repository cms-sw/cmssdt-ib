import _ from 'underscore';
import {STATUS_ENUM} from "../relValConfig";

/**
 *  In this module functions for pre-processing data are stored.
 */
export function groupAndTransformIBDataList(data) {
    // TODO-prep: could be done in python
    let x = _.map(data, _getComparisons);
    x = _.flatten(x, true);
    x = _.groupBy(x, 'next_ib');
    let grouped = _.map(_.groupBy(x['false'], 'ib_date'), function (item, key) {
        return {dateKey: key, data: item};
    });
    let result = x['true'] !== undefined ? [x['true']] : [];
    let groupedArray = _.map(_.sortBy(grouped, 'dateKey').reverse(), function (item) {
        return item.data;
    });
    result = result.concat(groupedArray);
    return result;
}

function _getComparisons(listEl) {
    return _.map(listEl.comparisons, function (comparison) {
        return comparison;
    });
}

export function getAllArchitecturesFromIBGroup(IBGroup) {
    let a = _.map(IBGroup, function (item) {
        return item.tests_archs;
    });
    a = _.flatten(a, true);
    a = _.uniq(a);
    return a;
}

function _filterArchs(archs, activeArchsConfig) {
    return _.filter(archs, (arch) => {
        const [os, cpu, compiler] = arch.split('_');
        return valueInTheList(activeArchsConfig['os'], os) && valueInTheList(activeArchsConfig['cpu'], cpu)
            && valueInTheList(activeArchsConfig['compiler'], compiler);
    });
}

export function getAllActiveArchitecturesFromIBGroupByFlavor(IBGroup, activeArchs) {
    let a = _.map(IBGroup, function (ib) {
        const filteredArchs = _filterArchs(ib.tests_archs, activeArchs);
        return {
            flavor: ib.release_queue,
            name: ib.release_name,
            archs: filteredArchs,
            cmsdistTags: ib.cmsdistTags,
            current_tag: getCurrentIbTag(ib)
        };
    });
    a = _.flatten(a, true);
    a = _.uniq(a);
    return a;
}

export function extractInfoFromArchs(archList) {
    archList = filterUndefinedFromList(archList);
    let infoObject = {
        'os': [],
        'cpu': [],
        'compiler': []
    };
    archList.forEach(
        (arch) => {
            const results = arch.split("_");
            infoObject['os'].push(results[0]);
            infoObject['cpu'].push(results[1]);
            infoObject['compiler'].push(results[2]);
        }
    );
    return {
        'os': _.uniq(infoObject['os']),
        'cpu': _.uniq(infoObject['cpu']),
        'compiler': _.uniq(infoObject['compiler']),
    };
}

/**
 * general utility functions
 */
export function getCurrentIbTag(ib) {
    return ib.compared_tags.split("-->")[1]
}

export function getPreviousIbTag(ib) {
    return ib.compared_tags.split("-->")[0]
}

export function checkIfTableIsEmpty({fieldsToCheck = [], IBGroup = []}) {
    for (let i = 0; i < IBGroup.length; i++) {
        let ib = IBGroup[i];
        for (let i = 0; i < fieldsToCheck.length; i++) {
            let field = fieldsToCheck[i];
            if (!(ib[field] === undefined || ib[field].length === 0)) {
                return false // there are some data in the table
            }
        }
    }
    return true // fields are empty
}

export function checkIfCommitsAreEmpty({IBGroup = []}) {
    for (let i = 0; i < IBGroup.length; i++) {
        let ib = IBGroup[i];
        if (!(ib['merged_prs'] === undefined || ib['merged_prs'].length === 0)) {
            return false // there are commits
        }
    }
    return true // there are no commits
}

// keeping short display name for an object
let displayNameCache = {};

export function getDisplayName(name) {
    // TODO could be writen as service and load json
    let lookUp = displayNameCache[name];
    if (lookUp) {
        return lookUp;
    } else {
        let re = /^[a-zA-Z]+_[0-9]+_[0-9]+_/g; // will match 'CMSSW_10_0_'
        let result = name.replace(re, '');
        if (result === 'X') {
            displayNameCache[name] = 'DEFAULT';
            return 'DEFAULT'
        } else {
            displayNameCache[name] = result;
            return result;
        }
    }
}


export function getInfoFromRelease(releseName) {
    const reReleaseInfo = /^([a-zA-Z]+_[0-9]+_[0-9])+_(.*)_(\d{4}-\d{2}-\d{2}-\d{4})/;  //CMSSW_5_3 _X _ 2018-03-04-0000
    return releseName.match(reReleaseInfo) // fullMatch, que, flavor, date
}

export function getComReleaseFromQue(release) {
    if (release) {
        const reReleaseInfo = /^([a-zA-Z]+_)([0-9]+_[0-9]+_.*)/;  //CMSSW _5_3_X
        const info_list = release.match(reReleaseInfo); // fullMatch, CMSSW, que
        return info_list[2];
    }
}

export function getStructureFromAvalableRelVals(relvalInfoObject) {
    const keysList = Object.keys(relvalInfoObject);
    let config = {};
    keysList.forEach((key) => {
        const [, que, flavor, date] = getInfoFromRelease(key);  // first variable is fullMatch
        const archs = relvalInfoObject[key].split(',');
        if (!config[date]) {
            config[date] = {}
        }
        if (!config[date][que]) {
            config[date][que] = {
                flavors: {},
                allArchs: [],
		allGPUs: [],
                dataLoaded: false
            }
        }
        config[date][que].flavors[flavor] = {};
        let uarchs = [];
	let ugpus = [];
        archs.forEach(archx => {
            let parts = archx.split(":");
            let arch = parts.shift();
	    if (!config[date][que].flavors[flavor][arch]){
              config[date][que].flavors[flavor][arch] = {}
	    }
	    let gpu = "";
            config[date][que].flavors[flavor][arch][""] = {date, que, flavor, arch, gpu}
	    uarchs.push(arch);
            parts.filter(p => p.startsWith("gpu_")).parts.forEach(gpu => {
                config[date][que].flavors[flavor][arch][gpu] = {date, que, flavor, arch, gpu};
		ugpus.push(gpu)
            // TODO sort config[date][que].flavors[flavor] somehow, for now it is sorted at 2 places
            });
        });
	config[date][que].allArchs = _.uniq(config[date][que].allArchs.concat(uarchs));
	config[date][que].allGPUs = _.uniq(config[date][que].allGPUs.concat(ugpus));
    });
    return config;
}

export function transforListToObject(relValList) {
    /**
     * Will transform RelVal list to object where relVal id is the key
     */
    let relValObj = {};
    relValList.forEach(i => {
        relValObj[i.id] = i;
    });
    return relValObj;
}

export function filterNameList(originalList, whiteList) {
    if (Array.isArray(whiteList)) {
        // if whiteList is a list
        return _.filter(originalList, (item) => {
            return _.contains(whiteList, item)
        })
    } else {
        // if whiteList is a single String
        return _.filter(originalList, (item) => {
            return item === whiteList
        })
    }
}

export function filterUndefinedFromList(list) {
    return _.filter(list, (i) => i !== undefined);
}

export function getObjectKeys(obj) {
    return obj ? Object.keys(obj) : [];
}

export function valueInTheList(list = [], value) {
    if (Array.isArray(list)) {
        return list.indexOf(value) > -1;
    } else {
        // if the 'list' is actually not a list
        return list === value;
    }
}

export function filterRelValStructure({structure, selectedArchs, selectedGPUs, selectedFlavors, selectedStatus}) {
    /**
     * This will return selected relvals .
     */
    let filteredRelvals = [];
    let {allRelvals = [], flavors} = structure;
    const filteredFlavorKeys = filterNameList(getObjectKeys(flavors), selectedFlavors);
    for (let i = 0; i < allRelvals.length; i++) {
        let relVal = allRelvals[i];
        let statusMap = {}; // all available status for RelVal row
        for (let z = 0; z < filteredFlavorKeys.length; z++) {
            let flavor = filteredFlavorKeys[z];
            let archKeys = getObjectKeys(flavors[flavor]);
            let filteredArchKeys = filterNameList(archKeys, selectedArchs);
            for (let x = 0; x < filteredArchKeys.length; x++) {
                const archKey = filteredArchKeys[x];
		let gpuKeys = getObjectKeys(flavors[flavor][archKey]);
		let filteredGPUKeys = filterNameList(gpuKeys, selectedGPUs);
		for(let y = 0; y < filteredGPUKeys.length; y++) {
		    const gpuKey = filteredGPUKeys[y];
                    const {id} = relVal;
                    const fullRelVal = flavors[flavor][archKey][gpuKey][id];
                    if (fullRelVal) {
                        // check if RelVal is Failed | KNOWN_FAILED | PASSED
                        if (doMarkAsFailed(fullRelVal)) {
                            // if workflow is failed at least in one ib, mark all row failed
                            statusMap[STATUS_ENUM.FAILED] = true;
                        } else if (!(statusMap === STATUS_ENUM.FAILED) && isRelValKnownFailed(fullRelVal)) {
                            // if no failed
                            statusMap[STATUS_ENUM.KNOWN_FAILED] = true;
                        } else if (!(statusMap === STATUS_ENUM.FAILED) && !(statusMap === STATUS_ENUM.KNOWN_FAILED)) {
                            // if no failed and known_failed
                            statusMap[STATUS_ENUM.PASSED] = true;
                        }
	            }
                }
            }
        }

        let statusList = getObjectKeys(statusMap);
        for (let i = 0; i < statusList.length; i++) {
            if (valueInTheList(selectedStatus, statusList[i])) {
                filteredRelvals.push(relVal);
                break;
            }
        }

    }
    return filteredRelvals;
}

/*
    Relvals have these 'known_error' fields:
    -1 - was known failed, but now started to pass
     0 - is not known
     1 - is known

    RelVals have these 'exitcode' values:
    != 0 failed
    == 0 passed
*/


export function isRelValKnownFailed(relVal) {
    return relVal.known_error === 1;
}

function isRelValPassingWhenKnownFailed(relval) {
    return relval.known_error === -1;
}

export function isRelValTrackedForFailed(relVal) {
    // Is relval tracked for being known_failed
    return isRelValKnownFailed(relVal) || isRelValPassingWhenKnownFailed(relVal);
}

function doMarkAsFailed(relVal) {
    //
    return (relVal.exitcode !== 0 && !isRelValKnownFailed(relVal)) || isRelValPassingWhenKnownFailed(relVal);
}

export function relValStatistics(relValList) {
    let statistics = {
        size: relValList.length,
        passed: 0,
        known_failed: 0,
        failed: 0
    };
    for (let i = 0; i < relValList.length; i++) {
        const relVal = relValList[i];
        if (doMarkAsFailed(relVal)) {
            statistics.failed += 1;
        } else if (isRelValKnownFailed(relVal)) {
            statistics.known_failed += 1;
        } else {
            statistics.passed += 1;
        }
    }
    return statistics;
}


export function checkLabelType(showLabelConfig, details) {
    /**
     * Check details and show if has errors, if no - warnings, if no - then show success
     * @type {{value: number, colorType: success | warning | error , or anything passed from config}}
     */
    let resultKeys = Object.keys(details);
    let labelConfig = {value: 0};
    for (let i = 0; i < showLabelConfig.length; i++) {
        let el = showLabelConfig[i];
        el.groupFields.forEach((predicate) => {
            if (typeof predicate === "function") {
                resultKeys.forEach(key => {
                    if (predicate(key)) {
                        labelConfig.value += details[key] * 1;
                    }
                });
            } else {
                if (valueInTheList(resultKeys, predicate)) {
                    labelConfig.value += details[predicate] * 1;
                }
            }
        });
        if (labelConfig.value > 0) {
            labelConfig.colorType = el.color;
            break;
        }
    }
    return labelConfig;
}
