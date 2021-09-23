import React from 'react';
import './App.css';
import {BrowserRouter as Router, Link} from "react-router-dom";
import {Col, Container, Row} from "react-bootstrap";
import PageRouter from "./components/PageRouter";
import { useGetMetricsQuery } from './store/services/MetricsService'

function App() {
    return (
        <Router>
            <Container>
                <Row>
                    <Col md={3}>
                        <nav>
                            <ul>
                                <li>
                                    <Link to="/">Home</Link>
                                </li>
                                <li>
                                    <Link to="/stations-map">Stations Map</Link>
                                </li>
                            </ul>
                        </nav>
                    </Col>
                    <Col md={9}>
                        <PageRouter/>
                    </Col>
                </Row>
            </Container>
        </Router>
    );
}

export default App;
