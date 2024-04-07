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
                <Button title="Acheivement Timeline" toolTip="Interactive time line of notable moments in my life." /> <Button title="Resume" toolTip="PDF copy of my resume." /> <Button title="How it's Made" toolTip="The process of making this site." />
            </div>
        );
    }
}

export default ButtonGroup