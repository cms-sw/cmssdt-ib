import React, { useState, useCallback, useMemo } from "react";
import { useTable, useExpanded, useFilters, usePagination } from "react-table";
import { Modal, Button, OverlayTrigger, Popover } from "react-bootstrap";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { v4 as uuidv4 } from "uuid";
import PropTypes from "prop-types";
import { FaEye } from "react-icons/fa";

import * as config from "../../relValConfig";
import { LABEL_COLOR, LABELS_TEXT, RELVAL_STATUS_ENUM } from "../../relValConfig";
import { useExitCode } from "../../context/ExitCodeContext";
import { useCommand } from "../../context/CommandContext";
import { useShowArch } from "../../context/ShowArchContext";
import {
  filterNameList,
  getDisplayName,
  getObjectKeys,
  isRelValKnownFailed,
  isRelValTrackedForFailed,
  valueInTheList,
} from "../../Utils/processing";

const { urls } = config;

/* =========================================================
   UI size knobs
   ========================================================= */
const UI_SIZES = {
  tableFont: "0.88rem",
  headerFont: "0.92rem",
  archFont: "0.95rem",
  archPaddingY: 5,
  archPaddingX: 7,
  badgeFont: "0.82rem",
  badgePadY: 4,
  badgePadX: 9,
  workflowFont: "0.88rem",
};

/* =========================================================
   Shared styles
   ========================================================= */
const styles = {
  stickyTableHeader: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    backgroundColor: "#f5f5f5",
    boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
  },
  stickyHeader: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#fff",
  },
};

/* ------------------------------------------------------------------ */
/* Helper functions */
/* ------------------------------------------------------------------ */
const getLogAddress = (arch, ib, step, workflowName, workflowID, wasDASErr, typeKey, nameKey) => {
  const filename = wasDASErr ? "step1_dasquery.log" : `step${step}_${workflowName}.log`;
  return urls.relValLog(arch, ib, workflowID, workflowName, filename, typeKey, nameKey);
};

const getLabelName = (name) => LABELS_TEXT[name] || name;
const getIb = (date, que, flavor) => `${que}_${flavor}_${date}`;
const getReleaseQue = (ibQue) => `${ibQue}_X`;

/* ------------------------------------------------------------------ */
/* Reusable text filter */
/* ------------------------------------------------------------------ */
const ColumnTextFilter = ({ column: { filterValue, setFilter, placeholder = "Filter..." } }) => {
  return (
    <input
      value={filterValue || ""}
      onChange={(e) => setFilter(e.target.value || undefined)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "6px 8px",
        fontSize: "0.82rem",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        outline: "none",
        backgroundColor: "#fff",
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Status Badge Component */
/* ------------------------------------------------------------------ */
const StatusBadge = ({ text, color, onClick, glyphicon }) => {
  const style = {
    backgroundColor: color,
    color: "white",
    padding: `${UI_SIZES.badgePadY}px ${UI_SIZES.badgePadX}px`,
    borderRadius: "6px",
    fontSize: UI_SIZES.badgeFont,
    fontWeight: 700,
    margin: "0 3px",
    display: "inline-flex",
    alignItems: "center",
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    lineHeight: 1.1,
  };

  return (
    <span
      style={style}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {glyphicon && <span style={{ marginRight: "4px", display: "inline-flex", alignItems: "center" }}>{glyphicon}</span>}
      {text}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Architecture Stack Component */
/* ------------------------------------------------------------------ */
const ArchStack = ({ arch, colorScheme }) => {
  const archParts = arch.split("_");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderRadius: "6px",
        overflow: "hidden",
        marginBottom: "6px",
      }}
    >
      {archParts.map((part, idx) => (
        <div
          key={idx}
          style={{
            padding: `${UI_SIZES.archPaddingY}px ${UI_SIZES.archPaddingX}px`,
            backgroundColor: colorScheme[part] || "#6c757d",
            color: "white",
            fontWeight: 800,
            fontSize: UI_SIZES.archFont,
            textAlign: "center",
            lineHeight: 1.15,
            borderBottom: idx < archParts.length - 1 ? "1px solid rgba(255,255,255,0.22)" : "none",
          }}
        >
          {part}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Step Cell Component */
/* ------------------------------------------------------------------ */
const StepCell = ({
  stepNumber,
  status,
  onClick,
  logUrl,
  exitCode,
  errors,
  warnings,
  isKnownFailed = false,
  showTrackedIcon = false,
}) => {
  let bgColor = "#6c757d";
  const glyphicon = showTrackedIcon ? <FaEye size={11} /> : null;

  if (status === RELVAL_STATUS_ENUM.PASSED) {
    if (errors > 0) bgColor = LABEL_COLOR.PASSED_ERRORS_COLOR;
    else if (warnings > 0) bgColor = LABEL_COLOR.PASSED_WARNINGS_COLOR;
    else bgColor = LABEL_COLOR.PASSED_COLOR;
  } else if (status === RELVAL_STATUS_ENUM.FAILED) {
    bgColor = isKnownFailed ? LABEL_COLOR.PASSED_COLOR : LABEL_COLOR.FAILED_COLOR;
  } else if (status === RELVAL_STATUS_ENUM.DAS_ERROR) {
    bgColor = LABEL_COLOR.DAS_ERROR_COLOR;
  } else if (status === RELVAL_STATUS_ENUM.NOTRUN) {
    bgColor = LABEL_COLOR.NOT_RUN_COLOR;
  } else if (status === RELVAL_STATUS_ENUM.TIMEOUT) {
    bgColor = LABEL_COLOR.FAILED_COLOR;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      <StatusBadge text={`Step ${stepNumber}`} color="#6c757d" onClick={onClick} />
      {logUrl ? (
        <a href={logUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <StatusBadge text={exitCode || getLabelName(status)} color={bgColor} glyphicon={glyphicon} />
        </a>
      ) : (
        <StatusBadge text={exitCode || getLabelName(status)} color={bgColor} glyphicon={glyphicon} />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Pagination Component */
/* ------------------------------------------------------------------ */
const buttonStyle = {
  margin: "0 2px",
  padding: "6px 10px",
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 700,
};

const Pagination = ({
  canPreviousPage,
  canNextPage,
  pageOptions,
  pageCount,
  gotoPage,
  nextPage,
  previousPage,
  setPageSize,
  pageIndex,
  pageSize,
  pageSizeOptions = [20, 50, 100, 500, 1000],
}) => {
  const [pageInput, setPageInput] = useState(String(pageIndex + 1));

  React.useEffect(() => {
    setPageInput(String(pageIndex + 1));
  }, [pageIndex]);

  const commitPageInput = () => {
    const numeric = Number(pageInput);

    if (!Number.isFinite(numeric)) {
      setPageInput(String(pageIndex + 1));
      return;
    }

    const safePage = Math.max(1, Math.min(pageCount, Math.trunc(numeric)));
    setPageInput(String(safePage));
    gotoPage(safePage - 1);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
        backgroundColor: "#f5f5f5",
        borderTop: "1px solid #ddd",
        fontSize: "0.9rem",
      }}
    >
      <div>
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} style={buttonStyle}>
          {"<<"}
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage} style={buttonStyle}>
          {"<"}
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage} style={buttonStyle}>
          {">"}
        </button>
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage} style={buttonStyle}>
          {">>"}
        </button>
        <span style={{ marginLeft: "10px" }}>
          Page <strong>{pageIndex + 1}</strong> of <strong>{pageOptions.length}</strong>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span>
          Go to page:{" "}
          <input
            type="number"
            min="1"
            max={pageCount}
            step="1"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={commitPageInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitPageInput();
              }
            }}
            style={{ width: "70px", padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd" }}
          />
        </span>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd" }}
        >
          {pageSizeOptions.map((ps) => (
            <option key={ps} value={ps}>
              Show {ps}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main Component */
/* ------------------------------------------------------------------ */
const ResultTableWithSteps = ({
  filteredRelVals = [],
  selectedArchs = [],
  selectedGPUs = [],
  selectedOthers = [],
  selectedFlavors = [],
  selectedFilterStatus = [],
  structure = { flavors: {} },
  ibDate = "",
  ibQue = "",
  style = {},
  allGPUs = [],
  allArchs = [],
  allOthers = [],
  allFlavors = [],
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalCommands, setModalCommands] = useState([]);
  const [copied, setCopied] = useState(false);

  const { getColorsSchemeForQue } = useShowArch();
  const archColorScheme = getColorsSchemeForQue(getReleaseQue(ibQue));

  const { getExitCodeName } = useExitCode();
  const { getWorkFlowList } = useCommand();

  const doFilterColumn = valueInTheList(selectedFilterStatus, "On");

  const handleClose = useCallback(() => {
    setShowModal(false);
    setCopied(false);
  }, []);

  const handleShow = useCallback(
    async (steps, cmdName) => {
      const hashes = steps.map((s) => s.workflowHash).filter(Boolean);
      setModalTitle(cmdName);

      const initialCommands = getWorkFlowList(hashes);
      setModalCommands(initialCommands);
      setShowModal(true);

      const hasMissing = initialCommands.some((cmd) => !cmd || Object.keys(cmd).length === 0);

      if (hasMissing && hashes.length > 0) {
        getWorkFlowList(hashes, (updatedCommands) => {
          setModalCommands(updatedCommands);
        });
      }
    },
    [getWorkFlowList]
  );

  const columns = useMemo(() => {
    const cols = [
      {
        id: "expander",
        Header: "",
        width: 36,
        disableFilters: true,
        Cell: ({ row }) => (
          <span
            {...row.getToggleRowExpandedProps()}
            style={{
              cursor: "pointer",
              display: "inline-block",
              width: "100%",
              textAlign: "center",
              fontSize: "0.95rem",
              fontWeight: 900,
              userSelect: "none",
            }}
          >
            {row.isExpanded ? "▼" : "▶"}
          </span>
        ),
      },
      {
        Header: "#",
        accessor: (row, i) => i + 1,
        id: "index",
        width: 52,
        disableFilters: true,
        Cell: ({ value }) => <b style={{ fontSize: UI_SIZES.workflowFont }}>{value}</b>,
      },
      {
        Header: "Workflow #",
        accessor: "id",
        width: 110,
        filter: "text",
        disableFilters: !doFilterColumn,
        Filter: (props) =>
          doFilterColumn ? <ColumnTextFilter {...props} placeholder="Search workflow..." /> : null,
        Cell: ({ value, row }) => (
          <OverlayTrigger placement="top" overlay={<Popover id={`popover-${value}`}>{row.original.cmdName}</Popover>}>
            <b style={{ cursor: "help", fontSize: UI_SIZES.workflowFont }}>{value}</b>
          </OverlayTrigger>
        ),
      },
    ];

    if (!structure?.flavors) return cols;

    const flavorKeys = filterNameList(getObjectKeys(structure.flavors).sort().reverse(), selectedFlavors);

    flavorKeys.forEach((flavorKey) => {
      const archKeys = filterNameList(getObjectKeys(structure.flavors[flavorKey]), selectedArchs);

      archKeys.forEach((archKey) => {
        const types = structure.flavors[flavorKey][archKey] || {};

        Object.keys(types).forEach((typeKey) => {
          const typeNames = getObjectKeys(types[typeKey] || {});
          let selectedKeys = [];

          if (typeKey === "gpu") {
            selectedKeys = filterNameList(typeNames, selectedGPUs);
          } else if (typeKey === "other") {
            selectedKeys = filterNameList(typeNames, selectedOthers);
          } else if (selectedGPUs.length === 0) {
            selectedKeys.push("");
          }

          selectedKeys.forEach((nameKey) => {
            const nameData = types[typeKey]?.[nameKey];
            if (!nameData) return;

            let statistics = { passed: 0, known_failed: 0, failed: 0 };

            if (structure.relvalStatus?.[flavorKey]?.[archKey]?.[typeKey]?.[nameKey]) {
              statistics = structure.relvalStatus[flavorKey][archKey][typeKey][nameKey];
            } else {
              Object.values(nameData).forEach((relVal) => {
                if (relVal) {
                  if (isRelValKnownFailed(relVal)) statistics.known_failed += 1;
                  else if (relVal.exitcode !== 0) statistics.failed += 1;
                  else statistics.passed += 1;
                }
              });
            }

            cols.push({
              Header: () => (
                <div style={{ minWidth: "150px" }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "0.92rem",
                      textAlign: "center",
                      marginBottom: "6px",
                      color: "#334155",
                      borderBottom: "1px solid #dee2e6",
                      paddingBottom: "4px",
                    }}
                  >
                    {getDisplayName(flavorKey)}
                  </div>

                  <ArchStack arch={archKey} colorScheme={archColorScheme} />

                  {typeKey !== "" && nameKey !== "" && (
                    <div
                      style={{
                        fontWeight: 900,
                        marginTop: "4px",
                        fontSize: "0.86rem",
                        textAlign: "center",
                        color: typeKey === "gpu" ? "#0ea5e9" : typeKey === "other" ? "#22c55e" : "#6c757d",
                        lineHeight: 1.1,
                      }}
                    >
                      {nameKey}
                      {typeKey === "gpu" && " (GPU)"}
                      {typeKey === "other" && " (Other)"}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      marginTop: "6px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <StatusBadge text={statistics.passed} color={LABEL_COLOR.PASSED_COLOR} />
                    <StatusBadge text={statistics.known_failed} color={LABEL_COLOR.PASSED_ERRORS_COLOR} />
                    <StatusBadge text={statistics.failed} color={LABEL_COLOR.FAILED_COLOR} />
                  </div>
                </div>
              ),
              id: `${flavorKey}-${archKey}-${typeKey}-${nameKey}`,
              accessor: (row) => {
                const data = nameData[row.id];
                if (!data) return null;

                const { steps, exitcode } = data;
                const lastStep = steps[steps.length - 1];
                const { status } = lastStep;

                if (status === RELVAL_STATUS_ENUM.PASSED) return getLabelName(status);
                if (status === RELVAL_STATUS_ENUM.FAILED) return getExitCodeName(exitcode);
                if (status === RELVAL_STATUS_ENUM.DAS_ERROR) return getLabelName(status);
                if (status === RELVAL_STATUS_ENUM.NOTRUN) return getLabelName(status);
                if (status === RELVAL_STATUS_ENUM.TIMEOUT) return getLabelName(status);
                return null;
              },
              filter: "text",
              disableFilters: !doFilterColumn,
              Filter: (props) =>
                doFilterColumn ? <ColumnTextFilter {...props} placeholder="Filter column..." /> : null,
              filterMethod: (rows, id, filterValue) => rows,
              Cell: ({ row }) => {
                const data = nameData[row.original.id];
                if (!data) {
                  return <div style={{ textAlign: "center", padding: "4px" }}>—</div>;
                }

                const ib = getIb(ibDate, ibQue, flavorKey);
                const { steps } = data;
                const stepsToShow = row.isExpanded ? steps : [steps[steps.length - 1]];
                const knownFailed = isRelValKnownFailed(data);
                const trackedForFailed = isRelValTrackedForFailed(data);

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {stepsToShow.map((step, idx) => {
                      const stepNumber = steps.length - (row.isExpanded ? steps.length - idx - 1 : 0);
                      const { status, errors = 0, warnings = 0 } = step;

                      let exitCodeText = null;
                      if (status === RELVAL_STATUS_ENUM.FAILED) {
                        exitCodeText = getExitCodeName(data.exitcode);
                      }

                      return (
                        <StepCell
                          key={idx}
                          stepNumber={stepNumber}
                          status={status}
                          exitCode={exitCodeText}
                          errors={errors}
                          warnings={warnings}
                          isKnownFailed={knownFailed}
                          showTrackedIcon={trackedForFailed}
                          onClick={() => handleShow(steps, data.name)}
                          logUrl={getLogAddress(
                            archKey,
                            ib,
                            stepNumber,
                            data.name,
                            data.id,
                            status === RELVAL_STATUS_ENUM.DAS_ERROR,
                            typeKey,
                            nameKey
                          )}
                        />
                      );
                    })}
                  </div>
                );
              },
            });
          });
        });
      });
    });

    return cols;
  }, [
    structure,
    selectedArchs,
    selectedGPUs,
    selectedOthers,
    selectedFlavors,
    doFilterColumn,
    ibDate,
    ibQue,
    archColorScheme,
    getExitCodeName,
    handleShow,
  ]);

  const defaultColumn = useMemo(
    () => ({
      Filter: (props) =>
        doFilterColumn ? <ColumnTextFilter {...props} placeholder="Filter..." /> : null,
    }),
    [doFilterColumn]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
    visibleColumns,
  } = useTable(
    {
      columns,
      data: filteredRelVals,
      defaultColumn,
      initialState: {
        expanded: {},
        pageSize: 100,
        pageIndex: 0,
      },
      autoResetExpanded: false,
      autoResetFilters: false,
      filterTypes: {
        text: (rows, id, filterValue) => {
          return rows.filter((row) => {
            const rowValue = row.values[id];
            return rowValue !== undefined
              ? String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase())
              : true;
          });
        },
      },
    },
    useFilters,
    useExpanded,
    usePagination
  );

  return (
    <>
      <Modal show={showModal} onHide={handleClose} size="lg" centered scrollable>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalCommands.length > 0 ? (
            modalCommands.map((cmd, index) => {
              if (!cmd || Object.keys(cmd).length === 0) {
                return (
                  <div key={uuidv4()} className="mb-4">
                    <div
                      className="d-flex align-items-center justify-content-between mb-2"
                      style={styles.stickyHeader}
                    >
                      <strong>Step {index + 1}</strong>
                      <Button variant="outline-secondary" size="sm" disabled>
                        Loading...
                      </Button>
                    </div>
                    <pre
                      style={{
                        backgroundColor: "#f8f9fa",
                        padding: "12px",
                        borderRadius: "8px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: "#6c757d",
                        fontStyle: "italic",
                        fontSize: "0.9rem",
                      }}
                    >
                      Loading command...
                    </pre>
                  </div>
                );
              }

              return (
                <div key={uuidv4()} className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong>Step {index + 1}</strong>
                    <CopyToClipboard text={cmd.command || ""} onCopy={() => setCopied(true)}>
                      <Button variant="outline-primary" size="sm">
                        Copy to clipboard
                      </Button>
                    </CopyToClipboard>
                  </div>
                  <pre
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "12px",
                      borderRadius: "8px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "0.9rem",
                    }}
                  >
                    {cmd.command || "No command available"}
                  </pre>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted py-3">No commands available</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <div style={{ ...style, display: "flex", flexDirection: "column" }}>
        <div style={{ overflow: "auto", flex: 1, position: "relative" }}>
          <table
            {...getTableProps()}
            className="table table-bordered table-sm"
            style={{ width: "100%", fontSize: UI_SIZES.tableFont }}
          >
            <thead>
              {headerGroups.map((headerGroup) => {
                const { key, ...headerProps } = headerGroup.getHeaderGroupProps();
                return (
                  <React.Fragment key={key}>
                    <tr {...headerProps}>
                      {headerGroup.headers.map((column) => {
                        const { key: colKey, ...colProps } = column.getHeaderProps();
                        return (
                          <th
                            key={colKey}
                            {...colProps}
                            className="align-middle text-center"
                            style={{
                              padding: "12px 6px",
                              verticalAlign: "middle",
                              backgroundColor: "#f5f5f5",
                              borderBottom: "2px solid #ddd",
                              fontSize: UI_SIZES.headerFont,
                              fontWeight: 900,
                              ...styles.stickyTableHeader,
                              ...colProps.style,
                            }}
                          >
                            {column.render("Header")}
                          </th>
                        );
                      })}
                    </tr>

                    {doFilterColumn && (
                      <tr>
                        {headerGroup.headers.map((column) => (
                          <th
                            key={`filter-${column.id}`}
                            style={{
                              backgroundColor: "#f8fafc",
                              padding: "8px 6px",
                              borderBottom: "1px solid #ddd",
                              verticalAlign: "top",
                            }}
                          >
                            {column.canFilter ? column.render("Filter") : null}
                          </th>
                        ))}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </thead>

            <tbody {...getTableBodyProps()}>
              {page.map((row) => {
                prepareRow(row);
                const { key, ...rowProps } = row.getRowProps();
                return (
                  <tr key={key} {...rowProps}>
                    {row.cells.map((cell) => {
                      const { key: cellKey, ...cellProps } = cell.getCellProps();
                      return (
                        <td
                          key={cellKey}
                          {...cellProps}
                          className="align-middle"
                          style={{
                            padding: "8px 6px",
                            fontSize: UI_SIZES.tableFont,
                            ...cellProps.style,
                          }}
                        >
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {page.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="text-center text-muted py-5">
                    <div className="d-flex flex-column align-items-center">
                      <span style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>🔍 No matching RelVals found</span>
                      <span className="text-muted" style={{ fontSize: "0.95rem" }}>
                        Try adjusting your filters
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredRelVals.length > 0 && (
          <Pagination
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            pageOptions={pageOptions}
            pageCount={pageCount}
            gotoPage={gotoPage}
            nextPage={nextPage}
            previousPage={previousPage}
            setPageSize={setPageSize}
            pageIndex={pageIndex}
            pageSize={pageSize}
            pageSizeOptions={[20, 50, 100, 500, 1000]}
          />
        )}
      </div>
    </>
  );
};

ResultTableWithSteps.propTypes = {
  filteredRelVals: PropTypes.array,
  selectedArchs: PropTypes.array,
  selectedGPUs: PropTypes.array,
  selectedOthers: PropTypes.array,
  selectedFlavors: PropTypes.array,
  selectedFilterStatus: PropTypes.array,
  structure: PropTypes.object,
  ibDate: PropTypes.string,
  ibQue: PropTypes.string,
  style: PropTypes.object,
  allGPUs: PropTypes.array,
  allArchs: PropTypes.array,
  allOthers: PropTypes.array,
  allFlavors: PropTypes.array,
};

export default ResultTableWithSteps;
