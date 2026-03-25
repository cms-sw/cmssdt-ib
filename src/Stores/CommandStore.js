import React, { createContext, useReducer, useContext } from "react";
import { getMultipleFiles } from "../Utils/ajax";
import * as config from "../relValConfig";

const { urls } = config;

// -----------------------------
// Initial State
// -----------------------------
const initialState = {
  commandMap: {}, // maps hashCode to workflow data
};

// -----------------------------
// Action Types
// -----------------------------
const CommandActionTypes = {
  SET_COMMANDS: "SET_COMMANDS",
};

// -----------------------------
// Reducer
// -----------------------------
function commandReducer(state, action) {
  switch (action.type) {
    case CommandActionTypes.SET_COMMANDS:
      return {
        ...state,
        commandMap: { ...state.commandMap, ...action.payload },
      };
    default:
      return state;
  }
}

// -----------------------------
// Context
// -----------------------------
const CommandContext = createContext();

// -----------------------------
// Provider Component
// -----------------------------
export function CommandProvider({ children }) {
  const [state, dispatch] = useReducer(commandReducer, initialState);

  // -----------------------------
  // Methods 
  // -----------------------------
  const _getData = (hashCodeList) => {
    const cmdUrlList = hashCodeList.map((i) => {
      const digit1 = i.charAt(0);
      const digitRest = i.substring(1);
      return urls.relValCmd(digit1, digitRest);
    });

    getMultipleFiles({
      fileUrlList: cmdUrlList,
      onSuccessCallback: function (responseList) {
        const newCommands = {};
        for (let i = 0; i < hashCodeList.length; i++) {
          if (!responseList[i]) {
            console.warn(`CommandContext: responseList[${i}] is null`);
            continue;
          }
          newCommands[hashCodeList[i]] = responseList[i].data;
        }
        dispatch({ type: CommandActionTypes.SET_COMMANDS, payload: newCommands });
      },
    });
  };

  const getWorkFlowList = (hashCodeList) => {
    const loadedCmd = [];
    const notLoadedCmd = [];

    for (let i = 0; i < hashCodeList.length; i++) {
      const hashcode = hashCodeList[i];
      if (!hashcode) {
        loadedCmd[i] = {};
      } else if (!(hashcode in state.commandMap)) {
        notLoadedCmd.push(hashcode);
        loadedCmd[i] = i;
      } else {
        loadedCmd[i] = state.commandMap[hashcode];
      }
    }

    if (notLoadedCmd.length > 0) {
      _getData(notLoadedCmd);
    }

    return loadedCmd;
  };

  const getWorkFlow = (hashcode) => getWorkFlowList([hashcode])[0];

  return (
    <CommandContext.Provider
      value={{ state, getWorkFlowList, getWorkFlow }}
    >
      {children}
    </CommandContext.Provider>
  );
}

// -----------------------------
// Custom Hook
// -----------------------------
export function useCommand() {
  return useContext(CommandContext);
}
