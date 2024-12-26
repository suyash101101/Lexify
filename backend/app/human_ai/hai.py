from fastapi import FastAPI, HTTPException
from transformers import pipeline, AutoTokenizer
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings, ServiceContext
from ..config import settings
import random
import spacy
from phi.model.google import Gemini
from dotenv import load_dotenv
from phi.agent import Agent, RunResponse
from phi.model.openai.like import OpenAILike
from phi.model.ollama import Ollama
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
import requests
import re

load_dotenv()

# Configure OpenAI settings
Settings.chunk_size = 512
Settings.chunk_overlap = 50
Settings.embed_model = HuggingFaceEmbedding(
    model_name="all-MiniLM-L6-v2"
)

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
    judge_comment: Optional[str] = None

class ProcessInputRequest(BaseModel):
    turn_type: str
    input_text: Optional[str] = None
    case_id: str

class ConversationList(BaseModel):
    conversations: List[LawyerContext]

class messageContext(BaseModel):
    input : str
    context : str

class VectorDBMixin:
    """Base class for vector database functionality"""
    def __init__(self,case_id:str):
        # Initialize vector database
        data_dir = f'app/case_reports/{case_id}'
        # print(f"Loading documents from: {data_dir}")  # Debug print
        try:
            # Add more file types and configure reader
            documents = SimpleDirectoryReader(
                input_dir=data_dir,
                recursive=True,
                required_exts=[".txt",".pdf"],  # Specify accepted file types
                exclude_hidden=True
            ).load_data()
            
            # print(f"Loaded {len(documents)} documents while creating the vector database")  # Debug print
            # print(documents)
            
            if not documents:
                raise ValueError(f"No documents found in {data_dir}")
            
            # Configure chunking for better context
            self.index = VectorStoreIndex.from_documents(documents)
            self.retriever = self.index.as_retriever()
            
        except Exception as e:
            print(f"Error loading documents: {e}")
            raise

class HumanAssistant(VectorDBMixin):
    def __init__(self,case_id:str):
        super().__init__(case_id)
        # Initialize knowledge base
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=self.retriever)
        
        # Initialize agents with Galadriel
                    # self.summarising_agent = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            #knowledge_base=self.knowledge_base, search_knowledge=True)
        # print("initializing the agent for the same")
        self.summarising_agent = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),knowledge_base=self.knowledge_base, search_knowledge=True)
        
        self.context_checker = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")))
        # print("initailized the agent for the same")

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
        #later change this to the output schema only 
        
    def check_context_need(self, user_input):
        prompt = (
            "You are an intelligent assistant to a lawyer. "
            "Based on the following statement by a lawyer, determine if additional legal context is needed:\n"
            f"'{user_input}'\n"
            "Please respond with 'yes' if the statement references specific legal issues or evidence that require additional context. "
            "Respond with 'no' if the statement is a casual greeting or does not reference any legal matters."
        )
        
        # Run the context checker with the refined prompt
        run: RunResponse = self.context_checker.run(prompt)
        decision = run.content.strip()
        
        # Use regular expressions to check for 'yes' or 'no' responses
        if re.match(r'(?i)yes', decision):
            return True
        else:
            return False

class AILawyer(VectorDBMixin):
    def __init__(self,case_id:str):
        super().__init__(case_id)  # Initialize vector database
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=self.retriever)
        # self.RagAgent = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),knowledge_base=self.knowledge_base, search_knowledge=True)
        self.RagAgent = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),knowledge_base=self.knowledge_base, search_knowledge=True)

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
    def __init__(self,case_id:str):
        self.assistant = HumanAssistant(case_id)

    def ask(self, argument):
        response = self.assistant.ask(argument)
        
        # Format output with input and context
        output = messageContext(
            input = response[0],
            context = response[1]
        )
        return output 
    # pydantic model with the schema should be there in this case
    
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
        # self.judge = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")))
        self.judge = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")))        # self.score_analyser = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")))
        self.score_analyser = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")))

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
        prompt = f"Based on the score calculated which is {final_score} and the input {response} generate a score between 0 and 1. Make sure that if the response is not that good or it is very bad then the score is low regardless of the score calculated. Make sure only the score in the form of numbers is given as output and nothing else."
        run: RunResponse = self.score_analyser.run(prompt)
        extracted_number = float(run.content)

        if is_human:
            self.human_score += extracted_number
        else:
            self.ai_score += extracted_number
            
        return extracted_number

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

    async def process_input(self, request: ProcessInputRequest):
        if request.turn_type != self.current_turn:
            raise HTTPException(status_code=400, detail="Not your turn to speak")

        try:
            if request.turn_type == "human":
                if not request.input_text:
                    raise HTTPException(status_code=400, detail="Human input required")
                
                human_lawyer = HumanLawyer(request.case_id)
                response = human_lawyer.ask(request.input_text)
                score = self.analyze_response(response.input, is_human=True)
                
                # Create human's response
                human_response = LawyerContext(
                    input=request.input_text,
                    context=response.context,
                    speaker="human",
                    score=score
                )
                
                # Add to conversation and PDF
                self.conversations.append(human_response)
                #self.append_to_case_pdf(request.case_id, human_response)
                
                # Generate and add judge's commentary
                judge_comment = self.generate_judge_comment(human_response)
                print(judge_comment)
                self.conversations.append(judge_comment)
                #self.append_to_case_pdf(request.case_id, judge_comment) # have to return this as the response as well for the same in this case along with what is the thing for the same for the same so in the turn response schema the judge's comment should also be returned 

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
                    ai_score=self.ai_score,
                    judge_comment=judge_comment.input
                )
                
            else:  # AI turn
                ai_lawyer = AILawyer(request.case_id)
                ai_response_data = ai_lawyer.respond(request.input_text) # or else let it be self.conversations[-2]
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
                #self.append_to_case_pdf(request.case_id, ai_response)
                
                # Generate and add judge's commentary
                judge_comment = self.generate_judge_comment(ai_response)
                print(judge_comment)
                self.conversations.append(judge_comment)
               # self.append_to_case_pdf(request.case_id, judge_comment)

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
                    ai_score=self.ai_score,
                    judge_comment=judge_comment.input
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

       

        return TurnResponse(
            next_turn="none",
            case_status="closed",
            winner=winner,
            score_difference=score_difference,
            current_response=closing_statement,
            human_score=self.human_score,
            ai_score=self.ai_score,
        )
      

    def generate_judge_comment(self, last_response: LawyerContext) -> LawyerContext:
        """Generate judge's commentary after each argument"""
        prompt = (
            "You are an experienced judge presiding over a case. "
            "Provide a brief comment on the last argument presented. "
            f"The {last_response.speaker} lawyer argued: {last_response.input}\n"
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