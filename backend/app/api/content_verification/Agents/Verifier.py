import os
from phi.agent import Agent, RunResponse
from phi.model.google import Gemini
from dotenv import load_dotenv
load_dotenv()

def Verify(filepath):
    # Initialize the Verifier agent with specified model and tools
    Verifier = Agent(
        name="Verifier",
        model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
        tools=[]
    )

    # Create a directory for verified reports if it doesn't exist
    revisedFilepath = filepath[0:-9]
    verified_dir = f'{revisedFilepath}/verified'
    output_dir = f'{revisedFilepath}/output'
    os.makedirs(verified_dir, exist_ok=True)

    try:
        # Prepare a report list
        report_lines = []

        # Iterate through all files in the output directory
        for filename in os.listdir(output_dir):
            if filename.endswith('.txt'):
                file_path = os.path.join(output_dir, filename)

                # Read the content of each file
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()

                # Define the prompt for verification
                prompt = (
                    "You are a specialized legal verification analyst with expertise in authenticity assessment and AI-generated content detection. "
                    "\nDocument Details:"
                    f"Case briefing for review: {content}"
                    "\nAnalysis Framework:"
                    "1. Content Authentication Assessment:"
                    "   - Natural language patterns"
                    "   - Writing style consistency"
                    "   - Technical terminology usage"
                    "   - Document structure analysis"
                    "   - Citation patterns and formats"
                    "\n2. AI Content Detection Protocol:"
                    "   - Linguistic pattern analysis"
                    "   - Stylometric evaluation"
                    "   - Contextual coherence assessment"
                    "   - Technical indicator identification"
                    "   - Statistical pattern recognition"
                    "\n3. Verification Criteria:"
                    "   - Source authenticity indicators"
                    "   - Document integrity markers"
                    "   - Professional formatting standards"
                    "   - Legal terminology accuracy"
                    "   - Citation validity measures"
                    "\n4. Risk Assessment Parameters:"
                    "   - AI content percentage estimation"
                    "   - Authenticity confidence level"
                    "   - Quality assurance metrics"
                    "   - Professional standards compliance"
                    "   - Legal requirement adherence"
                    "\nVerification Report Structure:"
                    "1. Executive Assessment:"
                    "   - Overall authenticity determination"
                    "   - AI content percentage estimate"
                    "   - Critical findings summary"
                    "   - Verification recommendation"
                    "\n2. Detailed Analysis:"
                    "   - Content authenticity indicators"
                    "   - AI detection results"
                    "   - Quality assessment findings"
                    "   - Risk evaluation outcomes"
                    "\n3. Supporting Evidence:"
                    "   - Specific authenticity markers"
                    "   - Pattern analysis results"
                    "   - Statistical evaluations"
                    "   - Comparative assessments"
                    "\n4. Verification Decision:"
                    "   - Clear recommendation"
                    "   - Supporting rationale"
                    "   - Risk considerations"
                    "   - Required actions"
                    "\nQuality Control Measures:"
                    "- Multiple verification methods"
                    "- Cross-validation protocols"
                    "- Bias elimination procedures"
                    "- Standardized assessment criteria"
                    "\nOutput Requirements:"
                    "- Clear verification recommendation"
                    "- Detailed supporting analysis"
                    "- Specific evidence citations"
                    "- Risk level assessment"
                    "- Required follow-up actions"
                    "\nDecision Criteria:"
                    "- Automatic rejection if AI content >20%"
                    "- Quality threshold requirements"
                    "- Professional standard compliance"
                    "- Legal requirement adherence"
                )

                # Run the Verifier agent with the prompt
                run: RunResponse = Verifier.run(prompt)
                
                # Prepare report line with filename and recommendation
                recommendation = run.content.strip()
                report_lines.append(f"{filename}: {recommendation}")

        # Define output file path for the verification report
        report_filepath = os.path.join(verified_dir, 'Verification_Report.txt')
        
        # Write the report to a file in the verified directory
        with open(report_filepath, 'w', encoding='utf-8') as report_file:
            report_file.write('\n'.join(report_lines))
        
        return f"Verification report written to {report_filepath}"
    
    except Exception as e:
        return f"An error occurred: {e}"
