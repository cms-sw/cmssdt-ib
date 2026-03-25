import React, {
  createContext,
  useReducer,
  useContext,
  useEffect,
} from "react";

import { getMultipleFiles } from "../Utils/ajax";
import * as config from "../relValConfig";
import {
  getStructureFromAvalableRelVals,
  relValStatistics,
  transforListToObject,
} from "../Utils/processing";

const { urls } = config;

// -----------------------------
// Initial State
// -----------------------------
const initialState = {
  structure: {},
};

// -----------------------------
// Action Types
// -----------------------------
const RelValActionTypes = {
  SET_STRUCTURE: "SET_STRUCTURE",
  UPDATE_QUE_DATA: "UPDATE_QUE_DATA",
};

// -----------------------------
// Reducer
// -----------------------------
function relValReducer(state, action) {
  switch (action.type) {
    case RelValActionTypes.SET_STRUCTURE:
      return {
        ...state,
        structure: action.payload,
      };

    case RelValActionTypes.UPDATE_QUE_DATA: {
      const { date, que, updatedData } = action.payload;
      return {
        ...state,
        structure: {
          ...state.structure,
          [date]: {
            ...state.structure[date],
            [que]: updatedData,
          },
        },
      };
    }

    default:
      return state;
  }
}

// -----------------------------
// Context
// -----------------------------
const RelValContext = createContext(null);

// -----------------------------
// Provider
// -----------------------------
export function RelValProvider({ children }) {
  const [state, dispatch] = useReducer(relValReducer, initialState);

  // Load initial RelVal structure
  useEffect(() => {
    getMultipleFiles({
      fileUrlList: [urls.RelvalsAvailableResults],
      onSuccessCallback: (responseList) => {
        const relvalsAvailableResults = responseList[0]?.data || {};
        const structure = getStructureFromAvalableRelVals(
          relvalsAvailableResults
        );
        dispatch({
          type: RelValActionTypes.SET_STRUCTURE,
          payload: structure,
        });
      },
    });
  }, []);

  // -----------------------------
  // Selectors
  // -----------------------------
  const getQueData = ({ date, que }) => state.structure?.[date]?.[que];

  const getAllArchsForQue = ({ date, que }) =>
    getQueData({ date, que })?.allArchs || [];

  const getAllGPUsForQue = ({ date, que }) =>
    getQueData({ date, que })?.allGPUs || [];

  const getAllOthersForQue = ({ date, que }) =>
    getQueData({ date, que })?.allOthers || [];

  const getAllFlavorsForQue = ({ date, que }) => {
    const flavors = getQueData({ date, que })?.flavors;
    return flavors ? Object.keys(flavors).sort().reverse() : [];
  };

  // -----------------------------
  // Fetch RelVal results for a queue
  // -----------------------------
  const fetchQueData = ({ date, que }) => {
    const queInfo = getQueData({ date, que });

    // Already loaded → do nothing
    if (!queInfo || queInfo.dataLoaded) {
      return;
    }

    // Collect all entries to load
    const entriesToLoad = [];

    Object.keys(queInfo.flavors || {}).forEach((flavor) => {
      Object.keys(queInfo.flavors[flavor] || {}).forEach((arch) => {
        Object.keys(queInfo.flavors[flavor][arch] || {}).forEach((type) => {
          Object.keys(queInfo.flavors[flavor][arch][type] || {}).forEach(
            (name) => {
              entriesToLoad.push({
                date,
                que,
                flavor,
                arch,
                type,
                name,
              });
            }
          );
        });
      });
    });

    if (entriesToLoad.length === 0) {
      dispatch({
        type: RelValActionTypes.UPDATE_QUE_DATA,
        payload: {
          date,
          que,
          updatedData: { ...queInfo, dataLoaded: true },
        },
      });
      return;
    }

    const relValsUrls = entriesToLoad.map((i) =>
      urls.relValsResult(i.arch, i.date, i.que, i.flavor, i.type, i.name)
    );

    const workflowUrls = entriesToLoad.map((i) =>
      urls.relValWorkFlowToIdHash(
        i.arch,
        i.date,
        i.que,
        i.flavor,
        i.type,
        i.name
      )
    );

    getMultipleFiles({
      fileUrlList: [...relValsUrls, ...workflowUrls],
      onSuccessCallback: (responseList) => {
        const updatedQueInfo = {
          ...queInfo,
          relvalStatus: {},
        };

        const allRelValIdMap = {};

        entriesToLoad.forEach((entry, index) => {
          const relValsResp = responseList[index];
          const wfHashResp =
            responseList[index + entriesToLoad.length];

          if (!relValsResp || !wfHashResp) return;

          const relVals = relValsResp.data || [];
          const workflowHashes = wfHashResp.data || {};

          const relValObj = transforListToObject(relVals);

          // Attach workflow hashes
          Object.values(relValObj).forEach((rv) => {
            if (!rv?.steps) return;
            rv.steps.forEach((step, idx) => {
              step.workflowHash =
                workflowHashes[`${rv.id}-${idx + 1}`];
            });
          });

          // Store relvals
          updatedQueInfo.flavors[entry.flavor][entry.arch][entry.type][
            entry.name
          ] = relValObj;

          // Compute statistics
          const relValList = Object.values(relValObj);
          const stats = relValStatistics(relValList);

          if (!updatedQueInfo.relvalStatus[entry.flavor])
            updatedQueInfo.relvalStatus[entry.flavor] = {};
          if (!updatedQueInfo.relvalStatus[entry.flavor][entry.arch])
            updatedQueInfo.relvalStatus[entry.flavor][entry.arch] = {};
          if (
            !updatedQueInfo.relvalStatus[entry.flavor][entry.arch][entry.type]
          )
            updatedQueInfo.relvalStatus[entry.flavor][entry.arch][
              entry.type
            ] = {};

          updatedQueInfo.relvalStatus[entry.flavor][entry.arch][
            entry.type
          ][entry.name] = stats;

          // Collect relval list
          relValList.forEach((rv) => {
            allRelValIdMap[rv.id] = {
              id: rv.id,
              passed: rv.exitcode === 0,
              cmdName: rv.name,
            };
          });
        });

        updatedQueInfo.allRelvals = Object.keys(allRelValIdMap)
          .sort((a, b) => Number(a) - Number(b))
          .map((id, index) => ({
            ...allRelValIdMap[id],
            index: index + 1,
          }));

        updatedQueInfo.dataLoaded = true;

        dispatch({
          type: RelValActionTypes.UPDATE_QUE_DATA,
          payload: { date, que, updatedData: updatedQueInfo },
        });
      },
    });
  };

  // -----------------------------
  // Provider value
  // -----------------------------
  const value = {
    state,
    getQueData,
    getAllArchsForQue,
    getAllGPUsForQue,
    getAllOthersForQue,
    getAllFlavorsForQue,
    fetchQueData,
  };

  return (
    <RelValContext.Provider value={value}>
      {children}
    </RelValContext.Provider>
  );
}

// -----------------------------
// Hook
// -----------------------------
export function useRelVal() {
  return useContext(RelValContext);
}
