// src/components/RelValComponents/RelValNavigation.js
import React, { useState, useRef, useEffect } from "react";
import {
  Navbar,
  Button,
  Row,
  Col,
  Dropdown,
  Modal,
  Container,
} from "react-bootstrap";
import {
  BsChevronLeft,
  BsQuestionCircle,
  BsExclamationCircle,
  BsCheck2,
  BsEye,
  BsInfoCircle,
  BsFilter,
  BsChevronDown,
  BsChevronUp
} from "react-icons/bs";
import { config } from "../../config";

const { urls } = config;

const NAVY = "#1f2a44";
const NAVY_LIGHT = "#2a3756";
const BORDER_LIGHT = "rgba(255,255,255,0.12)";

const RelValNavigation = ({
  relvalInfo,
  que,
  controlList,
  controlsByKey,
  onHeightChange
}) => {
  const [showLegend, setShowLegend] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // hidden on load
  const navRef = useRef(null);
  const lastReportedHeightRef = useRef(0);

  const reportHeight = () => {
    if (!navRef.current || !onHeightChange) return;

    const height = navRef.current.offsetHeight;
    if (height !== lastReportedHeightRef.current) {
      lastReportedHeightRef.current = height;
      onHeightChange(height);
    }
  };

  useEffect(() => {
    reportHeight();
    const t1 = setTimeout(reportHeight, 80);
    const t2 = setTimeout(reportHeight, 180);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [expanded, showFilters, controlsByKey, controlList]);

  const handleClose = () => setShowLegend(false);
  const handleShow = () => setShowLegend(true);

  const handleNavbarToggle = () => {
    setExpanded((v) => !v);
    setTimeout(reportHeight, 120);
  };

  const toggleFilters = () => {
    setShowFilters((v) => !v);
    setTimeout(reportHeight, 120);
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    window.location.href = `#/ib/${que}_X`;
  };

  return (
    <>
      <Navbar
        expand="lg"
        fixed="top"
        id="relval-navigation"
        ref={navRef}
        expanded={expanded}
        onToggle={handleNavbarToggle}
        className="py-2 shadow-sm"
        style={{
          background: NAVY,
          borderBottom: `1px solid ${BORDER_LIGHT}`,
          zIndex: 1030,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          alignItems: "stretch"
        }}
      >
        <Container fluid className="px-3 px-md-4 px-lg-4">
          <div className="w-100 d-flex flex-column">
            {/* TOP LINE */}
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline-light"
                  onClick={handleBackClick}
                  className="d-flex align-items-center"
                  style={{
                    borderRadius: "20px",
                    cursor: "pointer",
                    zIndex: 1031,
                    paddingLeft: "12px",
                    paddingRight: "12px"
                  }}
                >
                  <BsChevronLeft className="me-1" size={14} />
                  <span>Back to IB</span>
                </Button>

                <div
                  className="fw-semibold"
                  style={{
                    color: "#ffffff",
                    fontSize: "1rem",
                    lineHeight: 1.2,
                    marginLeft: "4px"
                  }}
                >
                  RelVals: {relvalInfo}
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Filters button */}
                <Button
                  variant="light"
                  size="sm"
                  onClick={toggleFilters}
                  className="d-flex align-items-center gap-2 px-3"
                  style={{
                    borderRadius: "20px",
                    height: "36px",
                    backgroundColor: showFilters ? "#e9ecef" : "#ffffff",
                    borderColor: "#dee2e6",
                    color: "#495057",
                    cursor: "pointer",
                    zIndex: 1031,
                    fontWeight: 600
                  }}
                >
                  <BsFilter size={14} />
                  <span>Filters</span>
                  {showFilters ? <BsChevronUp size={12} /> : <BsChevronDown size={12} />}
                </Button>

                <Button
                  variant="light"
                  size="sm"
                  onClick={handleShow}
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderColor: "#dee2e6",
                    color: "#495057",
                    cursor: "pointer",
                    zIndex: 1031
                  }}
                >
                  <BsQuestionCircle size={16} />
                </Button>

                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="light"
                    size="sm"
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderColor: "#dee2e6",
                      color: "#495057",
                      padding: 0,
                      cursor: "pointer",
                      zIndex: 1031
                    }}
                    id="issues-dropdown"
                  >
                    <BsExclamationCircle size={16} />
                  </Dropdown.Toggle>

                  <Dropdown.Menu
                    className="shadow-sm border-0 py-2"
                    style={{ minWidth: "200px", zIndex: 1032 }}
                  >
                    {urls.issues?.map((el) => (
                      <Dropdown.Item
                        key={el.url}
                        href={el.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-flex align-items-center py-2 px-3"
                        style={{ fontSize: "0.85rem", cursor: "pointer" }}
                      >
                        <BsExclamationCircle
                          className="me-2 text-secondary"
                          size={14}
                        />
                        {el.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>

            {/* FILTERS AREA */}
            <div
              className="w-100"
              style={{
                maxHeight: showFilters ? "1000px" : "0",
                overflow: "hidden",
                opacity: showFilters ? 1 : 0,
                transition: "all 0.28s ease"
              }}
            >
              <div
                className="mt-3 pt-3 px-2 px-md-3 py-2"
                style={{
                  borderTop: `1px solid ${BORDER_LIGHT}`,
                  background: "#ffffff",
                  borderRadius: "14px",
                  marginTop: "14px"
                }}
              >
                {controlsByKey ? (
                  <div
                    className="d-flex flex-column"
                    style={{ gap: 14, width: "100%" }}
                  >
                    <div style={{ width: "100%" }}>
                      {controlsByKey.flavors}
                    </div>

                    <div style={{ width: "100%" }}>
                      {controlsByKey.archs}
                    </div>

                    {controlsByKey.gpus ? (
                      <div style={{ width: "100%" }}>
                        {controlsByKey.gpus}
                      </div>
                    ) : null}

                    <div
                      className="d-flex flex-wrap align-items-start"
                      style={{ gap: 12, width: "100%" }}
                    >
                      {controlsByKey.others ? <div>{controlsByKey.others}</div> : null}
                      {controlsByKey.status ? <div>{controlsByKey.status}</div> : null}
                      {controlsByKey.filter ? <div>{controlsByKey.filter}</div> : null}
                    </div>
                  </div>
                ) : (
                  <Row className="g-3">
                    {controlList.map((controls, idx) => (
                      <Col lg={12} key={idx}>
                        {controls}
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Navbar>

      <Modal
        show={showLegend}
        onHide={handleClose}
        centered
        size="lg"
        className="legend-modal"
      >
        <Modal.Header
          closeButton
          className="border-0 pb-0"
          style={{ backgroundColor: "transparent" }}
        >
          <Modal.Title className="d-flex align-items-center w-100">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle bg-primary bg-opacity-10 p-2 d-flex align-items-center justify-content-center"
                style={{ width: "40px", height: "40px" }}
              >
                <BsInfoCircle className="text-primary" size={20} />
              </div>
              <div>
                <h5 className="mb-0 fw-semibold">Status Legend</h5>
                <p className="text-muted small mb-0 mt-1">
                  Understanding RelVal status colors and indicators
                </p>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-3">
          <div className="legend-container">
            <Row xs={1} md={2} className="g-3">
              <Col>
                <div className="d-flex align-items-start gap-2 p-2 rounded hover-bg-light">
                  <div
                    className="flex-shrink-0 rounded px-2 py-1 text-white fw-semibold"
                    style={{
                      backgroundColor: "rgb(92, 184, 92)",
                      fontSize: "0.8rem",
                      minWidth: "70px",
                      textAlign: "center"
                    }}
                  >
                    Passed
                  </div>
                  <div className="flex-grow-1">
                    <span className="text-secondary small">
                      Passed without error or warning messages
                    </span>
                  </div>
                </div>
              </Col>

              <Col>
                <div className="d-flex align-items-start gap-2 p-2 rounded hover-bg-light">
                  <div
                    className="flex-shrink-0 rounded px-2 py-1 text-white fw-semibold"
                    style={{
                      backgroundColor: "rgb(230, 188, 99)",
                      fontSize: "0.8rem",
                      minWidth: "70px",
                      textAlign: "center"
                    }}
                  >
                    Passed
                  </div>
                  <div className="flex-grow-1">
                    <span className="text-secondary small">
                      Passed with error messages
                    </span>
                  </div>
                </div>
              </Col>

              <Col>
                <div className="d-flex align-items-start gap-2 p-2 rounded hover-bg-light">
                  <div
                    className="flex-shrink-0 rounded px-2 py-1 text-white fw-semibold"
                    style={{
                      backgroundColor: "rgb(92, 145, 92)",
                      fontSize: "0.8rem",
                      minWidth: "70px",
                      textAlign: "center"
                    }}
                  >
                    Passed
                  </div>
                  <div className="flex-grow-1">
                    <span className="text-secondary small">
                      Passed with warning messages
                    </span>
                  </div>
                </div>
              </Col>

              <Col>
                <div className="d-flex align-items-start gap-2 p-2 rounded hover-bg-light">
                  <div
                    className="flex-shrink-0 rounded px-2 py-1 text-white fw-semibold"
                    style={{
                      backgroundColor: "rgb(217, 83, 79)",
                      fontSize: "0.8rem",
                      minWidth: "70px",
                      textAlign: "center"
                    }}
                  >
                    Failed
                  </div>
                  <div className="flex-grow-1">
                    <span className="text-secondary small">Failed</span>
                  </div>
                </div>
              </Col>

              <Col>
                <div className="d-flex align-items-start gap-2 p-2 rounded hover-bg-light">
                  <div
                    className="flex-shrink-0 rounded px-2 py-1 text-white fw-semibold"
                    style={{
                      backgroundColor: "rgb(153, 153, 153)",
                      fontSize: "0.8rem",
                      minWidth: "70px",
                      textAlign: "center"
                    }}
                  >
                    NotRun
                  </div>
                  <div className="flex-grow-1">
                    <span className="text-secondary small">Not run</span>
                  </div>
                </div>
              </Col>

              <Col>
                <div className="d-flex align-items-start gap-2 p-2 rounded hover-bg-light">
                  <div
                    className="flex-shrink-0 rounded px-2 py-1 text-white fw-semibold"
                    style={{
                      backgroundColor: "rgb(255, 153, 204)",
                      fontSize: "0.8rem",
                      minWidth: "70px",
                      textAlign: "center"
                    }}
                  >
                    DAS-Err
                  </div>
                  <div className="flex-grow-1">
                    <span className="text-secondary small">DAS error</span>
                  </div>
                </div>
              </Col>

              <Col>
                <div className="d-flex align-items-start gap-2 p-2 rounded hover-bg-light">
                  <div
                    className="flex-shrink-0 rounded px-2 py-1 text-white fw-semibold d-flex align-items-center justify-content-center gap-1"
                    style={{
                      backgroundColor: "rgb(92, 184, 92)",
                      fontSize: "0.8rem",
                      minWidth: "70px",
                      textAlign: "center"
                    }}
                  >
                    OtherCMS
                    <span
                      className="glyphicon glyphicon-eye-open"
                      style={{ fontSize: "0.7rem" }}
                    ></span>
                  </div>
                  <div className="flex-grow-1">
                    <span className="text-secondary small">Known failed</span>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <hr className="my-4" />

          <div className="additional-info bg-light p-3 rounded">
            <div className="d-flex align-items-center gap-2 mb-2">
              <BsEye className="text-primary" size={16} />
              <span className="fw-semibold small">Quick Tips</span>
            </div>
            <ul className="small text-secondary mb-0 ps-4">
              <li>Click on step numbers to view detailed commands</li>
              <li>Use filters to narrow down results</li>
              <li>
                Click the{" "}
                <span
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "0.7rem"
                  }}
                >
                  ▶
                </span>{" "}
                button to expand rows and see all steps
              </li>
              <li>Click on colored status badges to view logs</li>
              <li>
                Known failed items are marked with{" "}
                <span
                  className="glyphicon glyphicon-eye-open"
                  style={{ fontSize: "0.7rem" }}
                ></span>{" "}
                icon
              </li>
            </ul>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="primary"
            onClick={handleClose}
            className="px-4 d-flex align-items-center gap-2"
            style={{ borderRadius: "20px" }}
          >
            <BsCheck2 size={16} />
            <span>Got it</span>
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .legend-modal .modal-content {
          border: none;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .legend-modal .modal-header {
          border-bottom: none;
          padding: 1.5rem 1.5rem 0.5rem;
        }

        .legend-modal .modal-body {
          padding: 1rem 1.5rem;
        }

        .legend-modal .modal-footer {
          border-top: none;
          padding: 0.5rem 1.5rem 1.5rem;
        }

        .hover-bg-light:hover {
          background-color: #f8f9fa;
        }

        .legend-container {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .legend-container::-webkit-scrollbar {
          width: 6px;
        }

        .legend-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .legend-container::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }

        .legend-container::-webkit-scrollbar-thumb:hover {
          background: #999;
        }

        @media (max-width: 991px) {
          #relval-navigation .container-fluid {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
        }
      `}</style>
    </>
  );
};

export default RelValNavigation;