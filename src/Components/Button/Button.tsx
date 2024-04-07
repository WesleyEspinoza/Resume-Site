import React from "react";
import "./Button.css"

type ButtonProps = { title: string };
type ButtonState = {};
class Button extends React.Component<ButtonProps, ButtonProps> {
    constructor(props: ButtonProps) {
        super(props);
    }

    render() {
        return (
            <div className="ButtonContainer">
                <h2>{this.props.title}</h2>
            </div>
        );
    }
}

export default Button