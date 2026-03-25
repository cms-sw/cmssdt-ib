import ShowArchActionTypes from "../Actions/ShowArchActionTypes";
import { config } from "../config";
import {extractInfoFromArchs} from "../Utils/processing";
import {getMultipleFiles} from "../Utils/ajax";

const {urls, colorCoding} = config;

/**
 * Store used to keep information about selected archs in IB page clicked in NavBar
 */
class ShowArchStore extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50); 
        this.emptyConfig = {
            'os': [], 'cpu': [], 'compiler': []
        };
        this.queConfig = {};
        this.getData();
    }

    toggleArch(archName) {
        // const index = _.findIndex(this.archs, (i) => {
        //     return i.id === archName
        // });
        // this.archs[index].toggle = !this.archs[index].toggle;
        // this.emit("change");
    }

    getData() {
        getMultipleFiles({
            fileUrlList: [urls.releaseStructure, urls.latestIBSummary],
            onSuccessCallback: function (responseList) {
                const structureData = responseList[0].data;
                const ibSummary = responseList[1].data;
                const {all_prefixes, all_release_queues} = structureData;
                const {prod_archs} = ibSummary;
                let archListByRealise = {}, config = {};
                all_release_queues.forEach((que) => {
                    if (!ibSummary[que]) {
                        return
                    }
                    archListByRealise[que] = Object.keys(ibSummary[que]);
                });
                all_prefixes.forEach((prefix) => {
                    const releaseFlavors = structureData[prefix];
                    releaseFlavors.forEach((flavor) => {
                        if (!config[prefix]) {
                            config[prefix] = [];
                        }
                        if (! archListByRealise[flavor]){
                            return; // workaround if arch is missing, all page will not crash
                        }
                        config[prefix] = config[prefix].concat(
                            archListByRealise[flavor]
                        );
                    })
                });
                all_prefixes.forEach(que => {
                    if (!prod_archs[que]){
                        return; // workaround if arch is missing, all page will not crash
                    }
                    if (!config[que][0] && prod_archs[que] ) {
                        config[que][0] = prod_archs[que];
                    }
                    // TODO maybe just make seperate colors for archs
                    // TODO if 1 color per combination, add logic here
                    let results = extractInfoFromArchs(config[que]);
                    const [os, cpu, compiler] = prod_archs[que].split('_');
                    config[que] = {
                        allArchs: Object.assign({}, results),
                        activeArchs: Object.assign({}, results),
                        colorCoding: {}
                    };
                    const colorFunction = (prodField) => {
                        let counter = 0;
                        return (field) => {
                            const {prodColor, alternatingColors, defaultColor} = colorCoding;
                            let queColorConfig = config[que].colorCoding;
                            if (field === prodField) {
                                queColorConfig[field] = prodColor;
                            } else if (counter < alternatingColors.length) {
                                queColorConfig[field] = alternatingColors[counter];
                                counter++;
                            } else {
                                queColorConfig[field] = defaultColor;
                            }
                        }
                    };
                    results.os.map(colorFunction(os));
                    results.cpu.map(colorFunction(cpu));
                    results.compiler.map(colorFunction(compiler));
                });
                this.queConfig = config;
                this.emit("change");
            }.bind(this)
        });
    }

    getAllArchsForQue(releaseQue) {
        const archsConfig = this.queConfig[releaseQue];
        if (archsConfig) {
            return archsConfig['allArchs'];
        } else {
            return this.emptyConfig;
        }
    }

    getActiveArchsForQue(releaseQue) {
        const archsConfig = this.queConfig[releaseQue];
        if (archsConfig) {
            return archsConfig['activeArchs'];
        } else {
            return this.emptyConfig;
        }
    }

    getColorsSchemeForQue(releaseQue) {
        const archsConfig = this.queConfig[releaseQue];
        if (archsConfig) {
            return archsConfig['colorCoding'];
        } else {
            return {};
        }
    }

    setActiveArchs(values) {
        const {field, activeValues, releaseQue} = values;
        this.queConfig[releaseQue]['activeArchs'][field] = activeValues;
        this.emit("change");
    }

    handleActions(action) {
        switch (action.type) {
            case ShowArchActionTypes.TOGGLE_ARCH: {
                this.toggleArch(action.id);
                break;
            }
            case ShowArchActionTypes.LOAD_ARCHS: {
                // TODO
                // this.arch = action.todos;
                this.emit("change");
                break;
            }
            case ShowArchActionTypes.LOAD_ACTIVE_ARCHS: {
                // TODO
                this.emit("change");
                break;
            }
            case ShowArchActionTypes.SET_ACTIVE_ARCHS: {
                this.setActiveArchs(action.values);
                break;
            }
            default :{
                console.error("Wrong case in switch logic: "+ action.type);
            }
        }
    }
}

const showArchStore = new ShowArchStore();
export default showArchStore;
