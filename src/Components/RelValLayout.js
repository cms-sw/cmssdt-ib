import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import queryString from 'query-string';

import RelValNavigation from "./RelValComponents/RelValNavigation";
import TogglesShowRow from "./TogglesShowRow";
import ResultTableWithSteps from "./RelValComponents/ResultTableWithSteps";
import { useRelVal } from "../Stores/RelValStore";
import { filterRelValStructure } from "../Utils/processing";
import { goToLinkWithoutHistoryUpdate, partiallyUpdateLocationQuery } from "../Utils/commons";
import { STATUS_ENUM, STATUS_ENUM_LIST } from "../relValConfig";

const NAV_CONTROLS_ENUM = {
  SELECTED_ARCHS: "selectedArchs",
  SELECTED_FLAVORS: "selectedFlavors",
  SELECTED_STATUS: "selectedStatus",
  SELECTED_GPUS: "selectedGPUs",
  SELECTED_OTHERS: "selectedOthers",
  SELECTED_FILTER_STATUS: "selectedFilterStatus"
};

// ----- Helpers to preserve React16 query parsing behavior -----
function normalizeSingleOrEmpty(val) {
  // React16 behavior:
  // - if missing => ""
  // - if array => remove "", then:
  //     len 0 => ""
  //     len 1 => string
  //     len >1 => array (can happen)
  // - if string => string
  if (val == null) return "";
  if (typeof val === "string") return val;

  if (Array.isArray(val)) {
    const filtered = val.filter((x) => x !== "");
    if (filtered.length === 0) return "";
    if (filtered.length === 1) return filtered[0];
    return filtered;
  }

  return "";
}

function normalizeMaybeArray(val) {
  // For archs/flavors/status/filterStatus React16 accepted string or array.
  // We keep what query-string returns (string|array|undefined), but normalize undefined to [] for TogglesShowRow.
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return [val];
  return [];
}

const RelValLayout = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [navigationHeight, setNavigationHeight] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { state, fetchQueData, isLoading } = useRelVal();

  // Extract data for current queue
  const queData = state?.structure?.[params?.date]?.[params?.que] || {};
  const allArchs = queData?.allArchs || [];
  const allGPUs = queData?.allGPUs || [];
  const allOthers = queData?.allOthers || [];
  const allFlavors = queData?.flavors ? Object.keys(queData.flavors).sort().reverse() : [];

  // -----------------------------
  // Fetch data when params change
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setDataLoaded(false);
      if (params?.date && params?.que) {
        await fetchQueData({ date: params.date, que: params.que });
        if (!cancelled) setDataLoaded(true);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [params?.date, params?.que, fetchQueData]);

  // -----------------------------
  // Parse query params 
  // -----------------------------
  const parsedQuery = useMemo(() => queryString.parse(location.search), [location.search]);

  let selectedArchs = useMemo(
    () => normalizeMaybeArray(parsedQuery[NAV_CONTROLS_ENUM.SELECTED_ARCHS]),
    [parsedQuery]
  );

  let selectedFlavors = useMemo(
    () => normalizeMaybeArray(parsedQuery[NAV_CONTROLS_ENUM.SELECTED_FLAVORS]),
    [parsedQuery]
  );

  let selectedStatus = useMemo(
    () => normalizeMaybeArray(parsedQuery[NAV_CONTROLS_ENUM.SELECTED_STATUS]),
    [parsedQuery]
  );

  let selectedFilterStatus = useMemo(
    () => normalizeMaybeArray(parsedQuery[NAV_CONTROLS_ENUM.SELECTED_FILTER_STATUS]),
    [parsedQuery]
  );

  // special handling for GPUs/Others
  let selectedGPUs = useMemo(
    () => normalizeSingleOrEmpty(parsedQuery[NAV_CONTROLS_ENUM.SELECTED_GPUS]),
    [parsedQuery]
  );

  let selectedOthers = useMemo(
    () => normalizeSingleOrEmpty(parsedQuery[NAV_CONTROLS_ENUM.SELECTED_OTHERS]),
    [parsedQuery]
  );

  // -----------------------------
  // behavior: if URL has no query, set defaults
  // Only do this once data is available.
  // -----------------------------
  useEffect(() => {
    if (!params?.date || !params?.que) return;
    if (!queData || Object.keys(queData).length === 0) return;

    // did this when location.search === ""
    if (location.search === "") {
      const newLoc = { ...location }; // partiallyUpdateLocationQuery mutates
      partiallyUpdateLocationQuery(newLoc, NAV_CONTROLS_ENUM.SELECTED_ARCHS, allArchs);
      partiallyUpdateLocationQuery(newLoc, NAV_CONTROLS_ENUM.SELECTED_GPUS, allGPUs);
      partiallyUpdateLocationQuery(newLoc, NAV_CONTROLS_ENUM.SELECTED_OTHERS, allOthers);
      partiallyUpdateLocationQuery(newLoc, NAV_CONTROLS_ENUM.SELECTED_FLAVORS, allFlavors);
      partiallyUpdateLocationQuery(newLoc, NAV_CONTROLS_ENUM.SELECTED_STATUS, [STATUS_ENUM.FAILED]);

      goToLinkWithoutHistoryUpdate(
        navigate,
        newLoc.pathname + (newLoc.search ? `?${newLoc.search}` : "")
      );
    }
  }, [
    location,
    navigate,
    params?.date,
    params?.que,
    queData,
    allArchs,
    allGPUs,
    allOthers,
    allFlavors
  ]);

  // -----------------------------
  // Update URL helper 
  // -----------------------------
  const updateUrlParam = useCallback((param, values) => {
    const newLocation = partiallyUpdateLocationQuery(location, param, values);
    goToLinkWithoutHistoryUpdate(
      navigate,
      newLocation.pathname + (newLocation.search ? `?${newLocation.search}` : "")
    );
  }, [location, navigate]);

  // -----------------------------
  // Controls 
  // -----------------------------
  const controlList = useMemo(() => ([
    <TogglesShowRow
      key="flavors"
      rowName="Flavors"
      nameList={allFlavors}
      initSelections={selectedFlavors}
      callbackToParent={(v) => updateUrlParam(NAV_CONTROLS_ENUM.SELECTED_FLAVORS, v)}
    />,
    <TogglesShowRow
      key="archs"
      rowName="Architectures"
      nameList={allArchs}
      initSelections={selectedArchs}
      callbackToParent={(v) => updateUrlParam(NAV_CONTROLS_ENUM.SELECTED_ARCHS, v)}
    />,
    allGPUs.length > 0 && (
      <TogglesShowRow
        key="gpus"
        rowName="GPUs"
        nameList={allGPUs}
        initSelections={selectedGPUs}
        callbackToParent={(v) => updateUrlParam(NAV_CONTROLS_ENUM.SELECTED_GPUS, v)}
      />
    ),
    allOthers.length > 0 && (
      <TogglesShowRow
        key="others"
        rowName="Others"
        nameList={allOthers}
        initSelections={selectedOthers}
        callbackToParent={(v) => updateUrlParam(NAV_CONTROLS_ENUM.SELECTED_OTHERS, v)}
      />
    ),
    <TogglesShowRow
      key="status"
      rowName="Status"
      nameList={STATUS_ENUM_LIST}
      initSelections={selectedStatus}
      callbackToParent={(v) => updateUrlParam(NAV_CONTROLS_ENUM.SELECTED_STATUS, v)}
    />,
    <TogglesShowRow
      key="filter"
      rowName="Column filters"
      nameList={['On']}
      initSelections={selectedFilterStatus}
      callbackToParent={(v) => updateUrlParam(NAV_CONTROLS_ENUM.SELECTED_FILTER_STATUS, v)}
    />
  ].filter(Boolean)), [
    allFlavors,
    allArchs,
    allGPUs,
    allOthers,
    selectedFlavors,
    selectedArchs,
    selectedGPUs,
    selectedOthers,
    selectedStatus,
    selectedFilterStatus,
    updateUrlParam
  ]);

  // -----------------------------
  // Filter RelVals 
  // -----------------------------
  const filteredData = useMemo(() => {
    if (!queData || Object.keys(queData).length === 0) return [];

    return filterRelValStructure({
      structure: queData,
      selectedArchs,
      selectedGPUs,
      selectedOthers,
      selectedFlavors,
      selectedStatus
    });
  }, [queData, selectedArchs, selectedGPUs, selectedOthers, selectedFlavors, selectedStatus]);

  // -----------------------------
  // Navigation height
  // -----------------------------
  const getNavigationHeight = useCallback(() => {
    const nav = document.getElementById('relval-navigation');
    if (nav) setNavigationHeight(nav.clientHeight);
  }, []);

  useEffect(() => {
    setTimeout(getNavigationHeight, 100);
    window.addEventListener('resize', getNavigationHeight);
    return () => window.removeEventListener('resize', getNavigationHeight);
  }, [getNavigationHeight, dataLoaded]);

  const getTopPadding = () => navigationHeight + 20;
  const getSizeForTable = () => document.documentElement.clientHeight - getTopPadding() - 20;

  // Result table props
  const resultTableWithStepsSettings = useMemo(() => ({
    style: { height: getSizeForTable(), overflow: 'auto' },
    allArchs,
    allGPUs,
    allOthers,
    allFlavors,
    selectedArchs,
    selectedGPUs,
    selectedOthers,
    selectedFlavors,
    selectedStatus,
    structure: queData,
    selectedFilterStatus,
    ibDate: params.date,
    ibQue: params.que,
    filteredRelVals: filteredData
  }), [
    allArchs,
    allGPUs,
    allOthers,
    allFlavors,
    selectedArchs,
    selectedGPUs,
    selectedOthers,
    selectedFlavors,
    selectedStatus,
    queData,
    selectedFilterStatus,
    params.date,
    params.que,
    filteredData
  ]);

  // Loading state
  if (isLoading && !dataLoaded) {
    return (
      <div style={{
        paddingTop: getTopPadding(),
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 50,
        textAlign: 'center'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: 20 }}>Loading RelVal data...</p>
      </div>
    );
  }

  // No data state
  if (!queData || Object.keys(queData).length === 0) {
    return (
      <div style={{
        paddingTop: getTopPadding(),
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 50,
        textAlign: 'center'
      }}>
        <h3>No data available</h3>
        <p>Could not load data for {params.que} on {params.date}</p>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: getTopPadding(),
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: 20,
      width: '100%'
    }}>
      <RelValNavigation
        id="relval-navigation"
        que={params.que}
        relvalInfo={`${params.que} ${params.date}`}
        controlList={controlList}
        onHeightChange={setNavigationHeight}
      />

      {filteredData.length > 0 ? (
        <ResultTableWithSteps {...resultTableWithStepsSettings} />
      ) : (
        <div style={{
          textAlign: 'center',
          paddingTop: 40,
          paddingBottom: 40,
          paddingLeft: 20,
          paddingRight: 20,
          background: '#f8f9fa',
          margin: '20px',
          borderRadius: '8px'
        }}>
          <h5>No matching information found</h5>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default RelValLayout;