import React from "react";
import "./Projects.css"
import projectData from "./ProjectData/ProjectData.json"
import Card from "./Card/Card";

type ProjectsProps = {};
type ProjectsState = {};
class Projects extends React.Component<ProjectsProps, ProjectsState> {
    constructor(props: ProjectsProps, state: ProjectsState) {
        super(props);
        this.state = state
    }

    render() {
        return (
            <div className="ProjectsContainer" id="ProjectsContainer">
                <h1 className="header">Projects</h1>
                {projectData.projects.map((project, index) => {
                    return <Card title={project.title} description={project.description} link={project.link} />
                })
                }
            </div >
        )

    }
}

export default Projects