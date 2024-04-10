import React from "react";
import "./Card.css"

type CardProps = { title: string, };
type CardState = {};
class Card extends React.Component<CardProps, CardState> {
    constructor(props: CardProps, state: CardState) {
        super(props);
        this.state = state
    }

    render() {
        return (
            <div className="cardContainer">
                <h2 className="title">{this.props.title}</h2>
            </div>
        );
    }
}

export default Card