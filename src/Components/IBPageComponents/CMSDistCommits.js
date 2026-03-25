import React, { Component } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { getDisplayName, getPreviousIbTag } from "../../Utils/processing";
import { v4 as uuidv4 } from 'uuid';
import _ from 'underscore';

function isFromMergedCommit(pr) {
    if (pr.from_merge_commit === true) {
        return <span className="bi bi-arrow-repeat" />; 
    }
}

class CMSDistCommits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commitPanelProps: props.commitPanelProps,
            ibComparison: props.data
        };
    }

    render() {
        const { commitPanelProps, ibComparison } = this.state;

        return (
            <Card {...commitPanelProps} className="mb-3">
                <Card.Header>CMS Dist commits</Card.Header>
                <Card.Body>
                    <Container>
                        <Row className="mb-2">
                            <Col xs={12} md={8}>
                                <code>{'<Col xs={12} md={8} />'}</code>
                            </Col>
                            <Col xs={6} md={4}>
                                <code>{'<Col xs={6} md={4} />'}</code>
                            </Col>
                        </Row>

                        <Row className="mb-2">
                            <Col xs={6} md={4}>
                                <code>{'<Col xs={6} md={4} />'}</code>
                            </Col>
                            <Col xs={6} md={4}>
                                <code>{'<Col xs={6} md={4} />'}</code>
                            </Col>
                            <Col className="d-none d-md-block" md={4}>
                                <code>{'<Col xsHidden md={4} />'}</code>
                            </Col>
                        </Row>

                        <Row className="mb-2">
                            <Col xs={6} className="offset-6">
                                <code>{'<Col xs={6} xsOffset={6} />'}</code>
                            </Col>
                        </Row>

                        <Row className="mb-2">
                            <Col md={6} className="order-md-2">
                                <code>{'<Col md={6} mdPush={6} />'}</code>
                            </Col>
                            <Col md={6} className="order-md-1">
                                <code>{'<Col md={6} mdPull={6} />'}</code>
                            </Col>
                        </Row>
                    </Container>
                </Card.Body>
            </Card>
        );
    }
}

export default CMSDistCommits;
