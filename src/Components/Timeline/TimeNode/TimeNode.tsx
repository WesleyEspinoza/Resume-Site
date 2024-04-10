import React from "react";
import "./TimeNode.css"

type TimeNodeProps = { date: string, text: string };
type TimeNodeState = { funFact: string };
class TimeNode extends React.Component<TimeNodeProps, TimeNodeState> {

    constructor(props: TimeNodeProps, state: TimeNodeState = { funFact: "Get a fun Fact!" }) {
        super(props);
        this.state = state
    }

    getFact = (year: string) => {
        const myHeaders = new Headers();
        myHeaders.append("X-Api-Key", process.env.FACT_API_KEY!);
        myHeaders.append("Content-Type", "application/json");

        fetch(`https://api.api-ninjas.com/v1/historicalevents?text=${year}`, {
            method: "GET",
            headers: myHeaders,
            credentials: "include", // Include cookies (if needed)
        })
            .then(response => response.json())
            .then(data => {
                const fact = data[Math.floor(Math.random() * data.length)]
                this.setState({ ...this.state, funFact: fact });
                console.log(this.state.funFact)
            })
            .catch(error => {
                // Handle errors
            });
    }


    render() {
        return (
            <div className="TimeNodeContainer">
                <div className="TimeNode">
                    <div className="InnerDot" />
                    <div className="OuterDot" />
                    <h1 className="Date">{this.props.date}</h1>
                    <div className="Text"> {this.props.text} </div>
                    <button onClick={() => this.getFact(this.props.date)}>{`${this.state.funFact}`}</button>
                    <div className="FunFact"> {this.state.funFact} </div>
                </div>
            </div >
        )

    }
}


export default TimeNode