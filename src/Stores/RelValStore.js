import {EventEmitter} from "events";
import dispatcher from "../dispatcher";
import * as config from "../relValConfig";
import {getMultipleFiles} from "../Utils/ajax";
import {getStructureFromAvalableRelVals, relValStatistics, transforListToObject} from "../Utils/processing";

const {urls} = config;

class RelValStore extends EventEmitter {
    // TODO show statistics can be calculated here
    constructor() {
        super();
        this.setMaxListeners(50); // The more tables in the page are, the more listeners I need. Looks like its cleaning up properly on unmount, but this was not the right approach
        this._getStructure();
    }

    _getStructure() {
        getMultipleFiles({
            fileUrlList: [urls.RelvalsAvailableResults],
            onSuccessCallback: function (responseList) {
                const relvalsAvailableResults = responseList[0].data;
                this.structure = getStructureFromAvalableRelVals(relvalsAvailableResults);
                this.emit("change");
            }.bind(this)
        });
    }

    _getQueData({date, que}) {
        if (this.structure) {
            try {
                return this.structure[date][que];
            } catch (ex) {
                console.error('Wrong params: ' + date + " | " + que + ' ;', ex);
            }
        }
    }

    getAllArchsForQue({date, que}) {
        const allQueInfo = this._getQueData({date, que});
        if (allQueInfo) {
            return allQueInfo.allArchs
        }
    }

    getAllGPUsForQue({date, que}) {
        const allQueInfo = this._getQueData({date, que});
        if (allQueInfo) {
            return allQueInfo.allGPUs
        }
    }

    getAllOthersForQue({date, que}) {
        const allQueInfo = this._getQueData({date, que});
        if (allQueInfo) {
            return allQueInfo.allOthers
        }
    }

    getAllFlavorsForQue({date, que}) {
        const allQueInfo = this._getQueData({date, que});
        if (allQueInfo) {
            return Object.keys(allQueInfo.flavors).sort().reverse();
        }
    }

    getFlavorStructure({date, que}) {
        if (this.structure) {
            try {
                if (!this.structure[date][que].dataLoaded) {
                    let archsToLoad = [];
                    let allRelValIDObject = {};
                    const {flavors} = this.structure[date][que];
                    const allFlavors = this.getAllFlavorsForQue({date, que});
                    allFlavors.forEach(flavorName => {
                        const archs = Object.keys(flavors[flavorName]);
                        archs.forEach(arch => {
                            const types = Object.keys(flavors[flavorName][arch]);
                            types.forEach(type => {
                                const names = Object.keys(flavors[flavorName][arch][type]);
                                names.forEach(name => {
                                    archsToLoad.push(flavors[flavorName][arch][type][name]);
                                });
                            });
                        });
                    });
                    const relValsUrl = archsToLoad.map(i => urls.relValsResult(i.arch, i.date, i.que, i.flavor, i.type, i.name));
                    const relValsIdToHashcodeUrl = archsToLoad.map(i => urls.relValWorkFlowToIdHash(i.arch, i.date, i.que, i.flavor, i.type, i.name));

                    // load RelVals status and structure it
                    getMultipleFiles({
                        fileUrlList: [...relValsUrl, ...relValsIdToHashcodeUrl], // loaded data together
                        onSuccessCallback: function (responseList) {
                            for (let i = 0; i < archsToLoad.length; i++) {
                                const {data: relvals} = responseList[i];
                                const workflowHashes = responseList[archsToLoad.length + i].data;
                                const {que, date, arch, flavor, type, name} = archsToLoad[i];
                                let relValObject = transforListToObject(relvals);
                                const workflowKeys = Object.keys(relValObject);
                                workflowKeys.forEach(wf => {
                                    let {steps} = relValObject[wf];
                                    for (let s = 0; s < steps.length; s++) {
                                        let workflowHash = workflowHashes[wf + "-" + (s + 1)];
                                        steps[s]['workflowHash'] = workflowHash;
                                    }
                                });
                                this.structure[date][que].flavors[flavor][arch][type][name] = relValObject;
                                // to add statistics to relVals
                                if (!this.structure[date][que].relvalStatus) {
                                    this.structure[date][que].relvalStatus = {};
                                }
                                if (!this.structure[date][que].relvalStatus[flavor]) {
                                    this.structure[date][que].relvalStatus[flavor] = {};
                                }
                                if (!this.structure[date][que].relvalStatus[flavor][arch]) {
                                    this.structure[date][que].relvalStatus[flavor][arch] = {};
                                }
                                if (!this.structure[date][que].relvalStatus[flavor][arch][type]) {
                                    this.structure[date][que].relvalStatus[flavor][arch][type] = {};
                                }
                                this.structure[date][que].relvalStatus[flavor][arch][type][name] = relValStatistics(relvals);
                                // ---
                                workflowKeys.forEach((id) => {
                                    const exitCode = relValObject[id].exitcode;
                                    if (exitCode !== 0) {
                                        allRelValIDObject[id] = {
                                            id,
                                            passed: false,
                                            cmdName: relValObject[id].name
                                        }
                                    } else if (!allRelValIDObject[id]) {
                                        allRelValIDObject[id] = {
                                            id,
                                            passed: true,
                                            cmdName: relValObject[id].name
                                        }
                                    }
                                })
                            }
                            let relValKeyList = Object.keys(allRelValIDObject).sort((a, b) => a - b);
                            this.structure[date][que].allRelvals = relValKeyList.map((i, index) => {
                                allRelValIDObject[i]['index'] = index + 1;
                                return allRelValIDObject[i];
                            });
                            this.structure[date][que].dataLoaded = true;
                            this.emit("change");
                        }.bind(this)
                    });

                }
                return this.structure[date][que];
            }
            catch (ex) {
                console.error('Wrong params: ' + date + " | " + que + ' ;', ex);
            }
        }
    }

    handleActions(action) {
        switch (action.type) {
            // TODO
        }
    }

}

const relValStore = new RelValStore();
dispatcher.register(relValStore.handleActions.bind(relValStore));
export default relValStore;
