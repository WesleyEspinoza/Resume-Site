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

    addNode = (year: number, text: string, i: number) => {
        const newNode = <TimeNode date={year.toString()} key={i} text={text} />
        const newNodes = this.state.nodes;
        newNodes.push(newNode);
        this.setState({ ...this.state, nodes: newNodes });
    }

    getYears = () => {
        let years = (this.state.endYear.getFullYear() - this.state.startYear) + 1;

        let text = "Radio Silence";
        let year = this.state.startYear
        for (var i = 0; i < years; i++) {

            switch (year) {
                case 1998:
                    text = "Won the Game of life!";
                    break;

                case 2000:
                    text = "Probably learned to walk, survived Y2K!";
                    break;

                case 2007:
                    text = "Migrated to the Unites States, learned to speak english.";
                    break;
                case 2008:
                    text = "Earned student of the year!";
                    break;

                case 2010:
                    text = "Graduated Elementary school!";
                    break;

                case 20012:
                    text = "Received a couple of Honor roll certificates.";
                    break;

                case 2016:
                    text = "First AP Computer Science Class!";
                    break;

                case 2017:
                    text = "Graduated High school!";
                    break;

                case 2018:
                    text = "Accepted into accelerated bachelors in Computer Science program.";
                    break;

                case 2020:
                    text = "Graduated College!";
                    break;

                case 2022:
                    text = "First software Engineer job.";
                    break;

                case 2024:
                    text = "Figuring it out.";
                    break;

                default:
                    text = "";
                    break;
            }

            if (text !== "") {
                this.addNode(year, text, i)
            }

            year++;
        }
    }

    componentDidMount(): void {
        this.getYears();
    }

    render() {
        return (
            <div className="TimelineContainer" id="TimelineContainer">
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