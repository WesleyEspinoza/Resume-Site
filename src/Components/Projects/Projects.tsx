import React from "react";
import "./Projects.css"

type ProjectsProps = {};
type ProjectsState = {};
class Projects extends React.Component<ProjectsProps, ProjectsState> {
    constructor(props: ProjectsProps, state: ProjectsState) {
        super(props);
        this.state = state
    }

    render() {
        return (
            <div className="ProjectsContainer">

            </div>
        )

    }
}

export default Projects