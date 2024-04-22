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

    sharePDF = async () => {
        if (navigator.share) {
            await navigator.share(PDF)
        } else {
            alert("Failed, Try again.")
        }

    }

    render() {
        return (
            <div className="PDFContainer" id="PDFContainer">

                <iframe title="Resume" className="ResumePreview" src={PDF}></iframe>
                <a href={PDF}>
                    <button className="PDFDownload">Download Resume</button>
                </a>

            </div>
        )

    }
}

export default Resume