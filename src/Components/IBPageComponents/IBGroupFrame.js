import React, { PureComponent } from 'react';
import Commits from "./Commits";
import StatusLabels from "./StatusLabels";
import ComparisonTable from "./ComparisonTable";
import { Card } from "react-bootstrap";
import { checkIfCommitsAreEmpty, checkIfTableIsEmpty } from "../../Utils/processing";

/**
 * ib_date - field grouped by
 * isIB - true(IB)/ false(next release, integration build)
 * next_ib - is the record next IB build
 */

class IBGroupFrame extends PureComponent {

    getIbGroupType(IBGroup) {
        const firstIbFromList = IBGroup[0];
        const { isIB, next_ib } = firstIbFromList;

        if (isIB === true) return 'IB';
        if (isIB === false && next_ib === true) return 'nextIB';
        return 'fullBuild';
    }

    render() {
        const { IBGroup, releaseQue, expandAllCommits } = this.props;

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
                    return null; // hide empty IBs
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

        // Styling for nextIB
        const cardStyle = isNextIB
            ? {
                  border: '1px solid #93c5fd',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.12)',
                  background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)'
              }
            : {};

        const headerStyle = isNextIB
            ? {
                  background: 'linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)',
                  borderBottom: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
              }
            : {
                  display: 'flex',
                  alignItems: 'center'
              };

        return (
            <Card className="mb-3" style={cardStyle}>
                <Card.Header style={headerStyle}>
                    <strong>{panelHeader}</strong>

                    {isNextIB && (
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
                    )}
                </Card.Header>

                <Card.Body>
                    {statusLabels}
                    {comparisonTable}
                    <Commits
                        commitPanelProps={commitPanelProps}
                        data={IBGroup}
                        expandAllCommits={expandAllCommits}
                    />
                </Card.Body>
            </Card>
        );
    }
}

export default IBGroupFrame;