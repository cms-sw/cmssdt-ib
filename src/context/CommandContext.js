import React, { createContext, useReducer, useContext } from "react";
import { getMultipleFiles } from "../Utils/ajax";
import * as config from "../relValConfig";

const { urls } = config;

// -----------------------------
// Action Types
// -----------------------------
export const CommandActionTypes = {
  SET_COMMANDS: "SET_COMMANDS",
};

// -----------------------------
// Initial State
// -----------------------------
const initialState = {
  commandMap: {},
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
// Provider
// -----------------------------
export function CommandProvider({ children }) {
  const [state, dispatch] = useReducer(commandReducer, initialState);

  // Function to fetch commands and return promise
  const fetchCommands = async (hashCodeList) => {
    if (!hashCodeList || hashCodeList.length === 0) {
      return {};
    }

    console.log(' Fetching commands for hashes:', hashCodeList);
    
    return new Promise((resolve) => {
      const cmdUrlList = hashCodeList.map((i) => {
        const digit1 = i.charAt(0);
        const digitRest = i.substring(1);
        return urls.relValCmd(digit1, digitRest);
      });

      getMultipleFiles({
        fileUrlList: cmdUrlList,
        onSuccessCallback: (responseList) => {
          const newCommands = {};
          for (let i = 0; i < hashCodeList.length; i++) {
            if (!responseList[i]) {
              console.warn(`CommandContext: responseList[${i}] is null for hash ${hashCodeList[i]}`);
              newCommands[hashCodeList[i]] = {}; // Empty object instead of skipping
              continue;
            }
            const workflow = responseList[i]?.data || {};
            newCommands[hashCodeList[i]] = workflow;
          }
          
          console.log(' Fetched commands:', Object.keys(newCommands).length);
          dispatch({ type: CommandActionTypes.SET_COMMANDS, payload: newCommands });
          resolve(newCommands);
        },
        onErrorCallback: (error) => {
          console.error('❌ Failed to fetch commands:', error);
          // Return empty objects on error
          const emptyCommands = {};
          hashCodeList.forEach(hash => {
            emptyCommands[hash] = {};
          });
          resolve(emptyCommands);
        }
      });
    });
  };

  // Function to get workflow list (synchronous - returns cached, triggers fetch for missing)
  const getWorkFlowList = (hashCodeList, callback) => {
    if (!hashCodeList || !Array.isArray(hashCodeList)) {
      return [];
    }

    let loadedCmd = [];
    let notLoadedCmd = [];

    for (let i = 0; i < hashCodeList.length; i++) {
      const hashcode = hashCodeList[i];
      if (!hashcode) {
        loadedCmd[i] = {}; // placeholder
      } else if (!(hashcode in state.commandMap)) {
        notLoadedCmd.push(hashcode);
        loadedCmd[i] = {}; // Return empty object instead of index
      } else {
        loadedCmd[i] = state.commandMap[hashcode];
      }
    }

    // Fetch missing commands in background
    if (notLoadedCmd.length > 0) {
      console.log('🔄 Fetching missing commands:', notLoadedCmd);
      
      const cmdUrlList = notLoadedCmd.map((i) => {
        const digit1 = i.charAt(0);
        const digitRest = i.substring(1);
        return urls.relValCmd(digit1, digitRest);
      });

      getMultipleFiles({
        fileUrlList: cmdUrlList,
        onSuccessCallback: (responseList) => {
          const newCommands = {};
          for (let i = 0; i < notLoadedCmd.length; i++) {
            if (!responseList[i]) {
              console.warn(`CommandContext: responseList[${i}] is null for hash ${notLoadedCmd[i]}`);
              newCommands[notLoadedCmd[i]] = {}; // Empty object instead of skipping
              continue;
            }
            const workflow = responseList[i]?.data || {};
            newCommands[notLoadedCmd[i]] = workflow;
          }
          
          dispatch({ type: CommandActionTypes.SET_COMMANDS, payload: newCommands });
          
          // If callback is provided, call it with updated commands
          if (callback && typeof callback === 'function') {
            // Reconstruct the full list with newly loaded commands
            const updatedList = hashCodeList.map(hash => 
              newCommands[hash] || state.commandMap[hash] || {}
            );
            callback(updatedList);
          }
        },
        onErrorCallback: (error) => {
          console.error('❌ Failed to fetch commands:', error);
          // Still call callback with empty objects on error
          if (callback && typeof callback === 'function') {
            const updatedList = hashCodeList.map(() => ({}));
            callback(updatedList);
          }
        }
      });
    }

    return loadedCmd;
  };

  // Async version that returns a promise with all commands
  const getWorkFlowListAsync = async (hashCodeList) => {
    if (!hashCodeList || !Array.isArray(hashCodeList)) {
      return [];
    }

    const missingHashes = hashCodeList.filter(hash => 
      hash && !state.commandMap[hash]
    );

    if (missingHashes.length > 0) {
      await fetchCommands(missingHashes);
    }

    return hashCodeList.map(hash => 
      hash ? state.commandMap[hash] || {} : {}
    );
  };

  const getWorkFlow = (hashcode) => {
    const result = getWorkFlowList([hashcode]);
    return result[0] || {};
  };

  return (
    <CommandContext.Provider 
      value={{ 
        state, 
        getWorkFlowList, 
        getWorkFlowListAsync,
        getWorkFlow, 
        fetchCommands 
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}

// -----------------------------
// Custom Hook
// -----------------------------
export function useCommand() {
  const context = useContext(CommandContext);
  if (!context) {
    console.error("❌ useCommand must be used within a CommandProvider");
    // Return dummy implementation to prevent crashes
    return {
      state: { commandMap: {} },
      getWorkFlowList: () => [],
      getWorkFlowListAsync: async () => [],
      getWorkFlow: () => ({}),
      fetchCommands: async () => ({})
    };
  }
  return context;
}