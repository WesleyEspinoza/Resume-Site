import React from "react";
import Button from "../Button/Button";
import "./ButtonGroup.css";

type ButtonGroupProps = {};
type ButtonGroupState = {};
class ButtonGroup extends React.Component<ButtonGroupProps, ButtonGroupState> {
    constructor(props: ButtonGroupProps, state: ButtonGroupState) {
        super(props);
        this.state = state
    }

    render() {
        return (
            <div className="ButtonGroupContainer">
                <Button title="Resume" toolTip="PDF copy of my resume." id="PDFContainer" /> <Button title="Projects" toolTip="Notable Projects" id="ProjectsContainer" />
            </div>
        );
    }
}

export default ButtonGroup