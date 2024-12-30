import os
from phi.agent import Agent, RunResponse
from phi.model.google import Gemini
from phi.tools.file import FileTools

from dotenv import load_dotenv
load_dotenv()

def Summarize(filepath):
    # Initialize the Summariser agent with specified model and tools
    Summariser = Agent(
        name="Summariser",
        model = Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
        debug_mode = True
    )

    # Check if the output directory exists, if not, create it
    revisedFilepath = filepath[0:-9]
    output_dir = f'{revisedFilepath}/output'
    os.makedirs(output_dir, exist_ok=True)

    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
        
    try:
        # Define the refined prompt
        prompt = (
            "You are a professional content analyst specializing in legal and business document analysis. "
            "\nDocument Review Parameters:"
            f"Content for analysis: {content}"
            "\nAnalysis Framework:"
            "1. Primary Content Assessment:"
            "   - Central thesis identification"
            "   - Key argument mapping"
            "   - Critical evidence evaluation"
            "   - Conclusion validation"
            "\n2. Essential Elements Identification:"
            "   - Core arguments and premises"
            "   - Supporting evidence classification"
            "   - Methodological considerations"
            "   - Stakeholder perspectives"
            "   - Decision points and outcomes"
            "\n3. Critical Detail Extraction:"
            "   - Foundational facts"
            "   - Pivotal statements"
            "   - Statistical evidence"
            "   - Expert opinions"
            "   - Procedural elements"
            "\n4. Contextual Analysis:"
            "   - Background information relevance"
            "   - Environmental factors"
            "   - Temporal considerations"
            "   - Institutional framework"
            "\nSummary Structure Requirements:"
            "1. Executive Overview:"
            "   - Document purpose and scope"
            "   - Principal findings"
            "   - Critical implications"
            "\n2. Core Content Analysis:"
            "   - Main arguments presented"
            "   - Evidence synthesis"
            "   - Methodology assessment"
            "   - Key stakeholder positions"
            "\n3. Essential Details:"
            "   - Critical data points"
            "   - Significant quotations"
            "   - Important references"
            "   - Procedural specifications"
            "\n4. Implications and Conclusions:"
            "   - Primary outcomes"
            "   - Strategic implications"
            "   - Recommended actions"
            "   - Future considerations"
            "\nQuality Control Measures:"
            "- Verify accuracy of extracted information"
            "- Cross-reference critical points"
            "- Validate statistical data"
            "- Ensure contextual accuracy"
            "- Maintain objective perspective"
            "\nOutput Requirements:"
            "- Present information in professional business format"
            "- Maintain clear logical progression"
            "- Include specific content references"
            "- Prioritize information by significance"
            "- Ensure accessibility for diverse stakeholders"
        )

        # Run the Summariser agent with the refined prompt
        run: RunResponse = Summariser.run(prompt)
        
        # Prepare output content
        summary_content = run.content
        
        # Define output file path
        output_filepath = os.path.join(output_dir, 'Summary.txt')
        
        # Write summary to a file in the output directory
        with open(output_filepath, 'w', encoding='utf-8') as output_file:
            output_file.write(summary_content)
        
        return f"Summary written to {output_filepath}"
    
    except Exception as e:
        return f"An error occurred: {e}"