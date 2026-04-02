import React, { PureComponent } from 'react';
import Commits from "./Commits";
import StatusLabels from "./StatusLabels";
import ComparisonTable from "./ComparisonTable";
import { Card } from "react-bootstrap";
import { checkIfCommitsAreEmpty, checkIfTableIsEmpty } from "../../Utils/processing";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

class IBGroupFrame extends PureComponent {

    getIbGroupType(IBGroup) {
        const firstIbFromList = IBGroup[0];
        const { isIB, next_ib } = firstIbFromList;

        if (isIB === true) return 'IB';
        if (isIB === false && next_ib === true) return 'nextIB';
        return 'fullBuild';
    }

    render() {
        const { IBGroup, releaseQue, expandAllCommits, isCollapsed, onToggleCollapse } = this.props;

        const firstIbFromList = IBGroup[0];
        if (!firstIbFromList) {
            return <div><h1>Error: IB group is empty</h1></div>;
        }

        let statusLabels = null;
        let comparisonTable = null;
        let commitPanelProps = {};
        let panelHeader = null;
        let showOnlyIbTag = false;

        const ibGroupType = this.getIbGroupType(IBGroup);
        const isNextIB = ibGroupType === 'nextIB';

        const ibTagDropdown = StatusLabels.renderIBTag(IBGroup, ibGroupType);

        switch (ibGroupType) {
            case 'IB': {
                const isIBGroupTableEmpty = checkIfTableIsEmpty({
                    fieldsToCheck: ['builds', 'utests', 'relvals', 'addons', 'dupDict'],
                    IBGroup: IBGroup
                });

                const isCommitsEmpty = checkIfCommitsAreEmpty({
                    IBGroup: IBGroup
                });

                if (isCommitsEmpty && isIBGroupTableEmpty) {
                    return null;
                }

                panelHeader = firstIbFromList.release_name;

                if (!isIBGroupTableEmpty) {
                    comparisonTable = (
                        <ComparisonTable
                            data={IBGroup}
                            releaseQue={releaseQue}
                        />
                    );
                }

                commitPanelProps = {
                    defaultExpanded: !isCommitsEmpty,
                };
                break;
            }

            case 'nextIB':
                showOnlyIbTag = true;
                panelHeader = 'nextIB';
                break;

            case 'fullBuild':
                showOnlyIbTag = true;
                panelHeader = firstIbFromList.release_name;
                break;

            default:
                console.error("wrong case: " + ibGroupType);
        }

        statusLabels = (
            <StatusLabels
                IBGroup={IBGroup}
                ibGroupType={ibGroupType}
                showOnlyIbTag={showOnlyIbTag}
            />
        );

        const cardStyle = isNextIB
            ? {
                  border: '1px solid #93c5fd',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.12)',
                  background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)'
              }
            : {};

        const headerStyle = {
            background: 'linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)',
            borderBottom: '1px solid #bfdbfe',
            color: '#1d4ed8',
            display: 'flex',
            justifyContent: isNextIB ? 'center' : 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '0.55rem 0.9rem'
        };

        return (
            <Card className="mb-3" style={cardStyle}>
                <Card.Header
                    style={headerStyle}
                    onClick={onToggleCollapse}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onToggleCollapse();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    title={isCollapsed ? `Show ${panelHeader}` : `Hide ${panelHeader}`}
                >
                    {isNextIB ? (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            width: '100%'
        }}
    >
        <strong>{panelHeader}</strong>

        <span
            style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                background: '#2563eb',
                color: '#ffffff'
            }}
        >
            Upcoming
        </span>

        <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            {ibTagDropdown}
        </div>
    </div>
) : (
    <>
         <strong>{panelHeader}</strong>

                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#1d4ed8',
                            fontSize: '0.95rem',
                            marginLeft: 'auto'
                        }}
                    >
                        {isCollapsed ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </>
            )}
                </Card.Header>

                {!isCollapsed && (
                    <Card.Body style={{ padding: "0.25rem 0.5rem 0.5rem 0.5rem" }}>
                        {statusLabels}
                        {comparisonTable}
                        <Commits
                            commitPanelProps={commitPanelProps}
                            data={IBGroup}
                            expandAllCommits={expandAllCommits}
                        />
                    </Card.Body>
                )}
            </Card>
        );
    }
}

export default IBGroupFrame;