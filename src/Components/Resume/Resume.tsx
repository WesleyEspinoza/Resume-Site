import React from "react";
import "./Resume.css"
import PDF from "../../PDF/ErickWesleyEspinozaResume.pdf";

type ResumeProps = {};
type ResumeState = {};
class Resume extends React.Component<ResumeProps, ResumeState> {
    constructor(props: ResumeProps, state: ResumeState) {
        super(props);
        this.state = state
    }

    render() {
        return (
            <div className="PDFContainer">
                <iframe title="Resume" className="ResumePreview" src={PDF}></iframe>
            </div>
        )

    }
}

export default Resume