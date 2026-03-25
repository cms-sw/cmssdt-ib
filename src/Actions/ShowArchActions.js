// ShowArchActions.js
import { useShowArch, ShowArchActionTypes } from "../context/ShowArchContext";

// ✅ Custom hook
export function useShowArchActions() {
  const { state, dispatch } = useShowArch();

  const loadArchs = (archList) => {
    dispatch({ type: ShowArchActionTypes.LOAD_ARCHS, payload: archList });
  };

  const toggleArch = (id) => {
    dispatch({ type: ShowArchActionTypes.TOGGLE_ARCH, id });
  };

  const setActiveArchs = (values, field, releaseQue) => {
    dispatch({
      type: ShowArchActionTypes.SET_ACTIVE_ARCHS,
      values: { activeValues: values, field, releaseQue },
    });
  };

  return {
    state,
    loadArchs,
    toggleArch,
    setActiveArchs,
  };
}
