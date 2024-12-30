import os
from phi.agent import Agent, RunResponse
from phi.model.google import Gemini
from phi.tools.file import FileTools
from dotenv import load_dotenv
load_dotenv()

def ReferenceAnalysis(filepath, references_dir):
    # Initialize the Reference Analyzer agent with specified model and tools
    ReferenceAnalyzer = Agent(
        name="ReferenceAnalyzer",
        model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
        debug_mode = True
    )

    # Check if the output directory exists, if not, create it
    revisedFilepath = filepath[0:-9]
    output_dir = f'{revisedFilepath}/output'
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Read the case briefing content
        with open(filepath, 'r', encoding='utf-8') as file:
            case_briefing_content = file.read()

        # Gather all reference files in the specified directory
        reference_files = [os.path.join(references_dir, f) for f in os.listdir(references_dir)]
        
        # Prepare a list to hold evidence content and their paths
        evidence_contents = {}
        
        for ref_file in reference_files:
            ref_path = ref_file
            with open(ref_path, 'r', encoding='utf-8') as ref:
                evidence_contents[ref_path] = ref.read()  # Store path and content
        
        # Define the analysis prompt
        prompt = (
            "You are a forensic legal analyst specializing in evidence evaluation and case verification. "
            "\nMaterials for Review:"
            f"Primary Case Briefing:\n{case_briefing_content}"
            f"\nEvidentiary Documents:\n{evidence_contents}"
            "\nAnalysis Framework:"
            "1. Document Authentication Assessment:"
            "   - Verify document authenticity indicators"
            "   - Evaluate chain of custody documentation"
            "   - Review certification and notarization status"
            "   - Assess document integrity and completeness"
            "\n2. Case Briefing Analysis:"
            "   - Map key claims and assertions"
            "   - Identify material facts presented"
            "   - Document critical dates and sequences"
            "   - Log all stakeholder statements"
            "   - Track referenced evidence citations"
            "\n3. Evidence Cross-Verification Protocol:"
            "   - Match evidence to specific claims"
            "   - Evaluate supporting documentation strength"
            "   - Identify contradictory evidence"
            "   - Assess evidence reliability and credibility"
            "   - Document chain of circumstantial connections"
            "\n4. Sufficiency Analysis:"
            "   - Evaluate evidence completeness for each claim"
            "   - Identify documentation gaps"
            "   - Assess quality of available evidence"
            "   - Determine corroboration requirements"
            "   - Review authentication needs"
            "\nReport Structure Requirements:"
            "1. Executive Overview:"
            "   - Overall evidence sufficiency assessment"
            "   - Critical findings summary"
            "   - Major discrepancies identified"
            "\n2. Claim-by-Claim Analysis:"
            "   - Evidence mapping for each assertion"
            "   - Support level classification"
            "   - Contradiction documentation"
            "   - Reliability assessment"
            "\n3. Documentation Gaps:"
            "   - Unsupported claims"
            "   - Insufficient evidence areas"
            "   - Missing authentication elements"
            "   - Required additional documentation"
            "\n4. Evidence Quality Assessment:"
            "   - Document reliability ratings"
            "   - Authentication status"
            "   - Corroboration levels"
            "   - Chain of custody verification"
            "\n5. Action Requirements:"
            "   - Additional evidence needs"
            "   - Authentication requirements"
            "   - Suggested verification steps"
            "   - Risk mitigation recommendations"
            "\nQuality Control Protocols:"
            "- Implement double-verification for critical evidence"
            "- Cross-reference all dates and sequences"
            "- Verify all document citations"
            "- Validate authentication credentials"
            "- Review all chain of custody documentation"
            "\nOutput Guidelines:"
            "- Present findings in formal legal documentation style"
            "- Include specific document references"
            "- Provide evidence strength classifications"
            "- Document all verification methodologies"
            "- Include confidence levels for conclusions"
        )

        # Run the Reference Analyzer agent with the analysis prompt
        run: RunResponse = ReferenceAnalyzer.run(prompt)
        
        # Prepare output content
        analysis_report = run.content
        
        # Define output file path
        output_filepath = os.path.join(output_dir, 'References_Analysis_Report.txt')
        
        # Write analysis report to a file in the output directory
        with open(output_filepath, 'w', encoding='utf-8') as output_file:
            output_file.write(analysis_report)
        
        return f"References analysis report written to {output_filepath}"
    
    except Exception as e:
        return f"An error occurred: {e}"