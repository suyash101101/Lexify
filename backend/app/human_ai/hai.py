from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from ..config import settings
from phi.model.google import Gemini
from dotenv import load_dotenv
from phi.agent import Agent, RunResponse
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
import re
from ..db.redis_db import redis_client
from phi.storage.agent.sqlite import SqlAgentStorage

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
    last_response: Optional[LawyerContext] = None

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
        
        self.summarising_agent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            knowledge_base=self.knowledge_base, 
            search_knowledge=True,
            description=(
                "You are a retriever agent responsible for retrieving relevant documents and information about the case. "
                "You will be provided with the response the lawyer intends to give to the opposing counsel. "
                "Your task is to identify and retrieve all pertinent documents and evidence that support the lawyer's response, "
                "ensuring that the information is accurate and relevant."
            ),
            instructions=[
                "You will receive the response the lawyer is about to give to the opposing counsel.",
                "Retrieve all relevant documents and evidence related to the case that support the lawyer's response.",
                "Ensure that you only return the documents and evidence, without any additional commentary or context.",
                "Present the retrieved documents and evidence in a clear and structured format, including:",
                "  - Source: [Where the document is retrieved from, e.g., 'Case File', 'Legal Database']",
                "  - Content: [Key excerpts or summaries from the document that are relevant to the case]",
                "  - Relevance: [Explain how this document supports the lawyer's response, including its contribution to the argument being made]",
                "Ensure that the content is easy to read and understand, using bullet points or numbered lists where appropriate.",
                "If you feel the retrieved documents and evidences are not supporting the lawyer's response then return 'No context needed'."
            ]
        )
        
        self.context_checker = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            description=(
                "You are an assistant to a lawyer responsible for evaluating the adequacy of legal responses "
                "before they are communicated to opposing counsel. Your primary function is to assess whether "
                "the response provided by the lawyer requires supporting evidence from the case or references to "
                "specific documents that substantiate the claims made in the response. "
                "Consider all aspects of the response, including factual assertions, legal references, and potential ambiguities."
            ),
            instructions=[
                "Carefully review the response provided by the lawyer intended for the opposing counsel.",
                "Determine if the response includes assertions that necessitate supporting evidence or references to legal documents.",
                "Return 'yes' if the response requires supporting evidence or references; otherwise, return 'no'.",
                "Ensure your evaluation is based solely on the content of the response without any additional context or explanation.",
                "Consider the following criteria for your evaluation:",
                "  - Are there factual claims that need to be substantiated?",
                "  - Are there legal references that should be cited?",
                "  - Is there any ambiguity in the response that could benefit from additional documentation?",
                "Your response should strictly adhere to the format: 'yes' or 'no'."
            ],
            debug_mode=True
        )
        # print("initailized the agent for the same")

    def ask(self,user_input):
        context_needed = self.check_context_need(user_input)

        if context_needed:
            run: RunResponse = self.summarising_agent.run(user_input)
            return [user_input, run.content]
        else:
            return [user_input, "No context needed"]
        #later change this to the output schema only 
        
    def check_context_need(self, user_input):        
        # Run the context checker with the refined prompt
        run: RunResponse = self.context_checker.run(user_input)
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
        self.RagAgent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            knowledge_base=self.knowledge_base, 
            search_knowledge=True,
            storage=SqlAgentStorage(table_name="AILawyer_sessions", db_file="tmp/AILawyer_storage.db"),
            add_history_to_messages=True,
            num_history_responses=3,
            description=(
                "Your name is Vatsal Gandhi, an expert legal counsel. Your task is to engage in a dialogue with the opposing counsel, "
                "formulating a comprehensive and persuasive response to their arguments. "
                "Utilize relevant legal precedents, case law, and factual evidence to substantiate your arguments, ensuring that your response is compelling and legally sound."
            ),
            instructions=[
                "You will receive the response from the opposing counsel, which may include legal arguments, factual assertions, and casual remarks.",
                "Engage with the opposing counsel's arguments in a conversational manner, addressing each point raised directly.",
                "Acknowledge any casual remarks made by the opposing counsel to maintain rapport, but do not dwell on them excessively.",
                "After acknowledging casual remarks, transition back to the relevant legal issues smoothly, linking the casual comment to the case context when appropriate.",
                "Incorporate legal precedents, case law, and relevant facts to support your arguments, ensuring that your response is grounded in legal reasoning.",
                "Your response should be clear, concise, and persuasive, effectively communicating your client's position without unnecessary elaboration.",
                "Ensure that your response is structured logically, with a clear flow that makes it easy for the judge and jury to follow your argument.",
                "Return only the response as output, without any additional commentary or analysis."
            ]
        )

    def respond(self, query):
        # Generate response using insights
        generated_response = self.generate_response_with_insights(query)
        
        return {
            "input": "AI Lawyer's Argument",
            "context": generated_response,
            "speaker": "ai"
        }

    def generate_response_with_insights(self, query):
        run: RunResponse = self.RagAgent.run(query)
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
        self.current_turn = None  # Track whose turn it is
        # self.judge = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")))
        self.judge = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            storage=SqlAgentStorage(table_name="judge_sessions", db_file="tmp/judge_storage.db"),
            add_history_to_messages=True,
            num_history_responses=3,
            description=(
                "You are an experienced judge presiding over a legal case. Your role is to impartially evaluate the arguments presented by both lawyers, "
                "ensuring that your decision is based solely on the merits of the arguments and the evidence provided."
            ),
            instructions=[
                "Carefully review the arguments presented by both the lawyers.",
                "Evaluate the arguments based on legal principles, precedents, and factual evidence.",
                "Provide a fair and impartial verdict based on the arguments presented.",
                "Ensure that your decision is based solely on the arguments presented and not influenced by any external factors.",
                "When providing commentary, be constructive and focus on the strengths and weaknesses of each argument.",
                "Do not address the lawyers by [opponent] or [respondent]; refer to them by their names to maintain professionalism.",
                "Summarize your thoughts on the arguments presented, highlighting key points and areas for improvement, while maintaining a respectful tone."
            ]
        )        # self.score_analyser = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")))
        self.score_analyser = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            description=(
                "You are an analytical assistant to the judge, responsible for evaluating the effectiveness and relevance of the lawyer's responses in the context of the ongoing legal proceedings. "
                "Your task is to provide an objective assessment of the lawyer's arguments based on a set of defined criteria, ensuring that the evaluation reflects the quality of the legal reasoning presented."
            ),
            instructions=[
                "You will receive the responses from both the lawyer and the opposing counsel.",
                "Evaluate the lawyer's response based on the following criteria:",
                "  - **Relevance**: Assess how well the response addresses the specific issues raised by the opposing counsel.",
                "  - **Clarity**: Determine if the response is articulated clearly and is easy to understand.",
                "  - **Persuasiveness**: Evaluate the effectiveness of the arguments presented in persuading the judge or jury.",
                "  - **Completeness**: Check if the response covers all necessary points and provides sufficient evidence to support the claims made.",
                "  - **Tone and Presentation**: Assess the tone of the response and how well it is presented. A well-structured and confident delivery is crucial.",
                "  - **Correlation**: Consider how well the response correlates with the context of the case and the opposing counsel's arguments.",
                "Assign a score between 0 and 0.9 for the lawyer's response based on its overall effectiveness and relevance to the case. A score of 1 should never be given, regardless of content quality.",
                "Ensure that if the response is inadequate, poorly constructed, or fails to address key issues, the score reflects this with a low value.",
                "Return only the score as a number, without any additional text or explanation, to maintain objectivity in the evaluation process."
            ]
        )

    def analyze_response(self, response, input_text, is_human):
        """Enhanced response analysis with chunking"""
        prompt = (
            f"The opposing counsel's response was: {input_text}"
            f"The lawyer's response was: {response}"
        )
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
                score = self.analyze_response(response.input, request.input_text, is_human=True)
                
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
                if score_difference >= 1 or "@restcase" in request.input_text.lower() or "@endcase" in request.input_text.lower():
                    return self.end_case(request.case_id,human_response)
                
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
                score = self.analyze_response(ai_response_data["context"],request.input_text, is_human=False)
                
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
                    return self.end_case(request.case_id,ai_response)

                
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

    def end_case(self, case_id: str,last_response: LawyerContext)-> TurnResponse:
        """Helper method to handle case ending"""
        winner = "Human Lawyer" if self.human_score > self.ai_score else "AI Lawyer"
        score_difference = abs(self.human_score - self.ai_score)
        
        closing_statement = self.generate_closing_statement(winner, score_difference)
        self.conversations.append(closing_statement)

        case = redis_client.get_case(case_id)
        case["case_status"] = "Closed"
        conversationdict = {
            "conversations": [conversation.dict() for conversation in self.conversations]
        }
        case_winner = {
            "winner" : winner
        }
        case_scores = {
        "human_score": str(self.human_score),
        "ai_score": str(self.ai_score),
        "score_difference": str(score_difference)
    }
        case.update(conversationdict)
        case.update(case_winner)
        case.update(case_scores)
        redis_client.update_case(case_id, case)

        return TurnResponse(
            next_turn="none",
            case_status="closed",
            winner=winner,
            score_difference=score_difference,
            current_response=closing_statement,
            human_score=self.human_score,
            ai_score=self.ai_score,
            last_response = last_response
        )
      

    def generate_judge_comment(self, last_response: LawyerContext) -> LawyerContext:
        """Generate judge's commentary after each argument"""
        prompt = (
            "As an experienced judge, provide a brief and constructive comment on the last argument presented. "
            f"The {last_response.speaker} lawyer argued: {last_response.input}\n"
            "Highlight the strengths and weaknesses of the argument, and direct the next lawyer to proceed."
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
            "As an experienced judge, provide a brief closing statement based on the arguments presented. "
            f"Based on the arguments presented, the {winner} has made a compelling case. "
            f"The score difference is {score_difference:.2f} points. "
            "Summarize the key points that led to this decision."
        )
        
        try:
            run: RunResponse = self.judge.run(prompt)
            response = run.content
            
            return LawyerContext(
                input=response,
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
