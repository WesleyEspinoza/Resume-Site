import React from "react";
import "./Button.css"

type ButtonProps = { title: string, toolTip: string, id: string };
type ButtonState = {};
class Button extends React.Component<ButtonProps, ButtonState> {
    constructor(props: ButtonProps, state: ButtonState) {
        super(props);
        this.state = state
    }

    scrollIntoView = () => {

        if (document) {
            const el = document.getElementById(this.props.id)
            if (el) {

                el.scrollIntoView({ behavior: "smooth" })

            }
        }

    }

    render() {
        return (
            <button onClick={this.scrollIntoView} className="ButtonContainer">
                <div className="ToolTip">{this.props.toolTip}</div>
                <h2 className="title">{this.props.title}</h2>
            </button>
        );
    }
}

export default Button