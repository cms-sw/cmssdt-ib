import {checkLabelType, getCurrentIbTag} from "./Utils/processing";
import _ from 'underscore';

export const STATUS_ENUM = {
    found: "found",
    passed: "passed",
    not_found: "not-found",
    inprogress: "inprogress",
    inProgress: "inProgress",
    error: "error",
    warning: "warning",
    success: "success"
};

export const showLabelConfig = {
    fwlite: [
        {
            groupFields: [
                "num_failed",
                "dictError",
                "compError",
                "linkError",
                "pythonError",
                "dwnlError",
                "miscError",
                "scram errors"
            ],
            color: "danger" // class to give bootstrap color
        },
        {
            groupFields: ["known_failed"],
            color: "warning"
        },
        {
            groupFields: ["num_passed"],
            color: "success"
        }
    ],
    gpu: [{
        groupFields: ["num_fails"],
        color: "danger"
    }],
    relvals: [
        {
            groupFields: ["num_failed"],
            color: "danger"
        },
        {
            groupFields: ["known_failed"],
            color: "warning"
        },
        {
            groupFields: ["num_passed"],
            color: "success"
        }
    ],
    addons: [
        {
            groupFields: ["num_failed"],
            color: "danger"
        },
        {
            groupFields: ["known_failed"],
            color: "info"
        },
        {
            groupFields: ["num_passed"],
            color: "success"
        }
    ]
};

const urls = {
    issues: [
        {name: 'CMSSW', url: 'https://github.com/cms-sw/cmssw/issues'},
        {name: 'CMSDIST', url: 'https://github.com/cms-sw/cmsdist/issues'},
        {name: 'CMSSW IB page ', url: 'https://github.com/cms-sw/cmssdt-ib/issues'}
    ],
    q_a: (arch, release_name) => '/SDT/cgi-bin/newQA.py?arch=' + arch + '&release=' + release_name,
    dataDir: "/SDT/html/data/",
    releaseStructure: "/SDT/html/data/structure.json",
    latestIBSummary: "/SDT/html/data/LatestIBsSummary.json",
    buildOrUnitTestUrl: "/SDT/cgi-bin/showBuildLogs.py/",
    scramDetailUrl: "http://cms-sw.github.io/scramDetail.html#",
    relvalLogDetailUrl: "https://cms-sw.github.io/relvalLogDetail.html#",
    fwliteUrl: "/SDT/cgi-bin/showBuildLogs.py/fwlite/",
    showAddOnLogsUrls: "/SDT/cgi-bin//showAddOnLogs.py/",
    relVals: "https://cms-sw.github.io/relvalLogDetail.html#",
    commits: "https://github.com/cms-sw/cmsdist/commits/",
    newRelVals: (releaseQue, date) => `#/relVal/${releaseQue}/${date}`,
    newRelValsSpecific: (releaseQue, date, flavor, arch, selectedStatus ) => `#/relVal/${releaseQue}/${date}?selectedArchs=${arch}&selectedFlavors=${flavor}${selectedStatus}`,
    githubCompareTags: (repo, startTag, endtag ) => `https://github.com/${repo}/compare/${startTag}...${endtag}`,
    githubRepo: (repo) => `https://github.com/${repo}`,
    githubRepoTag: (repo, tag) => `https://github.com/${repo}/releases/tag/${tag}`
};


function getBuildOrUnitUrl(ib, test_array, urlParam) {
    /**
     * Generates link to that points to showBuildLogs.py cgi script. Adding parameters at the end of the link
     * (ex. '?gpu_utests' shows specific tests
     *
     * Takes whole IB object and manipulates it.
     */
    let ibName = ib.release_name;
    let { arch, file } = ib[test_array][0];
    if (!file) {
        // do nothing
    } else if (file === 'not-ready') {
        return urls.scramDetailUrl + arch + ";" + ibName
    } else {
        let link_parts = file.split('/');
        const si = 4;
        link_parts = link_parts.slice(si, si + 5);
        return urls.buildOrUnitTestUrl + link_parts.join('/') + urlParam;
    }
}


export const config = {
    tooltipDelayInMs: 200,
    urls: urls,
    colorCoding: {
        prodColor: '#5cb85c', // production arch
        alternatingColors: [
            // '#777',
            // '#999',
            // '#CCC'
        ],
        // defaultColor: '#555', // default non production
        defaultColor: '#777',
    },
    statusLabelsConfigs: [
        // functions  [found|not-found|inProgress]
        /**
         {
             key: "lizard", (data key in JSON)
             name: "Complexity metrics" (text shown)
             ifFound: function(),
             ifNotFound:  function() (default - no output),
             ifInProgress: function() (default - in progress),
             getUrl: function()
         }
         default icons:
         not-found - empty
         inprogress - glyphicon-refresh
         found - glyphicon-list-alt

         example
         // ifFound: function (ib) {
            //     return {
            //         name: this.name,
            //         glyphicon: this.glyphicon,
            //         url: this.getUrl(ib)
            //     };
            // },
         */
        // IB Tag is in StatusLabel  component
        {
            //add_comp_baseline_tests_link
            key: "comp_baseline",
            glyphicon: "glyphicon-ok-sign",
            glyphiconWarning: "glyphicon-warning-sign",
            name: "Comparison Baseline",
            getUrl: function (ib) {
                return ib.comp_baseline;
            },
            customResultInterpretation: function (result) {
                if (result === "not-found") {
                    return "not-found";
                } else if (result === "inprogress") {
                    return "inprogress";
                } else if (result) {
                    return "found";
                }
            },
            ifFound: function (ib) {
                const status = ib.comp_baseline_state;
                if (status === "ok") {
                    return {
                        name: this.name,
                        glyphicon: this.glyphicon,
                        url: this.getUrl(ib)
                    };
                } else {
                    return {
                        name: this.name,
                        glyphicon: this.glyphiconWarning,
                        url: this.getUrl(ib)
                    };
                }
            },
        },
        {
            //add_dqm_tests_link
            key: "dqm_tests",
            name: "DQM Tests",
            getUrl: function (ib) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/ib-dqm-tests/" + getCurrentIbTag(ib);
            }
        },
        {
            //add_hlt_tests_link
            key: "hlt_tests",
            name: "HLT Validation",
            getUrl: function (ib) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/HLT-Validation/" + getCurrentIbTag(ib);
            }
        },
        {
            //add_valgrind_tests_link
            key: "valgrind",
            name: "Valgrind",
            getUrl: function (ib) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/valgrind/" + getCurrentIbTag(ib);
            }
        },
        {
            //add_lizard_tests_link
            // Lizard
            key: "lizard",
            name: "Code complexity metrics",
            getUrl: function (ib) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/lizard/" + getCurrentIbTag(ib);
            }
        },
        {
            key: "flawfinder",
            name: "Flaw finder",
            getUrl: function (ib) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/flawfinder/" + getCurrentIbTag(ib);
            }
        },
        {
            //add_igprof_tests_link
            key: "igprof",
            name: "IgProf",
            getUrl: function (ib) {
                return "https://cmssdt.cern.ch/SDT/cgi-bin/igprof-navigator/" + getCurrentIbTag(ib);
            }
        },
        {
            //add_piechart_link
            name: "Resources Piecharts",
            key: "piechart",
            getUrl: function (ib, result) {
                return "https://cmssdt.cern.ch/circles/web/piechart.php?local=false&dataset="+ getCurrentIbTag(ib)+"/" + result.data + "&resource=time_thread&colours=default&groups=./reco_PhaseII&threshold=0";
            }
        },
        {
            name: "RECO event loop",
            key: "reco_event_loop",
            getUrl: function (ib, result) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/igprof/"
                    + getCurrentIbTag(ib) + "/" + result.data;
            }
        },
        {
            name: "Static Analyzer",
            key: "static_checks_v2",
            getUrl: function (ib, result) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/ib-static-analysis/"
                    + getCurrentIbTag(ib) + '/' + result.arch + '/llvm-analysis/index.html';
            },
        },
        {
            name: "SA thread unsafe modules",
            key: "static_checks_v2",
            getUrl: function (ib, result) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/ib-static-analysis/"
                    + getCurrentIbTag(ib) + '/' + result.arch + "/reports/modules2statics.txt";
            },
            ifInProgress: function() {
                return null;
            }
        },
        {
            // This config produce multiple labels
            // iterateItem - will be added from result to a config
            name: "SA failures",
            key: "static_checks_failures",
            glyphicon: "glyphicon-alert",
            getUrl: function (ib, result) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/ib-static-analysis/"
                    + getCurrentIbTag(ib) + '/' + result.arch + "/" + this.iterateItem;
            },
            ifInProgress: function() { return null ; },
            ifFound: function (ib, result) {
                return {
                    name: this.name,
                    glyphicon: this.glyphicon,
                    url: this.getUrl(ib, result)
                };
            }
        },
        {
            name: "SA thread unsafe EventSetup products",
            key: "static_checks_v2",
            getUrl: function (ib, result) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/ib-static-analysis/"
                    + getCurrentIbTag(ib) + '/' + result.arch + "/reports/tlf2esd.txt";
            },
            ifInProgress: function() {
                return null;
            }
        },
        {
            name: "SA EventSetupRecord::get called",
            key: "static_checks_v2",
            getUrl: function (ib, result) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/ib-static-analysis/"
                    + getCurrentIbTag(ib) + '/' + result.arch + "/reports/eventsetuprecord-get.yaml";
            },
            ifInProgress: function() {
                return null;
            }
        },
        {
            // NOTE JSON usually empty
            glyphicon: "glyphicon-warning-sign",
            key: "RVExceptions",
            name: "Relvals Exceptions Summary",
            getUrl: function (ib) {
                return "http://cms-sw.github.io/relvalsExceptions.html#" + getCurrentIbTag(ib);
            }
        },
        {
            name: "Material budget",
            key: "material_budget_v2",
            getUrl: function (ib, result) {
                return "/SDT/jenkins-artifacts/material-budget/" + getCurrentIbTag(ib) + '/' + result.arch;
            }
        },
        {
            name: "Material budget comparison",
            key: "material_budget_comparison",
            glyphicon: "glyphicon-ok-sign",
            glyphiconWarning: "glyphicon-warning-sign",
            getUrl: function (ib, result) {
                return "/SDT/jenkins-artifacts/material-budget/" + getCurrentIbTag(ib) + '/' + result.arch + "/comparison";
            },
            ifFound: function(ib, result) {
                const results = result.results;
                if (results === "ok") {
                    return {
                        name: this.name,
                        glyphicon: this.glyphicon,
                        url: this.getUrl(ib, result)
                    };
                } else {
                    return {
                        name: this.name,
                        glyphicon: this.glyphiconWarning,
                        url: this.getUrl(ib, result)
                    };
                }
            }
        },
        {
            name: "Header consistency",
            key: "check-headers",
            getUrl: function (ib) {
                return "https://cmssdt.cern.ch/SDT/jenkins-artifacts/check_headers/" + getCurrentIbTag(ib);
            },
            ifError: function(ib, result) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-remove",
                    url:  this.getUrl(ib),
                    labelColor: "red"
            }}
        },
        {
            name: "FWLite",
            key: "fwlite",
            getUrl: function (ib) {
                let file = ib.fwlite[0].file;
                if (file === 'not-ready' || file === undefined ) {
                    // return nothing
                } else {
                    const si = 4;
                    let link_parts = file.split('/');
                    link_parts = link_parts.slice(si, si + 5);
                    return urls.fwliteUrl + link_parts.join('/');
                }
            },
            customResultInterpretation: (result) => {
                if ( _.isEmpty(result)) {
                    return STATUS_ENUM.not_found
                }
                // the assumption here is that result is a list of object which can only have 1 element
                // (originally this field was used in the table)
                let result_element = result[0];
                if (result_element.passed === STATUS_ENUM.passed){
                    return STATUS_ENUM.passed;
                }
                let labelelType = checkLabelType(showLabelConfig.fwlite, result_element.details);
                switch (labelelType.colorType) {
                    case "danger" :
                        return STATUS_ENUM.error;
                    default:
                        return labelelType.colorType // should be success | warning
                }
            },
            ifFound: function(ib, result) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-ok",
                    url:  this.getUrl(ib),
                };
            },
            ifError: function(ib, result) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-remove",
                    url:  this.getUrl(ib),
                    labelColor: "red"
                };
            },
            ifWarning: function (ib) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-warning-sign",
                    url: this.getUrl(ib),
                    labelColor: "orange"
                };
            },

        },
        {
            name: "GPU unit tests",
            key: "gpu_utests",
            getUrl: function (ib) {
                return getBuildOrUnitUrl(ib, 'gpu_utests', '?gpu_utests')
            },
            customResultInterpretation: function(result) {
                if ( _.isEmpty(result)) {
                    return STATUS_ENUM.not_found
                }
                // the assumption here is that result is a list of object which can only have 1 element
                // (originally this field was used in the table)
                let result_element = result[0];
                if (result_element.passed === STATUS_ENUM.passed){
                    return STATUS_ENUM.passed;
                }
                let labelelType = checkLabelType(showLabelConfig.gpu, result_element.details);
                switch (labelelType.colorType) {
                    case "danger" :
                        return STATUS_ENUM.error;
                    default:
                        return labelelType.colorType // should be success | warning
                }
            },
            ifFound: function(ib, result) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-ok",
                    url:  this.getUrl(ib),
                };
            },
            ifError: function(ib, result) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-remove",
                    url:  this.getUrl(ib),
                    labelColor: "red"
                };
            },
            ifWarning: function (ib) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-warning-sign",
                    url: this.getUrl(ib),
                    labelColor: "orange"
                };
            }
        },
        {
            name: "Python3",
            key: "python3_tests",
            getUrl: function (ib) {
                return getBuildOrUnitUrl(ib, 'python3_tests', '?python3')
            },
            customResultInterpretation: function(result) {
                if ( _.isEmpty(result)) {
                    return STATUS_ENUM.not_found
                }
                // the assumption here is that result is a list of object which can only have 1 element
                // (originally this field was used in the table)
                let result_element = result[0];
                if (result_element.passed === STATUS_ENUM.passed){
                    return STATUS_ENUM.passed;
                }
                let labelelType = checkLabelType(showLabelConfig.gpu, result_element.details);
                switch (labelelType.colorType) {
                    case "danger" :
                        return STATUS_ENUM.error;
                    default:
                        return labelelType.colorType // should be success | warning
                }
            },
            ifFound: function(ib, result) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-ok",
                    url:  this.getUrl(ib),
                };
            },
            ifError: function(ib, result) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-remove",
                    url:  this.getUrl(ib),
                    labelColor: "red"
                };
            },
            ifWarning: function (ib) {
                return {
                    name: this.name,
                    glyphicon: "glyphicon-warning-sign",
                    // url: this.getUrl(ib),
                    labelColor: "orange"
                };
            }
        }
    ]
};
