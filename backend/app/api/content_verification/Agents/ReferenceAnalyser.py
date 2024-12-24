import os
from phi.agent import Agent, RunResponse
from phi.model.google import Gemini
from phi.tools.file import FileTools
from phi.model.ollama import Ollama
from dotenv import load_dotenv
load_dotenv()

def ReferenceAnalysis(filepath, references_dir):
    # Initialize the Reference Analyzer agent with specified model and tools
    ReferenceAnalyzer = Agent(
        name="ReferenceAnalyzer",
        model=Ollama(id="llama3.2"),
        tools=[FileTools()],
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
            f"Please analyze the following case briefing content:\n\n{case_briefing_content}\n\n"
            f"Also review the following evidence documents:\n\n{reference_files}\n\n"
            "Check if the content of each evidence document supports or contradicts the case briefing. "
            "Determine if the content of these documents is sufficient to cross-verify all claims made in the case briefing. "
            "Provide a comprehensive report."
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