import React from "react";
import { Route } from "react-router-dom";
import {Col, Row} from "react-bootstrap";
import Home from "./home/Home";
import StationsMap from "./stationsMap/StationsMap";

type PageRouterProps = {};
type PageRouterState = {};

export default class PageRouter extends React.Component<PageRouterProps, PageRouterState> {
    state: PageRouterState = {};

    render() {
        return (
                <Row>
                    <Col>
                        <Route path="/" exact >
                            <Home/>
                        </Route>
                        <Route path="/stations-map">
                            <StationsMap/>
                        </Route>
                    </Col>
                </Row>
        );
    }
}