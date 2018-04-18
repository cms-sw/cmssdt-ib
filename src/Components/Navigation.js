import React, {Component} from "react";
import Navbar from "react-bootstrap/es/Navbar";
import NavDropdown from "react-bootstrap/es/NavDropdown";
import Nav from "react-bootstrap/es/Nav";
import NavItem from "react-bootstrap/es/NavItem";
import {LinkContainer} from "react-router-bootstrap";
import uuid from "uuid";
import {Button, Col, DropdownButton, Glyphicon, MenuItem, Modal, Popover, Row, Tooltip} from "react-bootstrap";
import config from '../config';
import Dropdown from "react-bootstrap/es/Dropdown";

const {urls} = config;

class Navigation extends Component {

    constructor(props, context) {
        super(props, context);
        this.handleShow = this.handleShow.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.state = {
            show: false
        };
    }

    handleClose() {
        this.setState({show: false});
    }

    handleShow() {
        this.setState({show: true});
    }

    render() {
        // TODO goes to constructor
        let importantLinks = [];
        let olderLinks = [];

        if (this.props.toLinks) {
            let reversed = this.props.toLinks.slice(0).reverse();
            let renderedLinks = reversed.map(item => {
                return (
                    <LinkContainer key={uuid.v4()} to={'/ib/' + item} activeClassName="active">
                        <NavItem>{item}</NavItem>
                    </LinkContainer>
                )
            });
            importantLinks = renderedLinks.slice(0, 3);
            olderLinks = renderedLinks.slice(3);
        }
        // TODO ---------

        // const popover = (
        //     <Popover id="modal-popover" title="popover">
        //         very popover. such engagement
        //     </Popover>
        // );
        // const tooltip = <Tooltip id="modal-tooltip">wow.</Tooltip>;
        const modalHelp = (
            <Modal show={this.state.show} onHide={this.handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Explanations</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/*<h4> ...Work in progress</h4>*/}
                    <p>
                        <a class="btn label label-success"><span class="glyphicon glyphicon-ok-circle"/></a> - all test
                        were successful
                    </p>
                    <p>
                        <a class="btn label label-warning">14</a> - warnings
                    </p>
                    <p>
                        <a class="btn label label-danger">14</a> - errors
                    </p>
                    <p>
                        <a class="btn label label-success">130*</a> <a class="btn label label-warning">130*</a> <a
                        class="btn label label-danger">130*</a> - results are still updating

                    </p>
                    <p>
                        <span class="glyphicon glyphicon-refresh"/><span> HLT Validation </span> - test results are not
                        ready
                    </p>
                    <p>
                        <a><span class="glyphicon glyphicon-list-alt"/><span> HLT Validation </span></a>- test results
                        are ready
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleClose}>Close</Button>
                </Modal.Footer>
            </Modal>
        );

        return (
            <Navbar fixedTop id={'navigation'}>
                <Navbar.Header>
                    <Navbar.Brand>
                        <p>CMSSW IB page</p>
                    </Navbar.Brand>
                    <Navbar.Toggle/>
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        {importantLinks}
                        <NavDropdown eventKey={3} title="Older releases" id="basic-nav-dropdown">
                            {olderLinks}
                        </NavDropdown>
                    </Nav>
                    <Nav pullRight>
                        <button className="btn btn-default navbar-btn" onClick={this.handleShow}>
                            <Glyphicon glyph="question-sign"/> Help
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
                        <Col xs={12}>
                            <Nav>
                                {this.props.flaworControl}
                            </Nav>
                        </Col>
                        <Col xs={12}>
                            <Nav>
                                {this.props.archControl}
                            </Nav>
                        </Col>
                    </Row>
                </Navbar.Collapse>
                {modalHelp}
            </Navbar>
        );
    }
}

export default Navigation;
