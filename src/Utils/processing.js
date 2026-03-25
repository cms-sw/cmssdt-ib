import _ from 'underscore';
import { STATUS_ENUM } from "../relValConfig";

export function groupAndTransformIBDataList(data) {
  let x = _.map(data, _getComparisons);
  x = _.flatten(x, true);
  x = _.groupBy(x, 'next_ib');

  let grouped = _.map(_.groupBy(x['false'], 'ib_date'), function (item, key) {
    return { dateKey: key, data: item };
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
    return valueInTheList(activeArchsConfig['os'], os) &&
      valueInTheList(activeArchsConfig['cpu'], cpu) &&
      valueInTheList(activeArchsConfig['compiler'], compiler);
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
    os: [],
    cpu: [],
    compiler: []
  };

  archList.forEach((arch) => {
    const results = arch.split("_");
    infoObject.os.push(results[0]);
    infoObject.cpu.push(results[1]);
    infoObject.compiler.push(results[2]);
  });

  return {
    os: _.uniq(infoObject.os),
    cpu: _.uniq(infoObject.cpu),
    compiler: _.uniq(infoObject.compiler),
  };
}

export function getCurrentIbTag(ib) {
  return ib.compared_tags.split("-->")[1];
}

export function getPreviousIbTag(ib) {
  return ib.compared_tags.split("-->")[0];
}

export function checkIfTableIsEmpty({ fieldsToCheck = [], IBGroup = [] }) {
  for (let i = 0; i < IBGroup.length; i++) {
    const ib = IBGroup[i];

    for (let j = 0; j < fieldsToCheck.length; j++) {
      const field = fieldsToCheck[j];
      const results = ib[field];

      if (!Array.isArray(results) || results.length === 0) {
        continue;
      }

      for (let k = 0; k < results.length; k++) {
        const result = results[k];
        if (!result) continue;

        const { passed, details } = result;

        if (
          passed === true ||
          passed === false ||
          passed === "passed" ||
          passed === "failed" ||
          passed === "error" ||
          passed === "warning" ||
          passed === "unknown"
        ) {
          return false;
        }

        if (details && typeof details === "object") {
          const detailKeys = Object.keys(details);
          const hasUsefulDetails = detailKeys.some((key) => {
            const value = details[key];
            return typeof value === "number" && value > 0;
          });

          if (hasUsefulDetails) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

export function checkIfCommitsAreEmpty({ IBGroup = [] }) {
  for (let i = 0; i < IBGroup.length; i++) {
    let ib = IBGroup[i];
    if (!(ib['merged_prs'] === undefined || ib['merged_prs'].length === 0)) {
      return false;
    }
  }
  return true;
}

let displayNameCache = {};

export function getDisplayName(name) {
  let lookUp = displayNameCache[name];
  if (lookUp) {
    return lookUp;
  } else {
    let re = /^[a-zA-Z]+_[0-9]+_[0-9]+_/g;
    let result = name.replace(re, '');
    if (result === 'X') {
      displayNameCache[name] = 'DEFAULT';
      return 'DEFAULT';
    } else {
      displayNameCache[name] = result;
      return result;
    }
  }
}

export function getInfoFromRelease(releseName) {
  const reReleaseInfo = /^([a-zA-Z]+_[0-9]+_[0-9])+_(.*)_(\d{4}-\d{2}-\d{2}-\d{4})/;
  return releseName.match(reReleaseInfo);
}

export function getComReleaseFromQue(release) {
  if (release) {
    const reReleaseInfo = /^([a-zA-Z]+_)([0-9]+_[0-9]+_.*)/;
    const info_list = release.match(reReleaseInfo);
    return info_list[2];
  }
}

export function getStructureFromAvalableRelVals(relvalInfoObject) {
  const keysList = Object.keys(relvalInfoObject);
  let config = {};

  keysList.forEach((key) => {
    const [, que, flavor, date] = getInfoFromRelease(key);
    const archs = relvalInfoObject[key].split(',');

    if (!config[date]) {
      config[date] = {};
    }
    if (!config[date][que]) {
      config[date][que] = {
        flavors: {},
        allArchs: [],
        allGPUs: [],
        allOthers: [],
        dataLoaded: false
      };
    }

    config[date][que].flavors[flavor] = {};

    archs.forEach(archx => {
      let parts = archx.split(":");
      let arch = parts.shift();

      if (!config[date][que].flavors[flavor][arch]) {
        config[date][que].flavors[flavor][arch] = {};
      }

      let type = "";
      let name = "";

      config[date][que].flavors[flavor][arch][type] = {};
      config[date][que].flavors[flavor][arch][type][name] = { date, que, flavor, arch, type, name };
      config[date][que].allArchs.push(arch);

      parts.forEach(part => {
        let items = part.split(";");
        let type = items.shift();

        config[date][que].flavors[flavor][arch][type] = {};
        items.forEach(name => {
          config[date][que].flavors[flavor][arch][type][name] = { date, que, flavor, arch, type, name };
        });

        if (type === "gpu") {
          config[date][que].allGPUs = config[date][que].allGPUs.concat(items);
        } else if (type === "other") {
          config[date][que].allOthers = config[date][que].allOthers.concat(items);
        }
      });
    });

    config[date][que].allArchs = _.uniq(config[date][que].allArchs);
    config[date][que].allGPUs = _.uniq(config[date][que].allGPUs);
    config[date][que].allOthers = _.uniq(config[date][que].allOthers);
  });

  return config;
}

export function transforListToObject(relValList) {
  let relValObj = {};
  (relValList || []).forEach(i => {
    relValObj[i.id] = i;
  });
  return relValObj;
}

export function filterNameList(originalList, whiteList) {
  if (Array.isArray(whiteList)) {
    return _.filter(originalList, (item) => {
      return _.contains(whiteList, item);
    });
  } else {
    return _.filter(originalList, (item) => {
      return item === whiteList;
    });
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
    return list === value;
  }
}

export function filterRelValStructure({
  structure,
  selectedArchs,
  selectedGPUs,
  selectedOthers,
  selectedFlavors,
  selectedStatus
}) {
  let filteredRelvals = [];
  let { allRelvals = [], flavors } = structure;
  const filteredFlavorKeys = filterNameList(getObjectKeys(flavors), selectedFlavors);

  allRelvals.forEach(relVal => {
    let statusMap = {};

    filteredFlavorKeys.forEach(flavor => {
      let filteredArchKeys = filterNameList(getObjectKeys(flavors[flavor]), selectedArchs);

      filteredArchKeys.forEach(arch => {
        let types = Object.keys(flavors[flavor][arch]);

        types.forEach(type => {
          let typeKeys = getObjectKeys(flavors[flavor][arch][type]);
          let filteredTypeKeys = [];

          if (type === "gpu") {
            filteredTypeKeys = filterNameList(typeKeys, selectedGPUs);
          } else if (type === "other") {
            filteredTypeKeys = filterNameList(typeKeys, selectedOthers);
          } else if (selectedGPUs === "") {
            filteredTypeKeys.push("");
          }

          filteredTypeKeys.forEach(name => {
            const { id } = relVal;
            const fullRelVal = flavors[flavor][arch][type][name][id];
            if (fullRelVal) {
              if (doMarkAsFailed(fullRelVal)) {
                statusMap[STATUS_ENUM.FAILED] = true;
              } else if (!(statusMap === STATUS_ENUM.FAILED) && isRelValKnownFailed(fullRelVal)) {
                statusMap[STATUS_ENUM.KNOWN_FAILED] = true;
              } else if (!(statusMap === STATUS_ENUM.FAILED) && !(statusMap === STATUS_ENUM.KNOWN_FAILED)) {
                statusMap[STATUS_ENUM.PASSED] = true;
              }
            }
          });
        });
      });
    });

    let statusList = getObjectKeys(statusMap);
    for (let i = 0; i < statusList.length; i++) {
      if (valueInTheList(selectedStatus, statusList[i])) {
        filteredRelvals.push(relVal);
        break;
      }
    }
  });

  return filteredRelvals;
}

export function isRelValKnownFailed(relVal) {
  return relVal.known_error === 1;
}

function isRelValPassingWhenKnownFailed(relval) {
  return relval.known_error === -1;
}

export function isRelValTrackedForFailed(relVal) {
  return isRelValKnownFailed(relVal) || isRelValPassingWhenKnownFailed(relVal);
}

function doMarkAsFailed(relVal) {
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
  let resultKeys = Object.keys(details);
  let labelConfig = { value: 0 };

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