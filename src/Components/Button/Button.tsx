import React from "react";
import "./Button.css"

type ButtonProps = { title: string, toolTip: string };
type ButtonState = {};
class Button extends React.Component<ButtonProps, ButtonState> {
    constructor(props: ButtonProps, state: ButtonState) {
        super(props);
        this.state = state
    }

    render() {
        return (
            <button className="ButtonContainer">
                <div className="ToolTip">{this.props.toolTip}</div>
                <h2 className="title">{this.props.title}</h2>
            </button>
        );
    }
}

export default Button