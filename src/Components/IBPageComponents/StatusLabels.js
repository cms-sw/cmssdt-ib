import React, { Component } from "react";
import PropTypes from "prop-types";
import { config, STATUS_ENUM } from "../../config";
import { v4 as uuidv4 } from "uuid";
import { Dropdown } from "react-bootstrap";
import {
  FaTag,
  FaList,
  FaSyncAlt,
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
  FaGithub,
  FaCodeBranch,
  FaBox
} from "react-icons/fa";
import { getCurrentIbTag, getDisplayName } from "../../Utils/processing";
import { UnitTestsLabel } from "./UnitTestsLabel";
import { RelvalsLabel } from "./RelvalsLabel";

const { statusLabelsConfigs } = config;

const ICON_MAP = {
  tag: <FaTag />,
  list: <FaList />,
  refresh: <FaSyncAlt className="fa-spin" />,
  success: <FaCheck />,
  warning: <FaExclamationTriangle />,
  error: <FaTimes />,
  github: <FaGithub />,
  branch: <FaCodeBranch />,
  release: <FaBox />
};

const COLOR_SCHEME = {
  primary: { bg: "#e9ecef", text: "#495057", border: "#dee2e6" },      // Light gray
  secondary: { bg: "#f1f3f5", text: "#495057", border: "#e9ecef" },    // Very light gray
  success: { bg: "#e6f7e6", text: "#2c6e2c", border: "#b7e0b7" },      // Soft green

 
  danger: { bg: "#f8d7da", text: "#842029", border: "#f5c2c7" },       // Soft red (more visible)

  
  warning: { bg: "#fff3cd", text: "#664d03", border: "#ffecb5" },      // Soft yellow
  info: { bg: "#d1ecf1", text: "#0c5460", border: "#bee5eb" },         // Soft blue
  light: { bg: "#ffffff", text: "#6c757d", border: "#f8f9fa" },        // White
  dark: { bg: "#e9ecef", text: "#343a40", border: "#dee2e6" },         // Light gray
  outline: { bg: "#ffffff", text: "#6c757d", border: "#dee2e6" }       // Outline style
};

class StatusLabels extends Component {
  constructor(props) {
    super(props);
    this.state = {
      IBGroup: props.IBGroup || [],
      ib: props.IBGroup?.[0] || null,
      ibGroupType: props.ibGroupType || "IB",
      showOnlyIbTag: props.showOnlyIbTag || false
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.IBGroup !== prevState.IBGroup) {
      return {
        IBGroup: nextProps.IBGroup || [],
        ib: nextProps.IBGroup?.[0] || null,
        ibGroupType: nextProps.ibGroupType || "IB",
        showOnlyIbTag: nextProps.showOnlyIbTag || false
      };
    }
    return null;
  }

  static resolveColors(variant, labelColor) {
    const base = COLOR_SCHEME[variant] || COLOR_SCHEME.secondary;
    if (labelColor === "red") return COLOR_SCHEME.danger;
    if (labelColor === "orange") return COLOR_SCHEME.warning;
    return base;
  }

  static formatLabel({ icon, name, url, labelColor, variant = "secondary", tooltip }) {
    const colors = StatusLabels.resolveColors(variant, labelColor);

    const content = (
      <>
        {icon && <span className="me-1" style={{ color: colors.text }}>{icon}</span>}
        <span style={{ color: colors.text }}>{name}</span>
      </>
    );

    const baseStyle = {
      backgroundColor: colors.bg,
      color: colors.text,
      fontSize: "0.85rem",
      fontWeight: "400",
      padding: "4px 10px",
      borderRadius: "4px",
      border: `1px solid ${colors.border}`,
      display: "inline-flex",
      alignItems: "center",
      boxShadow: "none",
      transition: "none",
      ...(tooltip ? { cursor: "help" } : {})
    };

    const hoverStyle = url
      ? {
          textDecoration: "none",
          ...(labelColor ? {} : { backgroundColor: "#f8f9fa" })
        }
      : {};

    if (url) {
      return (
        <a
          key={uuidv4()}
          href={url}
          className="me-1"
          style={{ ...baseStyle, ...hoverStyle }}
          target="_blank"
          rel="noopener noreferrer"
          title={tooltip}
        >
          {content}
        </a>
      );
    }

    return (
      <span key={uuidv4()} className="me-1" style={baseStyle} title={tooltip}>
        {content}
      </span>
    );
  }

  static defaultFound(config, ib, result) {
    return {
      name: config.name,
      icon: ICON_MAP.list,
      url: config.getUrl ? config.getUrl(ib, result) : undefined,
      variant: "success",
      tooltip: "Found and ready"
    };
  }

  static defaultInProgress(config) {
    return {
      name: config.name,
      icon: ICON_MAP.refresh,
      variant: "info",
      tooltip: "In progress..."
    };
  }

  static defaultError(config) {
    return {
      name: config.name,
      icon: ICON_MAP.error,
      variant: "danger",
      tooltip: "Error occurred"
    };
  }

  static renderLabel(config, ib) {
    if (!ib) return null;

    let status;
    const result = ib[config.key];

    if (Array.isArray(result)) {
      status = result;
    } else if (typeof result === "object" && result !== null) {
      status = result.status;
    } else {
      status = result;
    }

    if (config.customResultInterpretation) {
      status = config.customResultInterpretation(status);
    }

    let outputConfig;

   if (status === STATUS_ENUM.passed) {
  outputConfig = config.ifPassed
    ? config.ifPassed(ib, result)
    : {
        name: config.name,
        icon: ICON_MAP.success,
        url: config.getUrl ? config.getUrl(ib, result) : undefined,
        variant: "success",
        tooltip: "Test passed"
      };
} else if (status === STATUS_ENUM.found) {
  outputConfig = config.ifFound
    ? config.ifFound(ib, result)
    : StatusLabels.defaultFound(config, ib, result);
} else if ([STATUS_ENUM.inprogress, STATUS_ENUM.inProgress].includes(status)) {
      outputConfig = config.ifInProgress
        ? config.ifInProgress(ib, result)
        : StatusLabels.defaultInProgress(config);
    } else if (status === STATUS_ENUM.error) {
      outputConfig = config.ifError
        ? config.ifError(ib, result)
        : StatusLabels.defaultError(config);
    } else if (status === STATUS_ENUM.warning) {
      outputConfig = config.ifWarning
        ? config.ifWarning(ib, result)
        : {
            name: config.name,
            icon: ICON_MAP.warning,
            variant: "warning",
            tooltip: "Warning: check details"
          };
    } else if (status === STATUS_ENUM.success) {
      outputConfig = config.ifSuccess
        ? config.ifSuccess(ib, result)
        : {
            name: config.name,
            icon: ICON_MAP.success,
            variant: "success",
            tooltip: "Successfully completed"
          };
    }

    return outputConfig ? StatusLabels.formatLabel(outputConfig) : null;
  }

  static renderIBTag(IBGroup, ibGroupType) {
    let configObj;

    switch (ibGroupType) {
      case "IB":
        configObj = {
          name: "IB Tag",
          icon: ICON_MAP.tag,
          url: "https://github.com/cms-sw/cmssw/tree/",
          variant: "primary",
          tooltip: "View this IB tag on GitHub"
        };
        break;
      case "nextIB":
        configObj = {
          name: "See Branch",
          icon: ICON_MAP.branch,
          url: "https://github.com/cms-sw/cmssw/commits/",
          variant: "secondary",
          tooltip: "View branch commits on GitHub"
        };
        break;
      case "fullBuild":
        configObj = {
          name: "Release",
          icon: ICON_MAP.release,
          url: "https://github.com/cms-sw/cmssw/releases/tag/",
          variant: "success",
          tooltip: "View release on GitHub"
        };
        break;
      default:
        return null;
    }

    if (!IBGroup || IBGroup.length === 0) return null;

    if (IBGroup.length > 1) {
      const colors = COLOR_SCHEME[configObj.variant] || COLOR_SCHEME.secondary;

      return (
        <Dropdown key={uuidv4()} className="d-inline-block me-1">
          <Dropdown.Toggle
            variant="light"
            size="sm"
            id={`dropdown-${ibGroupType}-${uuidv4()}`}
            title={configObj.tooltip}
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              color: colors.text,
              fontWeight: "400",
              padding: "4px 10px",
              fontSize: "0.85rem",
              boxShadow: "none"
            }}
          >
            <span className="me-1" style={{ color: colors.text }}>{configObj.icon}</span>
            <span style={{ color: colors.text }}>{configObj.name}</span>
          </Dropdown.Toggle>

          <Dropdown.Menu style={{ minWidth: "200px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            {IBGroup.map((ib) => {
              const tag = getCurrentIbTag(ib);
              const displayName = getDisplayName(ib.release_queue) || tag;
              return (
                <Dropdown.Item
                  key={uuidv4()}
                  href={configObj.url + tag}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`View ${displayName}`}
                  style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                >
                  {/* IB Tab icon color */}
                  <span className="me-2" style={{ color: "black" }}>{configObj.icon}</span>
                  <span>{displayName}</span>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
      );
    }

    return StatusLabels.formatLabel({
      name: configObj.name,
      icon: configObj.icon,
      url: configObj.url + getCurrentIbTag(IBGroup[0]),
      variant: configObj.variant,
      tooltip: configObj.tooltip
    });
  }

  render() {
    const { IBGroup, showOnlyIbTag, ibGroupType, ib } = this.state;

    if (showOnlyIbTag) {
      return null; 
    }

    const menuData = [];

    // Add IB Tag
    if (ibGroupType !== "IB") {
      const ibTag = StatusLabels.renderIBTag(IBGroup, ibGroupType);
      if (ibTag) menuData.push(ibTag);
    }

    // Add GPU and other data if available
    if (ib) {
      // GPU Relvals
      if (ib.gpu_data?.relvals && Object.keys(ib.gpu_data.relvals).length > 0) {
        menuData.push(
          <RelvalsLabel key="gpu-relvals" tests={ib.gpu_data.relvals} type_name="gpu" />
        );
      }

      // GPU QA
      if (ib.gpu_data?.qa && Object.keys(ib.gpu_data.qa).length > 0) {
        menuData.push(
          <UnitTestsLabel key="gpu-qa" tests={ib.gpu_data.qa} type_name="gpu" />
        );
      }

      // Other data relvals
      const relvals = ib.other_data?.relvals || {};
      const rntupleRelvals = Object.fromEntries(
        Object.entries(relvals)
          .filter(([k]) => k.startsWith("rntuple/"))
          .map(([k, v]) => [k.replace(/^rntuple\//, ""), v])
      );

      if (Object.keys(rntupleRelvals).length > 0) {
        menuData.push(
          <RelvalsLabel key="rntuple-relvals" tests={rntupleRelvals} type_name="rntuple" />
        );
      }
    }

    // Add status labels from config
    if (statusLabelsConfigs && Array.isArray(statusLabelsConfigs)) {
      statusLabelsConfigs.forEach((conf) => {
        const label = StatusLabels.renderLabel(conf, ib);
        if (label) menuData.push(label);
      });
    }

    const validMenuData = menuData.filter((item) => item != null);

    return (
      <div className="d-flex flex-wrap align-items-center" style={{ gap: "4px" }}>
        {validMenuData}
      </div>
    );
  }
}

StatusLabels.propTypes = {
  IBGroup: PropTypes.array,
  ibGroupType: PropTypes.oneOf(["IB", "nextIB", "fullBuild"]),
  showOnlyIbTag: PropTypes.bool
};

StatusLabels.defaultProps = {
  IBGroup: [],
  ibGroupType: "IB",
  showOnlyIbTag: false
};

export default StatusLabels;