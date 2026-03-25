import React, { createContext, useReducer, useContext, useEffect } from "react";
import { getMultipleFiles } from "../Utils/ajax";
import * as config from "../relValConfig";

const { urls } = config;

// -----------------------------
// Initial State
// -----------------------------
const initialState = {
  exitCodes: {}, // maps exitCode -> name
};

// -----------------------------
// Action Types
// -----------------------------
const ExitCodeActionTypes = {
  SET_EXIT_CODES: "SET_EXIT_CODES",
};

// -----------------------------
// Reducer
// -----------------------------
function exitCodeReducer(state, action) {
  switch (action.type) {
    case ExitCodeActionTypes.SET_EXIT_CODES:
      return { ...state, exitCodes: action.payload };
    default:
      return state;
  }
}

// -----------------------------
// Context
// -----------------------------
const ExitCodeContext = createContext();

// -----------------------------
// Provider Component
// -----------------------------
export function ExitCodeProvider({ children }) {
  const [state, dispatch] = useReducer(exitCodeReducer, initialState);

  // Fetch exit codes once on mount
  useEffect(() => {
    console.log(" Loading exit codes from:", urls.exitcodes);
    
    getMultipleFiles({
      fileUrlList: [urls.exitcodes],
      onSuccessCallback: function (responseList) {
        console.log(" Exit codes response:", responseList);
        const exitCodes = responseList[0]?.data || {};
        dispatch({ type: ExitCodeActionTypes.SET_EXIT_CODES, payload: exitCodes });
      },
      onErrorCallback: function (error) {
        console.error("❌ Failed to load exit codes:", error);
      }
    });
  }, []);

  // Method to get exit code name
  const getExitCodeName = (exitCode) => {
    if (exitCode === 0 || exitCode === "0") return "Passed";
    if (!exitCode && exitCode !== 0) return "Unknown";
    
    // Handle both string and number keys
    const codeStr = String(exitCode);
    return state.exitCodes[codeStr] || state.exitCodes[exitCode] || `Error ${exitCode}`;
  };

  return (
    <ExitCodeContext.Provider value={{ state, getExitCodeName }}>
      {children}
    </ExitCodeContext.Provider>
  );
}

// -----------------------------
// Custom Hook
// -----------------------------
export function useExitCode() {
  const context = useContext(ExitCodeContext);
  if (!context) {
    console.error("❌ useExitCode must be used within an ExitCodeProvider");
    // Return dummy implementation to prevent crashes
    return {
      state: { exitCodes: {} },
      getExitCodeName: (code) => {
        if (code === 0) return "Passed";
        return `Error ${code}`;
      }
    };
  }
  return context;
}