import React from "react";
import "./Timeline.css"
import TimeNode from "./TimeNode/TimeNode";

type TimelineProps = {};
type TimelineState = {};
class Timeline extends React.Component<TimelineProps, TimelineState> {
    constructor(props: TimelineProps, state: TimelineState) {
        super(props);
        this.state = state
    }

    render() {
        return (
            <div className="TimelineContainer">
                <div className="Timeline">
                    <div className="DottedLine" />
                    <TimeNode date="October 21st 1998" text="Won the game of life" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />
                    <TimeNode date="October 21st 1998" text="" />
                    <TimeNode date="January 1st 2000" text="" />


                </div>
            </div>
        )

    }
}

export default Timeline