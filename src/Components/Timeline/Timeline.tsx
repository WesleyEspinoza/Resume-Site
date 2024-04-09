import React from "react";
import "./Timeline.css"
import TimeNode from "./TimeNode/TimeNode";

type TimelineProps = {};
type TimelineState = { nodes: any[], startYear: number, endYear: Date };
class Timeline extends React.Component<TimelineProps, TimelineState> {
    constructor(props: TimelineProps, state: TimelineState) {
        super(props);
        this.state = { ...state, nodes: [], startYear: 1998, endYear: new Date() }
    }

    getYears = () => {
        const date2 = "10-21-1998";
        let years = (this.state.endYear.getFullYear() - new Date(date2).getFullYear()) + 1;

        let year = this.state.startYear
        for (var i = 0; i < years; i++) {
            const newNode = <TimeNode date={`${year}`} key={i} text="Radio Silence" />
            const newNodes = this.state.nodes;
            year++;
            newNodes.push(newNode);
            this.setState({ ...this.state, nodes: newNodes });

        }
    }
    componentDidMount(): void {
        this.getYears();
        console.log(this.state.nodes)
    }


    render() {
        return (
            <div className="TimelineContainer">
                <div className="Timeline">
                    <div className="DottedLine" />
                    {this.state.nodes.map((node, index) => {
                        return node
                    })}
                </div>
            </div>
        )
    }
}

export default Timeline