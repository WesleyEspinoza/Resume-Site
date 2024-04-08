import React from "react";
import "./TimeNode.css"

type TimeNodeProps = { date: string, text: string };
type TimeNodeState = { funFact: "Test Fact" };
class TimeNode extends React.Component<TimeNodeProps, TimeNodeState> {

    constructor(props: TimeNodeProps, state: TimeNodeState) {
        super(props);
        this.state = state
    }


    render() {
        return (
            <div className="TimeNodeContainer">
                <div className="TimeNode">
                    <div className="InnerDot" />
                    <div className="OuterDot" />
                    <h1 className="Date">{this.props.date}</h1>
                    <div className="Text"> {this.props.text} </div>
                    <div className="FunFact"> {this.state.funFact} </div>
                </div>
            </div >
        )

    }
}


export default TimeNode