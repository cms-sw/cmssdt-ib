import React, { useMemo, useState, forwardRef } from "react";
import {
  Navbar,
  Nav,
  Dropdown,
  Button,
  Modal,
  Popover,
  OverlayTrigger,
  Container
} from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useLocation } from "react-router-dom";
import {
  BsQuestionCircle,
  BsExclamationCircle,
  BsCheckCircle,
  BsXCircle,
  BsList,
  BsArrowRepeat,
  BsFilter,
  BsGithub,
  BsBox,
  BsCalendarEvent,
  BsChevronUp,
  BsChevronDown
} from "react-icons/bs";
import { FaCodeBranch, FaCode, FaCubes } from "react-icons/fa";

import { config } from "../config";
import { getComReleaseFromQue } from "../Utils/processing";

const { urls } = config;

const THEME = {
  primary: "#2563eb",
  primaryLight: "#3b82f6",
  border: "#e2e8f0",
  hover: "#f1f5f9",
  pageBg: "#f5f7fb",
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    muted: "#64748b"
  }
};

/**
 * NAV THEME (edit colors here)
 */
const NAV_THEME = {
  navbarBg: "rgba(15, 23, 42, 0.92)",
  navbarBorder: "rgba(148,163,184,0.25)",

  // main text
  navbarText: "#f8fafc",
  navbarTextMuted: "rgba(248,250,252,0.78)",

  // pills
  pillHoverBg: "rgba(59,130,246,0.18)",

  // dropdowns
  dropdownBg: "#0b1220",
  dropdownBorder: "rgba(148,163,184,0.22)",
  dropdownItemHover: "rgba(255,255,255,0.06)",

  // buttons
  filtersBtnBg: THEME.primary,
  filtersBtnText: "#ffffff",
  iconBtnBorder: "rgba(148,163,184,0.45)",

  brandChipGradient: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.primaryLight} 100%)`
};

// Custom dropdown toggle that looks like a nav pill
const PillDropdownToggle = forwardRef(({ children, onClick, active }, ref) => (
  <a
    href="#"
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick?.(e);
    }}
    className={`nav-link navpill d-inline-flex align-items-center ${active ? "active" : ""}`}
  >
    {children}
    <span className="ms-2 navpill-caret">▾</span>
  </a>
));
PillDropdownToggle.displayName = "PillDropdownToggle";

const getReleaseIcon = () => {
  return <FaCodeBranch className="me-2" style={{ color: "#ffffff" }} />;
};

const popoverHelp = (
  <Popover id="popover-help" className="border-0 shadow">
    <Popover.Header as="h3" className="bg-light border-0">
      <BsQuestionCircle className="text-primary me-2" />
      Need Help?
    </Popover.Header>
    <Popover.Body>
      <p className="mb-2">Click for detailed explanations of all status indicators.</p>
      <small className="text-muted">
        Keyboard shortcut: <kbd className="bg-light border px-2 py-1 rounded">?</kbd>
      </small>
    </Popover.Body>
  </Popover>
);

const popoverIssues = (
  <Popover id="popover-issues" className="border-0 shadow">
    <Popover.Header as="h3" className="bg-light border-0">
      <BsExclamationCircle className="text-danger me-2" />
      Report an Issue
    </Popover.Header>
    <Popover.Body>
      <p className="mb-0">Select where you'd like to report the problem:</p>
    </Popover.Body>
  </Popover>
);

const Navigation = ({ toLinks, flaworControl, archControl }) => {
  const location = useLocation();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleClose = () => setShowHelpModal(false);
  const handleShow = () => setShowHelpModal(true);

  const handleNavbarToggle = () => setExpanded((v) => !v);
  const handleNavbarClose = () => setExpanded(false);
  const toggleFilters = () => setShowFilters((v) => !v);

  const { importantNavLinks, olderMenuItems, isOlderActive } = useMemo(() => {
    let important = [];
    let older = [];
    let olderPaths = [];

    if (toLinks?.length) {
      const reversed = [...toLinks].reverse();

      const mapped = reversed.map((item) => {
        const rel = getComReleaseFromQue(item);
        const path = `/ib/${item}`;
        return { item, rel, path };
      });

      const top3 = mapped.slice(0, 3);
      const rest = mapped.slice(3);

      important = top3.map(({ item, rel, path }) => (
        <LinkContainer key={item} to={path} onClick={handleNavbarClose}>
          <Nav.Link className="navpill d-flex align-items-center">
            {getReleaseIcon(rel)}
            <span className="fw-medium">{rel}</span>
          </Nav.Link>
        </LinkContainer>
      ));

      olderPaths = rest.map(({ path }) => path);

      older = rest.map(({ item, rel, path }) => (
        <LinkContainer key={item} to={path} onClick={handleNavbarClose}>
          <Dropdown.Item className="d-flex align-items-center dropdown-item-pro">
            {getReleaseIcon(rel)}
            <span className="fw-medium">{rel}</span>
          </Dropdown.Item>
        </LinkContainer>
      ));
    }

    return {
      importantNavLinks: important,
      olderMenuItems: older,
      isOlderActive: olderPaths.includes(location.pathname)
    };
  }, [toLinks, location.pathname]);

  const spacerHeight = showFilters ? 170 : 76;

  return (
    <>
      <style>{`
        #navigation .nav-link.active.navpill,
        #navigation .navpill.active {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff !important;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          transform: translateY(-1px);
        }

        body { background: ${THEME.pageBg}; }

        /* --- NAVBAR baseline --- */
        #navigation.navbar {
          color: ${NAV_THEME.navbarText};
        }

        /* Force ALL navbar text/link colors to be readable */
        #navigation .navbar-brand,
        #navigation .navbar-nav .nav-link,
        #navigation .dropdown-toggle,
        #navigation .nav-link,
        #navigation .navbar-toggler {
          color: ${NAV_THEME.navbarText} !important;
        }

        /* Muted text inside navbar if needed */
        #navigation .text-muted,
        #navigation .small,
        #navigation .nav-link .text-muted {
          color: ${NAV_THEME.navbarTextMuted} !important;
        }

        /* pills */
        .navpill {
          border-radius: 12px;
          padding: 0.5rem 0.9rem !important;
          margin: 0 2px;
          color: ${NAV_THEME.navbarText} !important;
          text-decoration: none !important;
          line-height: 1.1;
          transition: all 0.2s ease;
        }

        .navpill:hover, .navpill:focus {
          background: ${NAV_THEME.pillHoverBg};
          color: ${NAV_THEME.navbarText} !important;
        }

        .navpill:focus-visible {
          outline: 2px solid rgba(59,130,246,0.55);
          outline-offset: 2px;
        }

        .navpill-caret {
          opacity: 0.85;
          font-size: 0.9em;
          color: ${NAV_THEME.navbarTextMuted};
        }

        /* icons buttons */
        .icon-btn {
          border-radius: 999px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .btn-pill { border-radius: 999px !important; }

        /* --- Dropdown menu styling for dark navbar --- */
        .dropdown-menu-pro {
          background: ${NAV_THEME.dropdownBg} !important;
          border: 1px solid ${NAV_THEME.dropdownBorder} !important;
          color: ${NAV_THEME.navbarText} !important;
        }

        .dropdown-menu-pro .dropdown-item-pro,
        .dropdown-menu-pro .dropdown-item {
          color: ${NAV_THEME.navbarText} !important;
          border-radius: 10px;
          margin: 2px 8px;
          padding: 0.55rem 0.75rem;
        }

        .dropdown-menu-pro .dropdown-item-pro:hover,
        .dropdown-menu-pro .dropdown-item-pro:focus,
        .dropdown-menu-pro .dropdown-item:hover,
        .dropdown-menu-pro .dropdown-item:focus {
          background: ${NAV_THEME.dropdownItemHover} !important;
          color: ${NAV_THEME.navbarText} !important;
        }

        /* Fix Bootstrap default "active" background in dark dropdown */
        .dropdown-menu-pro .dropdown-item.active,
        .dropdown-menu-pro .dropdown-item:active {
          background: rgba(59,130,246,0.35) !important;
          color: ${NAV_THEME.navbarText} !important;
        }
      `}</style>

      <Navbar
        expand="lg"
        fixed="top"
        id="navigation"
        expanded={expanded}
        onToggle={handleNavbarToggle}
        className="py-2 nav-shell"
        style={{
          backgroundColor: NAV_THEME.navbarBg,
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${NAV_THEME.navbarBorder}`,
          zIndex: 1030
        }}
      >
        <Container fluid className="px-3 px-md-4">
          <Navbar.Brand className="d-flex align-items-center">
            <div
              className="me-3 d-flex align-items-center justify-content-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: NAV_THEME.brandChipGradient,
                color: "white"
              }}
            >
              <FaCubes size={18} />
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold" style={{ fontSize: "1.15rem", letterSpacing: 0.2 }}>
                CMSSW IB Page
              </span>
            </div>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0">
            <BsList size={24} />
          </Navbar.Toggle>

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto gap-lg-1 align-items-lg-center">
              {importantNavLinks}

              {olderMenuItems.length > 0 && (
                <Dropdown as={Nav.Item}>
                  <Dropdown.Toggle
                    as={PillDropdownToggle}
                    id="nav-dropdown-older"
                    active={isOlderActive}
                  >
                    <span className="d-inline-flex align-items-center">
                      <BsCalendarEvent className="me-2" />
                      <span className="fw-medium">Older</span>
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="dropdown-menu-pro shadow border-0 py-2" style={{ minWidth: 260 }}>
                    {olderMenuItems}
                  </Dropdown.Menu>
                </Dropdown>
              )}

              <Nav.Link
                href="https://monit-grafana.cern.ch/d/000000530/cms-monitoring-project?viewPanel=60&orgId=11"
                target="_blank"
                rel="noopener noreferrer"
                className="navpill d-flex align-items-center"
                onClick={handleNavbarClose}
              >
                <FaCode className="me-2" />
                <span className="fw-medium">IB Profiling Results</span>
              </Nav.Link>
            </Nav>

            <div className="d-flex align-items-center gap-2 ms-lg-2">
              <Button
                size="sm"
                onClick={toggleFilters}
                className="d-flex align-items-center gap-2 px-3 btn-pill"
                style={{
                  height: 38,
                  backgroundColor: showFilters ? NAV_THEME.filtersBtnBg : "transparent",
                  color: showFilters ? NAV_THEME.filtersBtnText : NAV_THEME.navbarText,
                  borderColor: showFilters ? "transparent" : NAV_THEME.iconBtnBorder
                }}
              >
                <BsFilter size={16} />
                <span className="fw-medium">Filters</span>
                {showFilters ? <BsChevronUp size={14} /> : <BsChevronDown size={14} />}
              </Button>

              <OverlayTrigger placement="bottom" overlay={popoverHelp}>
                <Button
                  onClick={handleShow}
                  size="sm"
                  className="icon-btn"
                  style={{
                    width: 38,
                    height: 38,
                    color: NAV_THEME.navbarText,
                    borderColor: NAV_THEME.iconBtnBorder,
                    background: "transparent"
                  }}
                  variant="outline-secondary"
                >
                  <BsQuestionCircle size={18} />
                </Button>
              </OverlayTrigger>

              <Dropdown align="end">
                <OverlayTrigger placement="bottom" overlay={popoverIssues}>
                  <Dropdown.Toggle
                    size="sm"
                    className="icon-btn"
                    style={{
                      width: 38,
                      height: 38,
                      background: "transparent"
                    }}
                    variant="outline-danger"
                    id="issues-dropdown"
                  >
                    <BsExclamationCircle size={18} />
                  </Dropdown.Toggle>
                </OverlayTrigger>

                <Dropdown.Menu className="shadow border-0 py-2 dropdown-menu-pro" style={{ minWidth: 240 }}>
                  {urls.issues?.map((el) => (
                    <Dropdown.Item
                      key={el.url}
                      href={el.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-flex align-items-center dropdown-item-pro"
                    >
                      <BsGithub className="me-3" size={18} />
                      <span className="flex-grow-1 fw-medium">{el.name}</span>
                      <BsBox style={{ color: NAV_THEME.navbarTextMuted }} size={12} />
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Filters panel */}
      <div
        style={{
          position: "fixed",
          top: 70,
          left: 0,
          right: 0,
          zIndex: 1020,
          pointerEvents: "none",
          transition: "all 0.25s ease",
          transform: showFilters ? "translateY(0)" : "translateY(-110%)",
          opacity: showFilters ? 1 : 0
        }}
      >
        <Container fluid className="px-3 px-md-4">
          <div
            className="bg-white rounded-3 shadow-sm mx-auto"
            style={{
              maxWidth: 1600,
              pointerEvents: "auto",
              border: `1px solid ${THEME.border}`,
              overflow: "hidden"
            }}
          >
            <div className="px-3 py-3 px-md-4">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex flex-column flex-lg-row gap-2 gap-lg-3 align-items-lg-center">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: THEME.hover,
                        border: `1px solid ${THEME.border}`,
                        color: THEME.primary
                      }}
                    >
                      <BsFilter size={18} />
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: THEME.text.primary, lineHeight: 1.1 }}>
                        Filters
                      </div>
                    </div>
                  </div>

                  <div className="flex-grow-1">{flaworControl}</div>
                </div>

                <div className="d-flex flex-column flex-lg-row gap-2 gap-lg-3 align-items-lg-center">
                  <div className="fw-semibold" style={{ minWidth: 130, color: THEME.text.secondary }}>
                    Architectures
                  </div>
                  <div className="flex-grow-1">{archControl}</div>
                </div>
              </div>
            </div>

            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${THEME.primary} 0%, ${THEME.primaryLight} 55%, transparent 100%)`,
                opacity: 0.22
              }}
            />
          </div>
        </Container>
      </div>

      <div style={{ height: spacerHeight, transition: "height 0.25s ease" }} />

      {/* Help Modal (UNCHANGED) */}
      <Modal show={showHelpModal} onHide={handleClose} centered size="lg" className="help-modal">
        <Modal.Header closeButton className="bg-light border-0">
          <Modal.Title className="d-flex align-items-center">
            <div
              className="text-white p-2 rounded-3 me-3"
              style={{ background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.primaryLight} 100%)` }}
            >
              <BsQuestionCircle size={24} />
            </div>
            <div>
              <h5 className="mb-0">Dashboard Guide</h5>
              <small className="text-muted">Understanding the status indicators</small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-4">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded-3">
                <BsCheckCircle className="text-success me-3" size={24} />
                <div>
                  <div className="fw-semibold">All Tests Successful</div>
                  <small className="text-muted">All checks passed</small>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded-3">
                <span className="badge bg-warning text-dark me-3 px-3 py-2 rounded-pill">14</span>
                <div>
                  <div className="fw-semibold">Warnings</div>
                  <small className="text-muted">Click for details</small>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded-3">
                <span className="badge bg-danger me-3 px-3 py-2 rounded-pill">14</span>
                <div>
                  <div className="fw-semibold">Errors</div>
                  <small className="text-muted">Requires attention</small>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded-3">
                <BsArrowRepeat className="text-secondary me-3" size={24} />
                <div>
                  <div className="fw-semibold">HLT Validation</div>
                  <small className="text-muted">Results pending</small>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded-3">
                <BsList className="text-secondary me-3" size={24} />
                <div>
                  <div className="fw-semibold">HLT Validation</div>
                  <small className="text-muted">Results ready</small>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded-3">
                <BsCheckCircle className="text-success me-3" size={24} />
                <div>
                  <div className="fw-semibold">FWLite</div>
                  <small className="text-muted">Test passed</small>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded-3">
                <BsXCircle className="text-danger me-3" size={24} />
                <div>
                  <div className="fw-semibold">FWLite</div>
                  <small className="text-muted">Test failed</small>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 bg-light">
          <Button variant="primary" onClick={handleClose} className="px-4">
            Got it
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Navigation;