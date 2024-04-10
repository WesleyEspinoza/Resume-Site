import React from "react";
import "./Card.css"

type CardProps = { title: string, description: string, link: string };
type CardState = {};
class Card extends React.Component<CardProps, CardState> {
    constructor(props: CardProps, state: CardState) {
        super(props);
        this.state = state
    }

    rendergithubButton = () => {
        if (this.props.link === "") {
            return <></>
        } else {
            return <>
                <a target="_blank" rel="noopener noreferrer" href={this.props.link}>
                    <button className='githubButton' />
                </a>
            </>
        }
    }

    render() {
        return (
            <div className="cardContainer">
                <div className="cardContent">
                    <h2 className="title">{this.props.title}</h2>
                    <div className="description">{this.props.description}</div>
                    {this.rendergithubButton()}
                </div>

            </div>
        );
    }
}

export default Card