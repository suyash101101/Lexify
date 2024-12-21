import os
from transformers import pipeline

def AITextDetection(filepath, chunk_size=512, threshold=0.5):
    # Load the AI detection model
    detector = pipeline("text-classification", model="akshayvkt/detect-ai-text")
    
    # Check if the output directory exists, if not, create it
    output_dir = r'./output'
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Read the content of the file
        with open(filepath, 'r', encoding='utf-8') as file:
            text = file.read()
    except Exception as e:
        return f"Error reading file: {e}"

    # Split the text into chunks
    chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
    
    ai_generated_count = 0
    human_written_count = 0
    
    # Process each chunk
    for chunk in chunks:
        result = detector(chunk)
        
        # Assuming result is in the format [{'label': 'AI', 'score': X}, {'label': 'Human', 'score': Y}]
        if result[0]['label'] == 'AI':
            ai_generated_count += 1
        else:
            human_written_count += 1
    
    # Calculate total chunks processed
    total_chunks = len(chunks)
    
    # Determine final classification based on threshold
    ai_percentage = ai_generated_count / total_chunks
    
    # Prepare output message
    if ai_percentage > threshold:
        output_message = "The text is likely AI-generated."
    else:
        output_message = "The text is likely human-written."
    
    # Write output to a file in the output directory
    output_filepath = os.path.join(output_dir, 'AITest.txt')
    
    try:
        with open(output_filepath, 'w', encoding='utf-8') as output_file:
            output_file.write(output_message)
            output_file.write(f"\nAI-generated chunks: {ai_generated_count}\n")
            output_file.write(f"Human-written chunks: {human_written_count}\n")
            output_file.write(f"Total chunks: {total_chunks}\n")
            output_file.write(f"AI percentage: {ai_percentage:.2%}\n")
        
        return f"Output written to {output_filepath}"
    
    except Exception as e:
        return f"Error writing output file: {e}"