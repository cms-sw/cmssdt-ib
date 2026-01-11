import React, {Component} from "react";
import ReactDOM from "react-dom";
import Navbar from "react-bootstrap/es/Navbar";
import Nav from "react-bootstrap/es/Nav";
import {Button, Col, FormGroup, Glyphicon, MenuItem, Modal, Row} from "react-bootstrap";
import Dropdown from "react-bootstrap/es/Dropdown";
import {legend} from '../../relValConfig';
import { config } from "../../config";

const {urls} = config;

class RelValNavigation extends Component {

    constructor(props, context) {
        super(props, context);
        this.navNode = null;
        this.lastReportedHeight = 0;
        this.handleShow = this.handleShow.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.state = {
            show: false
        };
    }

    componentDidMount() {
        this.reportHeight();
    }

    componentDidUpdate() {
        this.reportHeight();
    }

    reportHeight() {
        if (!this.navNode || !this.props.onHeightChange) return;
        const domNode = ReactDOM.findDOMNode(this.navNode);
        if (!domNode) return;
        const height = domNode.offsetHeight;
        if (height !== this.lastReportedHeight) {
            this.lastReportedHeight = height;
            this.props.onHeightChange(height);
        }
    }

    handleClose() {
        this.setState({show: false});
    }

    handleShow() {
        this.setState({show: true});
    }

    render() {
        const {relvalInfo, que} = this.props;
        const modalHelp = (
            <Modal show={this.state.show} onHide={this.handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Legend</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {legend}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleClose}>Close</Button>
                </Modal.Footer>
            </Modal>
        );
        return (
            <Navbar fixedTop id={'navigation'} ref={(node) => { this.navNode = node; }}>
                <Navbar.Header>
                    <Navbar.Brand>
                        <p>
                        <Button bsSize="small" href={"#/ib/"+que+"_X"} >
                            <Glyphicon glyph="chevron-left"/>
                        </Button>
                            {" "}RelVals: {relvalInfo}
                        </p>
                    </Navbar.Brand>
                    <Navbar.Toggle/>
                    
                </Navbar.Header>
                <Navbar.Collapse onExited={() => this.reportHeight()}>
                    <Nav pullRight>
                        <button className="btn btn-default navbar-btn" onClick={this.handleShow}>
                            <Glyphicon glyph="question-sign"/> Legend
                        </button>
                        {' '}
                        <Dropdown id="dropdown-custom-2">
                            <Dropdown.Toggle>
                                <Glyphicon glyph="exclamation-sign"/> Report an issue with ...
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="super-colors">
                                {urls.issues.map((el) => {
                                    return <MenuItem href={el.url}>{el.name}</MenuItem>
                                })}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                    <Row>
                        {this.props.controlList.map(controls => {
                            return ([
                                <Col xs={12}>
                                    <Nav>
                                        <FormGroup>
                                            {controls}
                                        </FormGroup>
                                    </Nav>
                                </Col>
                            ])
                        })}
                    </Row>

                </Navbar.Collapse>
                {modalHelp}
            </Navbar>
        );
    }
}

export default RelValNavigation;
