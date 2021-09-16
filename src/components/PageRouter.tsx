import React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Home from "./home/Home";
import StationsMap from "./stationsMap/StatipnsMap";

type PageRouterProps = {};
type PageRouterState = {};

export default class PageRouter extends React.Component<PageRouterProps, PageRouterState> {
    state: PageRouterState = {};

    render() {
        return (
            <Router>
                <div>
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

                    <Route path="/" exact >
                        <Home/>
                    </Route>
                    <Route path="/stations-map">
                        <StationsMap/>
                    </Route>
                </div>
            </Router>
        );
    }
}