import React, { Component } from 'react';
import IBGroupFrame from './IBGroupFrame';
import { groupAndTransformIBDataList } from '../../Utils/processing';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import {
    FaCodeBranch,
    FaChevronDown,
    FaChevronUp,
    FaThumbtack,
    FaArrowUp,
    FaArrowDown,
    FaTimes
} from 'react-icons/fa';

// Helper function to check if an architecture matches selected filters
const archMatchesFilters = (arch, activeArchs) => {
    if (!arch) return false;

    const parts = arch.split('_');
    if (parts.length < 3) return false;

    const [os, cpu, compiler] = parts;

    const hasOsFilter = activeArchs.os && activeArchs.os.length > 0;
    const hasCpuFilter = activeArchs.cpu && activeArchs.cpu.length > 0;
    const hasCompilerFilter = activeArchs.compiler && activeArchs.compiler.length > 0;

    if (!hasOsFilter && !hasCpuFilter && !hasCompilerFilter) return true;

    const matchesOs =
        !hasOsFilter || activeArchs.os.some(filter => os.includes(filter) || filter.includes(os));
    const matchesCpu =
        !hasCpuFilter || activeArchs.cpu.some(filter => cpu.includes(filter) || filter.includes(cpu));
    const matchesCompiler =
        !hasCompilerFilter ||
        activeArchs.compiler.some(filter => compiler.includes(filter) || filter.includes(compiler));

    return matchesOs && matchesCpu && matchesCompiler;
};

class IBGroups extends Component {
    static propTypes = {
        data: PropTypes.array,
        releaseQue: PropTypes.string.isRequired,
        activeArchs: PropTypes.object
    };

    constructor(props) {
        super(props);

        this.scrollHideTimer = null;
        this.groupRefs = {};

        this.state = {
            originalData: props.data || [],
            transformedData: groupAndTransformIBDataList(props.data || []),
            releaseQue: props.releaseQue,
            activeArchs: props.activeArchs || { os: [], cpu: [], compiler: [] },
            expandAllCommits: false,
            showFloatingControl: true,
            showNavigator: false
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (
            nextProps.data !== prevState.originalData ||
            nextProps.releaseQue !== prevState.releaseQue ||
            JSON.stringify(nextProps.activeArchs) !== JSON.stringify(prevState.activeArchs)
        ) {
            const transformedData = groupAndTransformIBDataList(nextProps.data || []);

            return {
                originalData: nextProps.data || [],
                transformedData,
                releaseQue: nextProps.releaseQue,
                activeArchs: nextProps.activeArchs || { os: [], cpu: [], compiler: [] }
            };
        }
        return null;
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll, { passive: true });
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
        if (this.scrollHideTimer) {
            clearTimeout(this.scrollHideTimer);
        }
    }

    handleScroll = () => {
        if (this.state.showFloatingControl) {
            this.setState({ showFloatingControl: false });
        }

        if (this.scrollHideTimer) {
            clearTimeout(this.scrollHideTimer);
        }

        this.scrollHideTimer = setTimeout(() => {
            // keep hidden after scroll; user must click pin to show again
        }, 150);
    };

    toggleAllCommits = () => {
        this.setState((prevState) => ({
            expandAllCommits: !prevState.expandAllCommits
        }));
    };

    showFloatingButton = () => {
        this.setState({ showFloatingControl: true });
    };

    hideFloatingButton = () => {
        this.setState({ showFloatingControl: false });
    };

    toggleNavigator = () => {
        this.setState((prevState) => ({
            showNavigator: !prevState.showNavigator
        }));
    };

    scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    scrollToBottom = () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    scrollToGroup = (groupKey) => {
        const el = this.groupRefs[groupKey];
        if (el) {
            const yOffset = -70;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            this.setState({ showNavigator: false });
        }
    };

    filterIBItem = (item) => {
        const { activeArchs } = this.state;

        const hasFilters =
            activeArchs.os?.length > 0 ||
            activeArchs.cpu?.length > 0 ||
            activeArchs.compiler?.length > 0;

        if (!hasFilters) return true;

        // Always keep nextIB entries visible
        if (item?.isIB === false && item?.next_ib === true) {
            return true;
        }

        // Keep entries visible if they do not carry architecture test info
        // (older / pre releases / commit-only style entries)
        if (!item.tests_archs || !Array.isArray(item.tests_archs) || item.tests_archs.length === 0) {
            return true;
        }

        return item.tests_archs.some((arch) => archMatchesFilters(arch, activeArchs));
    };

    filterIBGroup = (group) => {
        if (!group || !Array.isArray(group)) return [];
        return group.filter((item) => this.filterIBItem(item));
    };

    getFilteredData = () => {
        const { transformedData } = this.state;

        if (!transformedData || !Array.isArray(transformedData)) {
            return [];
        }

        return transformedData
            .map((group) => this.filterIBGroup(group))
            .filter((group) => group && group.length > 0);
    };

    getGroupKey = (group, index) => {
        if (!Array.isArray(group) || group.length === 0) {
            return `empty-group-${index}`;
        }

        const first = group[0] || {};
        const releaseName = first.release_name || first.id || 'unknown-release';
        const flavor = first.flavor || 'unknown-flavor';
        const size = group.length;

        return `${releaseName}-${flavor}-${size}-${index}`;
    };

    getGroupLabel = (group) => {
        if (!Array.isArray(group) || group.length === 0) return 'Unknown Release';

        const first = group[0] || {};
        if (first.isIB === false && first.next_ib === true) {
            return 'Next IB';
        }

        return first.release_name || first.id || 'Unknown Release';
    };

    renderFloatingToggle() {
        const { expandAllCommits, showFloatingControl } = this.state;

        const NAVBAR_OFFSET = 70;

        return (
            <div
                style={{
                    position: 'fixed',
                    right: '16px',
                    top: `${NAVBAR_OFFSET}px`,
                    zIndex: 1050
                }}
            >
                {showFloatingControl ? (
                    <div
                        className="d-flex align-items-center gap-2"
                        style={{ transition: 'all 0.2s ease' }}
                    >
                        <Button
                            variant={expandAllCommits ? 'outline-secondary' : 'primary'}
                            size="sm"
                            onClick={this.toggleAllCommits}
                            style={{
                                borderRadius: '999px',
                                padding: '0.55rem 0.95rem',
                                fontWeight: 700,
                                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.14)',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <FaCodeBranch size={14} />
                            {expandAllCommits
                                ? 'Hide All Commits & PRs'
                                : 'Show All Commits & PRs'}
                        </Button>

                        <button
                            onClick={this.hideFloatingButton}
                            title="Hide control"
                            style={miniToolButtonStyle}
                        >
                            <FaChevronUp size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={this.showFloatingButton}
                        title="Show commits control"
                        style={pinControlButtonStyle}
                    >
                        <FaChevronDown size={14} />
                    </button>
                )}
            </div>
        );
    }

    renderCornerButtons() {
        return (
            <>
                <div
                    style={{
                        position: 'fixed',
                        right: '16px',
                        bottom: '20px',
                        zIndex: 1050,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}
                >
                    <button
                        onClick={this.scrollToTop}
                        title="Go to top"
                        style={miniToolButtonStyle}
                    >
                        <FaArrowUp size={12} />
                    </button>

                    <button
                        onClick={this.scrollToBottom}
                        title="Go to bottom"
                        style={miniToolButtonStyle}
                    >
                        <FaArrowDown size={12} />
                    </button>

                    <button
                        onClick={this.toggleNavigator}
                        title="Show releases"
                        style={pinControlButtonStyle}
                    >
                        <FaThumbtack size={12} />
                    </button>
                </div>
            </>
        );
    }

    renderNavigator(groups) {
        const { showNavigator } = this.state;

        if (!showNavigator) return null;

        return (
            <>
                <div
                    onClick={this.toggleNavigator}
                    style={navigatorBackdropStyle}
                />

                <div style={navigatorOverlayStyle}>
                    <div style={navigatorHeaderStyle}>
                        <strong style={{ fontSize: '0.9rem', color: '#334155' }}>
                            Jump to release
                        </strong>

                        <button
                            onClick={this.toggleNavigator}
                            title="Close"
                            style={closeNavigatorButtonStyle}
                        >
                            <FaTimes size={12} />
                        </button>
                    </div>

                    <div style={navigatorListStyle}>
                        {groups.map((group, index) => {
                            const groupKey = this.getGroupKey(group, index);
                            const label = this.getGroupLabel(group);

                            return (
                                <button
                                    key={groupKey}
                                    onClick={() => this.scrollToGroup(groupKey)}
                                    title={label}
                                    style={navigatorItemStyle}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </>
        );
    }

    render() {
        const { releaseQue, activeArchs, expandAllCommits } = this.state;
        const filteredData = this.getFilteredData();

        const hasFilters =
            activeArchs.os?.length > 0 ||
            activeArchs.cpu?.length > 0 ||
            activeArchs.compiler?.length > 0;

        if (!filteredData || filteredData.length === 0) {
            return (
                <div className="text-center py-5">
                    <div className="text-secondary">
                        <h5 className="mb-2">No builds found</h5>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>
                            {hasFilters
                                ? 'No builds match the selected architectures'
                                : 'No data available'}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ position: 'relative' }}>
                {this.renderFloatingToggle()}
                {this.renderCornerButtons()}
                {this.renderNavigator(filteredData)}

                {filteredData.map((IBGroup, index) => {
                    const groupKey = this.getGroupKey(IBGroup, index);

                    return (
                        <div
                            key={groupKey}
                            ref={(el) => {
                                this.groupRefs[groupKey] = el;
                            }}
                        >
                            <IBGroupFrame
                                IBGroup={IBGroup}
                                releaseQue={releaseQue}
                                expandAllCommits={expandAllCommits}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }
}

const miniToolButtonStyle = {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
};

const pinControlButtonStyle = {
    width: '38px',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    background: 'rgba(255,255,255,0.98)',
    color: '#334155',
    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
};

const navigatorBackdropStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.18)',
    zIndex: 1090
};

const navigatorOverlayStyle = {
    position: 'fixed',
    top: '88px',
    right: '16px',
    width: '260px',
    maxHeight: '70vh',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.99)',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    boxShadow: '0 14px 34px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1100
};

const navigatorHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f8fafc'
};

const closeNavigatorButtonStyle = {
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const navigatorListStyle = {
    maxHeight: 'calc(70vh - 50px)',
    overflowY: 'auto',
    padding: '10px'
};

const navigatorItemStyle = {
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    marginBottom: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '0.84rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
};

export default IBGroups;