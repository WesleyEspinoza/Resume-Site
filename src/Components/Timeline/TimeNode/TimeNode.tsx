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

        console.log(process.env.FACT_API_KEY)

        fetch(`https://api.api-ninjas.com/v1/historicalevents?year=${year}`, {
            method: "GET",
            mode: 'cors',
            headers: {
                'Content-Type': "application/json",
                'X-Api-Key': process.env.FACT_API_KEY!
            },
        })
            .then(response => response.json())
            .then(data => {
                const fact = data[Math.floor(Math.random() * data.length)]
                this.setState({ ...this.state, funFact: fact.event });
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
                    <button onClick={() => this.getFact(this.props.date)}>{`Generate event that happened at some point in ${this.props.date}`}</button>
                    <div className="FunFact"> {this.state.funFact} </div>
                </div>
            </div >
        )

    }
}


export default TimeNode