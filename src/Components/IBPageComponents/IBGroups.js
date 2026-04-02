import React, { Component } from 'react';
import IBGroupFrame from './IBGroupFrame';
import { groupAndTransformIBDataList } from '../../Utils/processing';
import PropTypes from 'prop-types';
import { OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { GoGitPullRequest } from "react-icons/go";
import {
    FaCodeBranch,
    FaPlus,
    FaMinus,
    FaThumbtack,
    FaArrowUp,
    FaArrowDown,
    FaTimes,
    FaExclamationTriangle,
    FaWifi,
    FaLock,
    FaEye,
    FaEyeSlash
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
        !hasOsFilter || activeArchs.os.some((filter) => os.includes(filter) || filter.includes(os));
    const matchesCpu =
        !hasCpuFilter || activeArchs.cpu.some((filter) => cpu.includes(filter) || filter.includes(cpu));
    const matchesCompiler =
        !hasCompilerFilter ||
        activeArchs.compiler.some((filter) => compiler.includes(filter) || filter.includes(compiler));

    return matchesOs && matchesCpu && matchesCompiler;
};

const getArchStateSignature = (activeArchs = {}) =>
    JSON.stringify({
        os: Array.isArray(activeArchs.os) ? [...activeArchs.os].sort() : [],
        cpu: Array.isArray(activeArchs.cpu) ? [...activeArchs.cpu].sort() : [],
        compiler: Array.isArray(activeArchs.compiler) ? [...activeArchs.compiler].sort() : []
    });

class IBGroups extends Component {
    static propTypes = {
        data: PropTypes.array,
        releaseQue: PropTypes.string.isRequired,
        activeArchs: PropTypes.object,
        loading: PropTypes.bool,
        error: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object
        ]),
        isUnauthorized: PropTypes.bool,
        isNetworkError: PropTypes.bool,
        loadingText: PropTypes.string
    };

    static defaultProps = {
        data: [],
        activeArchs: { os: [], cpu: [], compiler: [] },
        loading: false,
        error: null,
        isUnauthorized: false,
        isNetworkError: false,
        loadingText: 'Loading builds...'
    };

    constructor(props) {
        super(props);

        this.groupRefs = {};
        this.toggleLoadingTimer = null;

        this.state = {
            originalData: props.data || [],
            transformedData: groupAndTransformIBDataList(props.data || []),
            releaseQue: props.releaseQue,
            activeArchs: props.activeArchs || { os: [], cpu: [], compiler: [] },
            activeArchsSignature: getArchStateSignature(props.activeArchs || { os: [], cpu: [], compiler: [] }),
            expandAllCommits: false,
            showNavigator: false,
            isToggleLoading: false,
            collapsedGroups: {}
        };
    }
    toggleGroupCollapse = (groupKey) => {
        this.setState((prevState) => ({
            collapsedGroups: {
                ...prevState.collapsedGroups,
                [groupKey]: !prevState.collapsedGroups[groupKey]
            }
        }));
    };
  toggleGroupCollapse = (groupKey) => {
    this.setState((prevState) => ({
        collapsedGroups: {
            ...prevState.collapsedGroups,
            [groupKey]: !prevState.collapsedGroups[groupKey]
        }
    }));
};

    toggleAllReleasePanels = () => {
        const filteredData = this.getFilteredData();

        if (!filteredData || filteredData.length === 0) return;

        const allCollapsed = filteredData.every((group, index) => {
            const groupKey = this.getGroupKey(group, index);
            return !!this.state.collapsedGroups[groupKey];
        });

        const nextCollapsedGroups = {};

        filteredData.forEach((group, index) => {
            const groupKey = this.getGroupKey(group, index);
            nextCollapsedGroups[groupKey] = !allCollapsed;
        });

        this.setState({
            collapsedGroups: nextCollapsedGroups
        });
    };
    static getDerivedStateFromProps(nextProps, prevState) {
        const nextArchs = nextProps.activeArchs || { os: [], cpu: [], compiler: [] };
        const nextArchsSignature = getArchStateSignature(nextArchs);

        if (
            nextProps.data !== prevState.originalData ||
            nextProps.releaseQue !== prevState.releaseQue ||
            nextArchsSignature !== prevState.activeArchsSignature
        ) {
            const transformedData = groupAndTransformIBDataList(nextProps.data || []);

            return {
                originalData: nextProps.data || [],
                transformedData,
                releaseQue: nextProps.releaseQue,
                activeArchs: nextArchs,
                activeArchsSignature: nextArchsSignature
            };
        }
        return null;
    }

    componentWillUnmount() {
        if (this.toggleLoadingTimer) {
            clearTimeout(this.toggleLoadingTimer);
        }
    }

    toggleAllCommits = () => {
        if (this.state.isToggleLoading) return;

        this.setState(
            (prevState) => ({
                expandAllCommits: !prevState.expandAllCommits,
                isToggleLoading: true
            }),
            () => {
                this.toggleLoadingTimer = setTimeout(() => {
                    this.setState({ isToggleLoading: false });
                }, 450);
            }
        );
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
        const flavor = first.flavor || first.release_queue || 'unknown-flavor';
        const ibDate = first.ib_date || first.start_time || first.date || '';
        const nextIbFlag = first.next_ib ? 'nextib' : 'regular';
        const isIbFlag = first.isIB === false ? 'nonib' : 'ib';

        return `${releaseName}-${flavor}-${ibDate}-${nextIbFlag}-${isIbFlag}`;
    };
    getGroupLabel = (group) => {
        if (!Array.isArray(group) || group.length === 0) return 'Unknown Release';

        const first = group[0] || {};
        if (first.isIB === false && first.next_ib === true) {
            return 'Next IB';
        }

        return first.release_name || first.id || 'Unknown Release';
    };
    renderStatusCard = ({
        icon,
        title,
        message,
        tone = 'neutral'
    }) => {
        const toneStyles = {
            neutral: {
                background: '#f8fafc',
                border: '#e2e8f0',
                iconBg: '#e2e8f0',
                iconColor: '#475569',
                titleColor: '#334155',
                messageColor: '#64748b'
            },
            warning: {
                background: '#fff7ed',
                border: '#fdba74',
                iconBg: '#ffedd5',
                iconColor: '#ea580c',
                titleColor: '#9a3412',
                messageColor: '#c2410c'
            },
            danger: {
                background: '#fef2f2',
                border: '#fca5a5',
                iconBg: '#fee2e2',
                iconColor: '#dc2626',
                titleColor: '#991b1b',
                messageColor: '#b91c1c'
            },
            info: {
                background: '#eff6ff',
                border: '#93c5fd',
                iconBg: '#dbeafe',
                iconColor: '#2563eb',
                titleColor: '#1d4ed8',
                messageColor: '#1e40af'
            }
        };

        const colors = toneStyles[tone] || toneStyles.neutral;

        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div
                    style={{
                        width: '100%',
                        maxWidth: '560px',
                        background: colors.background,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '16px',
                        padding: '28px 24px',
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
                        textAlign: 'center'
                    }}
                >
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: colors.iconBg,
                            color: colors.iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px auto',
                            fontSize: '22px'
                        }}
                    >
                        {icon}
                    </div>

                    <h5
                        className="mb-2"
                        style={{
                            color: colors.titleColor,
                            fontWeight: 700
                        }}
                    >
                        {title}
                    </h5>

                    <p
                        className="mb-0"
                        style={{
                            color: colors.messageColor,
                            fontSize: '0.97rem',
                            lineHeight: 1.5
                        }}
                    >
                        {message}
                    </p>
                </div>
            </div>
        );
    };

    renderPageLoader() {
        const { loadingText } = this.props;

        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div
                    style={{
                        minHeight: '220px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '14px'
                    }}
                >
                    <Spinner animation="border" role="status" style={{ width: '2.6rem', height: '2.6rem' }} />
                    <div style={{ color: '#475569', fontWeight: 600 }}>{loadingText}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        Please wait while release data is being loaded
                    </div>
                </div>
            </div>
        );
    }

    renderFloatingToggle() {
        const { expandAllCommits, isToggleLoading } = this.state;
        const NAVBAR_OFFSET = 72;

        return (
            <div
                style={{
                    position: 'fixed',
                    right: '16px',
                    top: `${NAVBAR_OFFSET}px`,
                    zIndex: 1050
                }}
            >
                <OverlayTrigger
                    placement="left"
                    overlay={
                        <Tooltip id="commits-toggle-tooltip">
                            {isToggleLoading
                                ? 'Updating commits & PRs...'
                                : expandAllCommits
                                  ? 'Collapse all commits & PRs'
                                  : 'Expand all commits & PRs'}
                        </Tooltip>
                    }
                >
                    <button
                        onClick={this.toggleAllCommits}
                        disabled={isToggleLoading}
                        aria-label={expandAllCommits ? 'Collapse all commits and PRs' : 'Expand all commits and PRs'}
                        style={{
                            ...floatingToggleButtonStyle,
                            background: expandAllCommits ? '#1d4ed8' : '#ffffff',
                            color: expandAllCommits ? '#ffffff' : '#334155',
                            border: expandAllCommits ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                            position: 'relative',
                            overflow: 'visible',
                            opacity: isToggleLoading ? 0.88 : 1,
                            cursor: isToggleLoading ? 'wait' : 'pointer'
                        }}
                    >
                        {isToggleLoading ? (
                            <Spinner animation="border" size="sm" role="status" />
                        ) : (
                            <>
                                <GoGitPullRequest size={20} />
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: expandAllCommits ? '#ef4444' : '#22c55e',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        lineHeight: 1,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                                    }}
                                >
                                    {expandAllCommits ? <FaMinus size={8} /> : <FaPlus size={8} />}
                                </span>
                            </>
                        )}
                    </button>
                </OverlayTrigger>
            </div>
        );
    }

    renderCornerButtons() {
            const filteredData = this.getFilteredData();

            const allCollapsed =
                filteredData.length > 0 &&
                filteredData.every((group, index) => {
                    const groupKey = this.getGroupKey(group, index);
                    return !!this.state.collapsedGroups[groupKey];
                });

            return (
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
                        onClick={this.toggleAllReleasePanels}
                        title={allCollapsed ? "Show all releases" : "Hide all releases"}
                        style={miniToolButtonStyle}
                    >
                        {allCollapsed ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
                    </button>
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
        const { releaseQue, activeArchs, expandAllCommits, collapsedGroups } = this.state;
        const { loading, error, isUnauthorized, isNetworkError } = this.props;

        const filteredData = this.getFilteredData();

        const hasFilters =
            activeArchs.os?.length > 0 ||
            activeArchs.cpu?.length > 0 ||
            activeArchs.compiler?.length > 0;

        if (loading) {
            return this.renderPageLoader();
        }

        if (isUnauthorized) {
            return this.renderStatusCard({
                icon: <FaLock />,
                title: 'Session expired',
                message: 'Your session has expired. Please refresh the page and sign in again.',
                tone: 'warning'
            });
        }

        if (isNetworkError) {
            return this.renderStatusCard({
                icon: <FaWifi />,
                title: 'Network issue',
                message: 'Unable to load release data. Please check your network connection and try again.',
                tone: 'warning'
            });
        }

        if (error) {
            const message =
                typeof error === 'string'
                    ? error
                    : error?.message || 'Something went wrong while loading the release data.';

            return this.renderStatusCard({
                icon: <FaExclamationTriangle />,
                title: 'Failed to load builds',
                message,
                tone: 'danger'
            });
        }

        if (!filteredData || filteredData.length === 0) {
            return this.renderStatusCard({
                icon: <FaCodeBranch />,
                title: 'No builds found',
                message: hasFilters
                    ? 'No builds match the selected architectures. Try changing or clearing the filters.'
                    : 'No data available for this release.',
                tone: 'info'
            });
        }

        return (
            <div style={{ position: 'relative' }}>
                {this.renderFloatingToggle()}
                {this.renderCornerButtons()}
                {this.renderNavigator(filteredData)}

               {filteredData.map((IBGroup, index) => {
                    const groupKey = this.getGroupKey(IBGroup, index);
                    const isCollapsed = !!collapsedGroups[groupKey];

                    return (
                        <div
                            key={groupKey}
                            ref={(el) => {
                                if (el) {
                                    this.groupRefs[groupKey] = el;
                                } else {
                                    delete this.groupRefs[groupKey];
                                }
                            }}
                        >
                            <IBGroupFrame
                                IBGroup={IBGroup}
                                releaseQue={releaseQue}
                                expandAllCommits={expandAllCommits}
                                isCollapsed={isCollapsed}
                                onToggleCollapse={() => this.toggleGroupCollapse(groupKey)}
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

const floatingToggleButtonStyle = {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.14)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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