import React, {RefObject, useEffect } from "react"
import MapD3 from "./d3/MapD3"
import {Col, Row} from "react-bootstrap"
import {useGetMetricsQuery} from "../../store/services/MetricsService"
import { useAppSelector } from '../../store/Hooks'
import {RootState} from "../../store/MainStore"

const d3Ref: RefObject<SVGSVGElement> = React.createRef<SVGSVGElement>();
let graph: MapD3 | undefined;

export default function StationsMap() {
    const {data, error, isLoading} = useGetMetricsQuery('')
    const countries = useAppSelector((state: RootState) => state.metrics.Countries)
    const all = useAppSelector((state: RootState) => state.metrics.All)
    useEffect(() => {
        if (d3Ref) {
            graph = new MapD3(d3Ref.current);
            graph.initialize()
        }
        return () => {
            if (graph) graph.dispose();
        }
    }, []);

    useEffect(() => {
        if (countries && all && graph) {
            graph.update(countries, all);
        }

    },[countries, all]);
    return (
        <Row>
            <Col>
                <Row>
                    <Col>
                        <svg ref={d3Ref}
                             height="700"
                             preserveAspectRatio="xMinYMin slice"
                             width="100%"/>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {error ? (
                            <>Oh no, there was an error</>
                        ) : isLoading ? (
                            <>Loading...</>
                        ) : data ? (
                            <>
                                <h3>{data.status}</h3>
                                <p>{data.response[0].Country}</p>
                            </>
                        ) : null}
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}