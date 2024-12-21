import os
from phi.agent import Agent, RunResponse
from phi.model.openai.like import OpenAILike
from dotenv import load_dotenv
load_dotenv()

def Verify(output_dir=r'./output'):
    # Initialize the Verifier agent with specified model and tools
    Verifier = Agent(
        name="Verifier",
        model=OpenAILike(id="llama3.1:70b",api_key=os.getenv("GALADRIEL_API_KEY"),base_url="https://api.galadriel.com/v1"),
        tools=[],
        show_tool_calls=True,
        markdown=True,
    )

    # Create a directory for verified reports if it doesn't exist
    verified_dir = r'./verified'
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
                    "Based on the following content, determine if this case briefing should be verified. "
                    "Provide a clear recommendation and reasoning."
                    "If the AI generated text is greater than 20 percent donot verify the case. "
                    "Content:\n\n{content}"
                ).format(content=content)

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
