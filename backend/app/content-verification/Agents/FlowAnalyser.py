import os
from phi.agent import Agent, RunResponse
from phi.model.openai.like import OpenAILike
from phi.tools.file import FileTools
from dotenv import load_dotenv
load_dotenv()

def FlowAnalysis(filepath):
    # Initialize the Analyzer agent with specified model and tools
    Analyzer = Agent(
        name="Analyzer",
        model=OpenAILike(id="llama3.1:70b",api_key=os.getenv("GALADRIEL_API_KEY"),base_url="https://api.galadriel.com/v1"),
        tools=[FileTools()],
        show_tool_calls=True,
        markdown=True,
    )

    # Check if the output directory exists, if not, create it
    output_dir = r'./output'
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Define the analysis prompt
        prompt = (
            "Please read the case briefing located at {filepath}. "
            "Analyze the document to determine if all scenarios in the case are connected. "
            "Identify any missing parts or inconsistencies in the case briefing. "
            "Provide a clear report on the connectivity of scenarios, highlighting any gaps or mistakes."
        ).format(filepath=filepath)

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