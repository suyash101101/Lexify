from fastapi import FastAPI, HTTPException
from transformers import pipeline, AutoTokenizer
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from ..config import settings
import random
import spacy
from dotenv import load_dotenv
from phi.agent import Agent, RunResponse
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from phi.model.openai import OpenAIChat
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
import requests

load_dotenv()

# Configure OpenAI settings
Settings.chunk_size = 512
Settings.chunk_overlap = 50

# Pydantic Models
class LawyerContext(BaseModel):
    input: str
    context: str
    speaker: str  # "human" or "ai"
    score: float

class TurnResponse(BaseModel):
    next_turn: str  # "human" or "ai"
    case_status: str  # "open" or "closed"
    winner: Optional[str] = None
    score_difference: Optional[float] = None
    current_response: LawyerContext
    human_score: float
    ai_score: float
    ipfs_hash: Optional[str] = None

class ProcessInputRequest(BaseModel):
    turn_type: str
    input_text: Optional[str] = None
    case_id: str

class ConversationList(BaseModel):
    conversations: List[LawyerContext]

class VectorDBMixin:
    """Base class for vector database functionality"""
    def __init__(self):
        # Initialize vector database
        if not os.path.exists('case_reports'):
            raise Exception("case_reports directory not found")
            
        documents = SimpleDirectoryReader(input_dir='case_reports').load_data()
        self.index = VectorStoreIndex.from_documents(documents)
        self.retriever = self.index.as_retriever()

class HumanAssistant(VectorDBMixin):
    def __init__(self):
        super().__init__()
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=self.retriever)
        self.summarising_agent = Agent(model=OpenAIChat(id="gpt-4o"),knowledge_base=self.knowledge_base, search_knowledge=True, debug_mode=True, show_tool_calls=True)
        self.context_checker = Agent(model=OpenAIChat(id="gpt-4o"),markdown=True,)

    def ask(self,user_input):
        context_needed = self.check_context_need(user_input)

        if context_needed:
            prompt = (
                f"You are an assistant to a lawyer. Your task is to provide detailed and relevant context, including legal principles, case law, and evidentiary support, to assist the lawyer in addressing the following statement or inquiry: {user_input}."
                "Ensure that your response is thorough, well-organized, and tailored to the specific legal issues at hand."
                "Also make sure to include as much context and evidence as possible."
            )
            run: RunResponse = self.summarising_agent.run(prompt)
            summarized_response = run.content
            return [user_input,summarized_response]
        else:
            return [user_input,"No context needed"]
        
    def check_context_need(self, user_input):
        prompt = (
            "You are an intelligent assistant to a lawyer. "
            "Based on the following statement by a lawyer, determine if additional legal context is needed:\n"
            f"'{user_input}'\n"
            "As long as the sentence is not a casual conversation sentence respond with 'yes' else 'no'"
        )
        run: RunResponse = self.context_checker.run(prompt)
        decision = run.content
        return decision[:3] == "Yes"

class AILawyer(VectorDBMixin):
    def __init__(self):
        super().__init__()  # Initialize vector database
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=self.retriever)
        self.RagAgent = Agent(model=OpenAIChat(id="gpt-4o"),knowledge_base=self.knowledge_base, search_knowledge=True, debug_mode=True, show_tool_calls=True)

    def respond(self, query):
        # Generate response using insights
        generated_response = self.generate_response_with_insights(query)
        
        return {
            "input": "AI Lawyer's Argument",
            "context": generated_response,
            "speaker": "ai"
        }

    def generate_response_with_insights(self, query):
        prompt = (
            "You are an experienced lawyer who is famous for being sharp and witty. "
            f"Now assuming that you are fighting a case in a court of law, respond to the following statement: {query}"
            "This is the statement of the opposing lawyer. You need to respond to it in a way that is both persuasive and legal."
            "If he is talking to you in a casual manner, you should respond in a casual manner too."
        )

        run: RunResponse = self.RagAgent.run(prompt)

        return run.content

class HumanLawyer:
    def __init__(self):
        self.assistant = HumanAssistant()

    def ask(self):
        argument = input("Human Lawyer: ")  # Prompt for user input #here is the post request part about how the input will be taken in the case of the user 
        response = self.assistant.ask(argument)
        
        # Format output with input and context
        output = f"Input: {response[0]}. Context: {response[1]}."
        return output # pydantic model with the schema should be there in this case
    
#Judge and Simulation Logic 

class Judge:
    def __init__(self):
        self.conversations = []
        self.human1_score = 0
        self.human2_score = 0
        
        # Initialize sentiment analysis pipelines
        self.sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")
        self.coherence_model = pipeline("text-classification", model="textattack/bert-base-uncased-snli")
        self.tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
        self.current_turn = None  # Track whose turn it is
        self.judge = Agent(model=OpenAIChat(id="gpt-4o"),markdown=True,)

    def analyze_response(self, response, is_human):
        """Enhanced response analysis with chunking"""
        def analyze_in_chunks(text, analyzer):
            if len(text) > 500:
                chunks = [text[i:i + 500] for i in range(0, len(text), 500)]
                scores = []
                for chunk in chunks:
                    result = analyzer(chunk)
                    scores.append(result[0]['score'])
                return sum(scores) / len(scores)
            else:
                result = analyzer(text)
                return result[0]['score']

        # Calculate expression score
        expression_score = analyze_in_chunks(response, self.sentiment_analyzer)

        # Calculate coherence score
        coherence_score = 0
        if len(self.conversations) > 1:
            previous_response = self.conversations[-2].input + self.conversations[-2].context
            coherence_input = f"{previous_response} {response}"
            coherence_score = analyze_in_chunks(coherence_input, self.coherence_model)

        final_score = (expression_score + coherence_score) / 2

        if is_human:
            self.human_score += final_score
        else:
            self.ai_score += final_score
            
        return final_score

    async def start_simulation(self):
        """Initialize a new simulation and return initial state"""
        self.conversations = []
        self.human_score = 0
        self.ai_score = 0
        
        # Create opening statement
        opening_statement = LawyerContext(
            input="The court is now in session.",
            context="The judge will now decide who presents first.",
            speaker="judge",
            score=0.0
        )
        
        # Add to conversation history
        self.conversations.append(opening_statement)

        # Randomly decide first turn
        self.current_turn = "human" 
        
        # Create judge's first directive
        first_directive = LawyerContext(
            input=f"The {self.current_turn} lawyer will present first.",
            context="Please present your opening argument.",
            speaker="judge",
            score=0.0
        )
        
        # Add to conversation history
        self.conversations.append(first_directive)
        
        return TurnResponse(
            next_turn=self.current_turn,
            case_status="open",
            current_response=first_directive,
            human_score=0.0,
            ai_score=0.0
        )

    def append_to_case_pdf(self, case_id: str, conversation: LawyerContext):
        """Append a single conversation entry to the case PDF"""
        try:
            pdf_filename = f'case_reports/case_{case_id}.pdf'
            
            # Create temporary PDF for new content
            temp_pdf = f'case_reports/temp_{case_id}.pdf'
            doc = SimpleDocTemplate(temp_pdf, pagesize=letter)
            styles = getSampleStyleSheet()
            
            story = []
            
            # Add conversation entry
            story.append(Paragraph(f"Speaker: {conversation.speaker}", styles['Heading4']))
            story.append(Paragraph(f"Input: {conversation.input}", styles['Normal']))
            story.append(Paragraph(f"Context: {conversation.context}", styles['Normal']))
            story.append(Paragraph(f"Score: {conversation.score}", styles['Normal']))
            story.append(Spacer(1, 12))
            
            # Build PDF
            doc.build(story)
            
            # Merge with existing PDF
            from PyPDF2 import PdfMerger, PdfReader
            merger = PdfMerger()
            
            # Add original PDF if it exists
            if os.path.exists(pdf_filename):
                merger.append(PdfReader(open(pdf_filename, 'rb')))
            
            # Add new content
            merger.append(PdfReader(open(temp_pdf, 'rb')))
            
            # Write final PDF
            with open(pdf_filename, 'wb') as output_file:
                merger.write(output_file)
            
            # Clean up temp file
            os.remove(temp_pdf)
            
        except Exception as e:
            print(f"Error appending to PDF: {e}")

    async def process_input(self, request: ProcessInputRequest):
        if request.turn_type != self.current_turn:
            raise HTTPException(status_code=400, detail="Not your turn to speak")

        try:
            if request.turn_type == "human":
                if not request.input_text:
                    raise HTTPException(status_code=400, detail="Human input required")
                
                human_lawyer = HumanLawyer()
                response = human_lawyer.assistant.ask(request.input_text)
                score = self.analyze_response(response[1], is_human=True)
                
                # Create human's response
                human_response = LawyerContext(
                    input=request.input_text,
                    context=response[1],
                    speaker="human",
                    score=score
                )
                
                # Add to conversation and PDF
                self.conversations.append(human_response)
                self.append_to_case_pdf(request.case_id, human_response)
                
                # Generate and add judge's commentary
                judge_comment = self.generate_judge_comment(human_response)
                self.conversations.append(judge_comment)
                self.append_to_case_pdf(request.case_id, judge_comment)

                # Check scores
                score_difference = abs(self.human_score - self.ai_score)
                if score_difference >= 1:
                    return self.end_case(request.case_id)
                
                self.current_turn = "ai"
                return TurnResponse(
                    next_turn=self.current_turn,
                    case_status="open",
                    current_response=human_response,
                    human_score=self.human_score,
                    ai_score=self.ai_score
                )
                
            else:  # AI turn
                ai_lawyer = AILawyer()
                ai_response_data = ai_lawyer.respond("Present your argument to the court")
                score = self.analyze_response(ai_response_data["context"], is_human=False)
                
                # Create AI's response
                ai_response = LawyerContext(
                    input=ai_response_data["context"],
                    context="Based on legal precedent and case analysis",
                    speaker="ai",
                    score=score
                )
                
                # Add to conversation and PDF
                self.conversations.append(ai_response)
                self.append_to_case_pdf(request.case_id, ai_response)
                
                # Generate and add judge's commentary
                judge_comment = self.generate_judge_comment(ai_response)
                self.conversations.append(judge_comment)
                self.append_to_case_pdf(request.case_id, judge_comment)

                # Check scores
                score_difference = abs(self.human_score - self.ai_score)
                if score_difference >= 1:
                    return self.end_case(request.case_id)
                
                self.current_turn = "human"
                return TurnResponse(
                    next_turn=self.current_turn,
                    case_status="open",
                    current_response=ai_response,
                    human_score=self.human_score,
                    ai_score=self.ai_score
                )

        except Exception as e:
            print(f"Error processing input: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing input: {str(e)}"
            )

    def end_case(self, case_id: str):
        """Helper method to handle case ending"""
        winner = "Human Lawyer" if self.human_score > self.ai_score else "AI Lawyer"
        score_difference = abs(self.human_score - self.ai_score)
        
        closing_statement = self.generate_closing_statement(winner, score_difference)
        self.conversations.append(closing_statement)

        # Create PDF file data to upload
        pdf_data = BytesIO()
        with open(f"case_reports/case_{case_id}.pdf", 'rb') as pdf_file:
            pdf_data.write(pdf_file.read())
        pdf_data.seek(0)
        
        files = {
            'file': ('case_record.pdf', pdf_data, 'application/pdf')
        }
        
        response = requests.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            files=files,
            headers={
                'pinata_api_key': settings.pinata_api_key,
                'pinata_secret_api_key': settings.pinata_secret_api_key
            }
        )
        res = response.json()

        ipfs_hash = f"https://ipfs.io/ipfs/{res['IpfsHash']}"

        return TurnResponse(
            next_turn="none",
            case_status="closed",
            winner=winner,
            score_difference=score_difference,
            current_response=closing_statement,
            human_score=self.human_score,
            ai_score=self.ai_score,
            ipfs_hash=ipfs_hash
        )
      

    def generate_judge_comment(self, last_response: LawyerContext) -> LawyerContext:
        """Generate judge's commentary after each argument"""
        prompt = (
            "You are an experienced judge presiding over a case. "
            "Provide a brief comment on the last argument presented. "
            f"The {last_response.speaker} lawyer argued: {last_response.context}\n"
            "Give your reaction and direct the next lawyer to proceed."
        )
        
        try:
            run: RunResponse = self.judge.run(prompt)
            comment = run.content
            next_speaker = "AI" if self.current_turn == "ai" else "Human"
            
            return LawyerContext(
                input=comment,
                context=f"The {next_speaker} lawyer may now present their argument.",
                speaker="judge",
                score=0.0
            )
        except Exception as e:
            print(f"Error generating judge comment: {e}")
            return LawyerContext(
                input="The court acknowledges your argument.",
                context="Please proceed with the next argument.",
                speaker="judge",
                score=0.0
            )

    def generate_closing_statement(self, winner: str, score_difference: float) -> LawyerContext:
        """Generate judge's closing statement"""
        prompt = (
            "You are an experienced judge presiding over a case. "
            "Provide a brief closing statement based on the arguments presented. "
            f"Based on the arguments presented, the {winner} has presented a more compelling case. "
            f"The score difference is {score_difference:.2f} points."
        )
        
        try:
            run: RunResponse = self.judge.run(prompt)
            response = run.content
            
            return LawyerContext(
                input=response.choices[0].message.content,
                context="The court has reached a decision.",
                speaker="judge",
                score=0.0
            )
        except Exception as e:
            print(f"Error generating closing statement: {e}")
            return LawyerContext(
                input="The court has reached a decision.",
                context="Based on the arguments presented, the court has reached a decision.",
                speaker="judge",
                score=0.0
            )



#later will have to add a function which will basically take the covnersation and take the lists and then put it onto case pdf using the report pdf library function