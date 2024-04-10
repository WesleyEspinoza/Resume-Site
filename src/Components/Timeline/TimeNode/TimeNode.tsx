import React from "react";
import "./TimeNode.css"

type TimeNodeProps = { date: string, text: string };
type TimeNodeState = { funFact: string, factYear: string, factMonth: string, factDay: string };
class TimeNode extends React.Component<TimeNodeProps, TimeNodeState> {

    constructor(props: TimeNodeProps, state: TimeNodeState = { funFact: "", factYear: "", factMonth: "", factDay: "" }) {
        super(props);
        this.state = state
    }

    getFact = (year: string) => {
        fetch(`${process.env.REACT_APP_FACT_API_URL}historicalevents?year=${year}`, {
            method: "GET",
            mode: 'cors',
            headers: {
                'Content-Type': "application/json",
                'X-Api-Key': process.env.REACT_APP_FACT_API_KEY!
            },
        })
            .then(response => response.json())
            .then(data => {
                const fact = data[Math.floor(Math.random() * data.length)]
                this.setState({ ...this.state, funFact: fact.event, factYear: fact.year, factMonth: fact.month, factDay: fact.day });
            })
            .catch(error => {
                // Handle errors
            });
    }

    renderFact = () => {
        if (this.state.funFact === "" || this.state.funFact === undefined) {
            return <></>
        } else {
            return <><div className="FunFactDate"> {`Date: ${this.state.factMonth} - ${this.state.factDay} - ${this.state.factYear}`} </div>
                <div className="FunFact"> {this.state.funFact} </div></>
        }
    }


    render() {
        return (
            <div className="TimeNodeContainer">
                <div className="TimeNode">
                    <div className="InnerDot" />
                    <div className="OuterDot" />
                    <h1 className="Date">{this.props.date}</h1>
                    <div className="Text"> {this.props.text} </div>
                    {this.renderFact()}
                    {Number(this.props.date) < 2024 && <button className="factButton" onClick={() => this.getFact(this.props.date)}>{`Generate event that happened at some point in ${this.props.date}`}</button>}
                </div>
            </div >
        )

    }
}


export default TimeNode