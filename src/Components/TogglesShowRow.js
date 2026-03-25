import React, { Component } from 'react';

const THEME = {
  primary: '#6b7280',
  primaryDark: '#4b5563',
  secondary: '#9ca3af',
  light: '#f3f4f6',
  border: '#d1d5db',
  white: '#ffffff',
  text: {
    primary: '#374151',
    secondary: '#6b7280',
  }
};

// Button group styles
const groupStyles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    background: 'transparent'
  },
  button: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 400,
    border: '1px solid',
    minWidth: 'auto',
    lineHeight: 1.5,
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.15s ease',
    position: 'relative',
    zIndex: 1,
    backgroundColor: '#e5e7eb',
    borderColor: '#d1d5db',
    color: '#374151',
    borderRadius: '20px'
  }
};

// ---- helper: ----
function normalizeSelections(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(v => v !== "");
  if (typeof val === "string") return val === "" ? [] : [val];
  return [];
}

class TogglesShowRow extends Component {
  constructor(props) {
    super(props);

    const normalizedInit = normalizeSelections(props.initSelections);

    this.state = {
      nameList: props.nameList || [],
      selectedValues: normalizedInit,
      rowName: props.rowName || ''
    };

    this.handleButtonClick = this.handleButtonClick.bind(this);

    if (props.callbackToParent) {
      props.callbackToParent(normalizedInit);
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.nameList !== this.props.nameList ||
      prevProps.initSelections !== this.props.initSelections ||
      prevProps.rowName !== this.props.rowName
    ) {
      this.setState({
        nameList: this.props.nameList || [],
        selectedValues: normalizeSelections(this.props.initSelections),
        rowName: this.props.rowName || ''
      });
    }
  }

  handleButtonClick(item, event) {
    event.preventDefault();
    event.stopPropagation();

    const selectedValues = normalizeSelections(this.state.selectedValues);

    const newValue = selectedValues.includes(item)
      ? selectedValues.filter(v => v !== item)
      : [...selectedValues, item];

    this.setState({ selectedValues: newValue });

    if (this.props.callbackToParent) {
      this.props.callbackToParent(newValue);
    }
  }

  getButtonStyle = (isSelected) => {
    const baseStyle = {
      ...groupStyles.button,
      marginLeft: '0',
      zIndex: isSelected ? 2 : 1
    };

    if (isSelected) {
      return {
        ...baseStyle,
        backgroundColor: '#6b7280',
        borderColor: '#4b5563',
        color: '#ffffff',
        fontWeight: 500
      };
    }

    return baseStyle;
  };

  render() {
    const { nameList, selectedValues, rowName } = this.state;
    const safeSelected = normalizeSelections(selectedValues);
    const selectedCount = safeSelected.length;

    if (!nameList || nameList.length === 0) return null;

    return (
      <div className="d-flex align-items-start w-100" style={{ minHeight: '42px' }}>
        {/* Row Label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: '6px',
          background: THEME.light,
          border: `1px solid ${THEME.border}`,
          minWidth: '100px',
          marginRight: '12px',
          height: '34px'
        }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: THEME.text.primary
          }}>
            {rowName}
          </span>

          {selectedCount > 0 && selectedCount < nameList.length && (
            <span style={{
              fontSize: '0.65rem',
              padding: '2px 5px',
              borderRadius: '10px',
              background: THEME.white,
              color: THEME.text.secondary,
              fontWeight: 500,
              marginLeft: '6px',
              border: `1px solid ${THEME.border}`
            }}>
              {selectedCount}
            </span>
          )}
        </div>

        {/* Buttons Container */}
        <div style={groupStyles.container}>
          {nameList.map((item) => {
            const isSelected = safeSelected.includes(item);

            return (
              <button
                key={item}
                type="button"
                onClick={(e) => this.handleButtonClick(item, e)}
                style={this.getButtonStyle(isSelected)}
                className="btn btn-sm"
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#d1d5db';
                    e.currentTarget.style.color = '#111827';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  } else {
                    e.currentTarget.style.backgroundColor = '#6b7280';
                    e.currentTarget.style.borderColor = '#4b5563';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}

export default TogglesShowRow;