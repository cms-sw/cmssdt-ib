import React, { Component } from 'react';
import { getDisplayName } from '../Utils/processing';

const THEME = {
  primary: '#6c757d',
  primaryLight: '#adb5bd',
  primaryDark: '#495057',
  secondary: '#868e96',
  success: '#51cf66',
  warning: '#ffc078',
  danger: '#ff8787',
  dark: '#343a40',
  light: '#f8f9fa',
  border: '#e9ecef',
  hover: '#f1f3f5',
  white: '#ffffff',
  text: {
    primary: '#495057',
    secondary: '#868e96',
    muted: '#adb5bd',
    light: '#f8f9fa'
  }
};

const groupStyles = {
  container: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: '2px',
    background: 'transparent',
    flex: '1 1 auto'
  },
  button: {
    padding: '4px 12px',
    fontSize: '0.8rem',
    fontWeight: 400,
    border: '1px solid',
    minWidth: 'auto',
    lineHeight: 1.5,
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.1s ease',
    position: 'relative',
    zIndex: 1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  firstButton: {
    borderTopLeftRadius: '20px',
    borderBottomLeftRadius: '20px',
    borderTopRightRadius: '4px',
    borderBottomRightRadius: '4px'
  },
  middleButton: {
    borderRadius: '4px'
  },
  lastButton: {
    borderTopLeftRadius: '4px',
    borderBottomLeftRadius: '4px',
    borderTopRightRadius: '20px',
    borderBottomRightRadius: '20px'
  },
  singleButton: {
    borderRadius: '20px'
  }
};

const labelStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    background: THEME.light,
    border: `1px solid ${THEME.border}`,
    minWidth: '90px',
    boxShadow: 'none',
    marginRight: '12px',
    flexShrink: 0
  },
  icon: {
    fontSize: '0.9rem',
    lineHeight: 1,
    color: THEME.primary
  },
  text: {
    fontSize: '0.8rem',
    fontWeight: 500,
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    color: THEME.text.primary
  },
  count: {
    fontSize: '0.65rem',
    padding: '2px 5px',
    borderRadius: '10px',
    background: THEME.white,
    color: THEME.text.secondary,
    fontWeight: 500,
    marginLeft: '4px',
    border: `1px solid ${THEME.border}`
  }
};

const contextMenuStyles = {
  menu: {
    position: 'fixed',
    minWidth: '170px',
    background: THEME.white,
    border: `1px solid ${THEME.border}`,
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    zIndex: 9999,
    padding: '6px 0'
  },
  item: {
    padding: '8px 14px',
    fontSize: '0.85rem',
    color: THEME.text.primary,
    cursor: 'pointer',
    background: THEME.white,
    border: 'none',
    width: '100%',
    textAlign: 'left',
    outline: 'none'
  }
};

class TogglesShowIBFlavors extends Component {
  constructor(props) {
    super(props);

    const initialValue = this.getEffectiveSelections(props);

    this.state = {
      value: initialValue,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        item: null
      }
    };

    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleButtonRightClick = this.handleButtonRightClick.bind(this);
    this.handleSelectOnlyThis = this.handleSelectOnlyThis.bind(this);
    this.handleSelectAll = this.handleSelectAll.bind(this);
    this.closeContextMenu = this.closeContextMenu.bind(this);

    if (props.callbackToParent) {
      props.callbackToParent(initialValue);
    }
  }

  getEffectiveSelections(props) {
    const { initSelections, nameList = [] } = props;

    if (Array.isArray(initSelections) && initSelections.length > 0) {
      return initSelections;
    }

    return [...nameList];
  }

  componentDidMount() {
    document.addEventListener('click', this.closeContextMenu);
    document.addEventListener('scroll', this.closeContextMenu, true);
    window.addEventListener('resize', this.closeContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeContextMenu);
    document.removeEventListener('scroll', this.closeContextMenu, true);
    window.removeEventListener('resize', this.closeContextMenu);
  }

  componentDidUpdate(prevProps) {
    const initSelectionsChanged = prevProps.initSelections !== this.props.initSelections;
    const nameListChanged = prevProps.nameList !== this.props.nameList;

    if (initSelectionsChanged || nameListChanged) {
      const nextValue = this.getEffectiveSelections(this.props);

      const currentValue = this.state.value || [];
      const isSameLength = currentValue.length === nextValue.length;
      const isSameValues =
        isSameLength &&
        currentValue.every((item, index) => item === nextValue[index]);

      if (!isSameValues) {
        this.setState({ value: nextValue });

        if (this.props.callbackToParent) {
          this.props.callbackToParent(nextValue);
        }
      }
    }
  }

  updateValue(newValue) {
    this.setState({ value: newValue });

    if (this.props.callbackToParent) {
      this.props.callbackToParent(newValue);
    }
  }

  closeContextMenu() {
    if (this.state.contextMenu.visible) {
      this.setState({
        contextMenu: {
          visible: false,
          x: 0,
          y: 0,
          item: null
        }
      });
    }
  }

  handleButtonClick(item, event) {
    event.preventDefault();
    event.stopPropagation();

    const { value } = this.state;
    const newValue = value.includes(item)
      ? value.filter(v => v !== item)
      : [...value, item];

    this.updateValue(newValue);
  }

  handleButtonRightClick(item, event) {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 170;
    const menuHeight = 90;

    let x = rect.left;
    let y = rect.bottom + 6;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 8;
    }

    if (y + menuHeight > window.innerHeight) {
      y = rect.top - menuHeight - 6;
    }

    this.setState({
      contextMenu: {
        visible: true,
        x,
        y,
        item
      }
    });
  }

  handleSelectOnlyThis() {
    const { item } = this.state.contextMenu;
    if (!item) return;

    this.updateValue([item]);
    this.closeContextMenu();
  }

  handleSelectAll() {
    const { nameList = [] } = this.props;
    this.updateValue([...nameList]);
    this.closeContextMenu();
  }

  getButtonStyle = (index, total, isSelected) => {
    let borderRadius = {};

    if (total === 1) {
      borderRadius = groupStyles.singleButton;
    } else if (index === 0) {
      borderRadius = groupStyles.firstButton;
    } else if (index === total - 1) {
      borderRadius = groupStyles.lastButton;
    } else {
      borderRadius = groupStyles.middleButton;
    }

    const baseStyle = {
      ...groupStyles.button,
      ...borderRadius,
      marginLeft: index > 0 ? '-1px' : '0',
      zIndex: isSelected ? 2 : 1
    };

    if (isSelected) {
      return {
        ...baseStyle,
        backgroundColor: THEME.primary,
        borderColor: THEME.primaryDark,
        color: THEME.white,
        fontWeight: 500
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: THEME.white,
        borderColor: THEME.border,
        color: THEME.text.secondary,
        fontWeight: 400
      };
    }
  };

  renderContextMenu() {
    const { contextMenu } = this.state;
    if (!contextMenu.visible) return null;

    return (
      <div
        style={{
          ...contextMenuStyles.menu,
          top: `${contextMenu.y}px`,
          left: `${contextMenu.x}px`
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <button
          type="button"
          style={contextMenuStyles.item}
          onClick={this.handleSelectOnlyThis}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = THEME.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = THEME.white;
          }}
        >
          Select only this
        </button>

        <button
          type="button"
          style={contextMenuStyles.item}
          onClick={this.handleSelectAll}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = THEME.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = THEME.white;
          }}
        >
          Select all
        </button>
      </div>
    );
  }

  render() {
    const { nameList = [], title = "Flavors" } = this.props;
    const { value } = this.state;

    if (!nameList.length) return null;

    return (
      <>
        <div className="d-flex align-items-start w-100">
          <div style={labelStyles.container}>
            <span style={labelStyles.icon}>📦</span>
            <span style={labelStyles.text}>{title}</span>
          </div>

          <div style={groupStyles.container}>
            {nameList.map((item, index) => {
              const isSelected = value.includes(item);

              return (
                <button
                  key={item}
                  type="button"
                  onClick={(e) => this.handleButtonClick(item, e)}
                  onContextMenu={(e) => this.handleButtonRightClick(item, e)}
                  style={this.getButtonStyle(index, nameList.length, isSelected)}
                  className="btn btn-sm"
                  title="Left click: toggle | Right click: more options"
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = THEME.light;
                      e.currentTarget.style.borderColor = THEME.secondary;
                      e.currentTarget.style.color = THEME.text.primary;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = THEME.white;
                      e.currentTarget.style.borderColor = THEME.border;
                      e.currentTarget.style.color = THEME.text.secondary;
                      e.currentTarget.style.transform = 'translateY(0)';
                    } else {
                      e.currentTarget.style.backgroundColor = THEME.primary;
                      e.currentTarget.style.borderColor = THEME.primaryDark;
                      e.currentTarget.style.color = THEME.white;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {getDisplayName(item)}
                </button>
              );
            })}
          </div>
        </div>

        {this.renderContextMenu()}
      </>
    );
  }
}

export default TogglesShowIBFlavors;