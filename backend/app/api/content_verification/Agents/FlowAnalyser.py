import os
from phi.agent import Agent, RunResponse
from phi.model.google import Gemini
from phi.tools.file import FileTools
from dotenv import load_dotenv
load_dotenv()

def FlowAnalysis(filepath):
    # Initialize the Analyzer agent with specified model and tools
    Analyzer = Agent(
        name="Analyzer",
        model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
        debug_mode=True
    )

    # Check if the output directory exists, if not, create it
    revisedFilepath = filepath[0:-9]
    output_dir = f'{revisedFilepath}/output'
    os.makedirs(output_dir, exist_ok=True)

    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    try:
        # Define the analysis prompt
        prompt = (
            "You are a senior legal analyst specializing in case assessment and quality control. "
            "\nDocument Analysis Parameters:"
            f"Review the following case material: {content}"
            "\nAnalysis Framework:"
            "1. Case Structure Evaluation:"
            "   - Chronological sequence of events"
            "   - Causal relationships between incidents"
            "   - Key stakeholder interactions"
            "   - Decision points and outcomes"
            "\n2. Scenario Connectivity Assessment:"
            "   - Internal logical consistency"
            "   - Temporal alignment of events"
            "   - Stakeholder motivation coherence"
            "   - Environmental and contextual consistency"
            "\n3. Gap Analysis Requirements:"
            "   - Missing factual elements"
            "   - Unexplained transitions"
            "   - Incomplete stakeholder profiles"
            "   - Documentation gaps"
            "   - Procedural oversights"
            "\n4. Consistency Verification:"
            "   - Internal fact validation"
            "   - Timeline verification"
            "   - Legal principle application"
            "   - Procedural compliance"
            "\nReport Structure:"
            "1. Executive Summary:"
            "   - Overall case coherence assessment"
            "   - Critical findings summary"
            "   - Priority concerns"
            "\n2. Detailed Analysis:"
            "   - Scenario interconnections"
            "   - Supporting evidence quality"
            "   - Procedural completeness"
            "\n3. Gap Identification:"
            "   - Material omissions"
            "   - Logical inconsistencies"
            "   - Evidence deficiencies"
            "\n4. Recommendations:"
            "   - Required additional documentation"
            "   - Suggested clarifications"
            "   - Process improvements"
            "\nQuality Control Measures:"
            "- Verify all cited documents"
            "- Cross-reference statements"
            "- Validate chronological order"
            "- Assess evidence completeness"
            "- Evaluate procedural compliance"
            "\nOutput Requirements:"
            "- Present findings in clear, professional language"
            "- Prioritize issues by significance"
            "- Provide specific examples for identified issues"
            "- Include actionable recommendations"
            "- Reference specific sections of source material"
        )

        # Run the Analyzer agent with the analysis prompt
        run: RunResponse = Analyzer.run(prompt)
        
        # Prepare output content
        analysis_content = run.content
        
        # Define output file path
        output_filepath = os.path.join(output_dir, 'Analysis_Report.txt')
        
        # Write analysis report to a file in the output directory
        with open(output_filepath, 'w', encoding='utf-8') as output_file:
            output_file.write(analysis_content)
        
        return f"Analysis report written to {output_filepath}"
    
    except Exception as e:
        return f"An error occurred: {e}"