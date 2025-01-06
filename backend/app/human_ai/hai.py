import os
import gc
import re
import json
from typing import List, Optional
from pydantic import BaseModel
from transformers import pipeline, AutoTokenizer
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from phi.model.google import Gemini
from phi.agent import Agent, RunResponse
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
from dotenv import load_dotenv
from ..db.redis_db import redis_client
from fastapi import HTTPException

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
    input: str
    context: str

class VectorDBMixin:
    """Base class for vector database functionality"""
    def __init__(self, case_id: str):
        data_dir = f'app/case_reports/{case_id}'
        try:
            documents = SimpleDirectoryReader(
                input_dir=data_dir,
                recursive=True,
                required_exts=[".txt", ".pdf"],
                exclude_hidden=True
            ).load_data()
            
            if not documents:
                raise ValueError(f"No documents found in {data_dir}")
            
            self.index = VectorStoreIndex.from_documents(documents)
            self.retriever = self.index.as_retriever()
            
        except Exception as e:
            print(f"Error loading documents: {e}")
            raise

class HumanAssistant(VectorDBMixin):
    def __init__(self, case_id: str):
        super().__init__(case_id)
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=self.retriever)
        self.summarising_agent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            knowledge_base=self.knowledge_base,
            search_knowledge=True
        )
        self.context_checker = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY"))
        )

    def ask(self, user_input):
        context_needed = self.check_context_need(user_input)
        if context_needed:
            prompt = (
                "You are a highly qualified legal research assistant with expertise in multiple practice areas. "
                "\nRole and Responsibilities:"
                "- Conduct thorough legal research and analysis"
                "- Synthesize complex legal information into clear, actionable insights"
                "- Support case preparation with relevant precedents and evidence"
                "\nTask Parameters:"
                f"Review and analyze the following legal matter: {user_input}"
                "\nProvide a structured analysis that includes:"
                "1. Initial Assessment:"
                "   - Key legal issues identified"
                "   - Relevant jurisdiction and applicable laws"
                "   - Preliminary evaluation of case strength"
                "\n2. Legal Research Components:"
                "   - Pertinent statutory provisions"
                "   - Relevant case law precedents with full citations"
                "   - Secondary sources (legal treatises, law review articles)"
                "   - Regulatory guidance if applicable"
                "\n3. Evidentiary Considerations:"
                "   - Documentary evidence requirements"
                "   - Witness testimony needs"
                "   - Expert opinion requirements"
                "   - Chain of custody considerations"
                "\n4. Procedural Context:"
                "   - Filing deadlines and requirements"
                "   - Jurisdictional requirements"
                "   - Relevant rules of civil/criminal procedure"
                "\n5. Strategic Recommendations:"
                "   - Potential arguments and counterarguments"
                "   - Risk assessment"
                "   - Alternative approaches or remedies"
                "\nOutput Requirements:"
                "- Present information in clear, hierarchical structure"
                "- Include precise citations for all legal authorities"
                "- Flag any areas requiring additional research or clarification"
                "- Highlight time-sensitive matters or immediate action items"
                "- Provide specific page references for critical sources"
                "\nSpecial Instructions:"
                "- If dealing with multiple jurisdictions, address conflicts of law"
                "- For novel legal issues, include analogous precedents"
                "- Note any recent changes in relevant law or pending legislation"
                "- Include any ethical considerations or potential conflicts"
            )
            run: RunResponse = self.summarising_agent.run(prompt)
            summarized_response = run.content
            return [user_input, summarized_response]
        else:
            return [user_input, "No context needed"]

    def check_context_need(self, user_input):
        prompt = (
            "You are an intelligent assistant to a lawyer. "
            "Based on the following statement by a lawyer, determine if additional legal context is needed:\n"
            f"'{user_input}'\n"
            "Please respond with 'yes' if the statement references specific legal issues or evidence that require additional context. "
            "Respond with 'no' if the statement is a casual greeting or does not reference any legal matters."
        )
        run: RunResponse = self.context_checker.run(prompt)
        decision = run.content.strip()
        return bool(re.match(r'(?i)yes', decision))

class AILawyer(VectorDBMixin):
    def __init__(self, case_id: str):
        super().__init__(case_id)
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=self.retriever)
        self.RagAgent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            knowledge_base=self.knowledge_base,
            search_knowledge=True
        )

    def respond(self, query):
        generated_response = self.generate_response_with_insights(query)
        return {
            "input": "AI Lawyer's Argument",
            "context": generated_response,
            "speaker": "ai"
        }

    def generate_response_with_insights(self, query):
        prompt = (
            "You are an experienced trial attorney with 20+ years of litigation experience across civil and criminal law. "
            "Core traits and capabilities:"
            "- Known for quick thinking, strategic argumentation, and maintaining professional composure"
            "- Expert in evidence law, procedural rules, and relevant jurisdictional precedents"
            "- Adapts communication style appropriately while maintaining professionalism"
            "\nContext and Role:"
            f"The following is a statement from opposing counsel: {query}"
            "\nResponse Parameters:"
            "1. Match the formality level of opposing counsel while staying within professional bounds"
            "2. Consider current stage of proceedings (discovery, trial, etc.) in your response"
            "3. Address factual and legal assertions separately"
            "4. Maintain ethical guidelines and court decorum"
            "5. If opposing counsel raises new evidence, request proper documentation"
            "6. Flag any procedural violations or objectionable statements"
            "\nAdditional Instructions:"
            "- If opposing counsel makes personal remarks, maintain professionalism while addressing substance"
            "- For technical legal matters, cite relevant statutes or case law"
            "- If settlement discussions arise, request proper channels"
            "- For unclear statements, seek clarification before substantive response"
            "\nProvide your response ensuring it is:"
            "1. Legally sound"
            "2. Strategically advantageous"
            "3. Professionally appropriate"
            "4. Factually accurate based on available information"
        )
        run: RunResponse = self.RagAgent.run(prompt)
        return run.content

class HumanLawyer:
    def __init__(self, case_id: str):
        self.assistant = HumanAssistant(case_id)

    def ask(self, argument):
        response = self.assistant.ask(argument)
        return messageContext(
            input=response[0],
            context=response[1]
        )

class Judge:
    def __init__(self):
        self.conversations = []
        self.human_score = 0
        self.ai_score = 0
        self.current_turn = None
        
        # Initialize sentiment analysis pipelines
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="distilbert/distilbert-base-uncased-finetuned-sst-2-english"
        )
        self.coherence_model = pipeline(
            "text-classification",
            model="textattack/bert-base-uncased-snli"
        )
        self.tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
        self.judge = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY"))
        )
        self.score_analyser = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY"))
        )

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

        expression_score = analyze_in_chunks(response, self.sentiment_analyzer)
        
        coherence_score = 0
        if len(self.conversations) > 1:
            previous_response = self.conversations[-2].input + self.conversations[-2].context
            coherence_input = f"{previous_response} {response}"
            coherence_score = analyze_in_chunks(coherence_input, self.coherence_model)

        final_score = (expression_score + coherence_score) / 2
        prompt = (
            f"Based on the score calculated which is {final_score} and the input {response} "
            "generate a score between 0 and 1. Make sure that if the response is not that good "
            "or it is very bad then the score is low regardless of the score calculated. "
            "Make sure only the score in the form of numbers is given as output and nothing else."
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
        
        opening_statement = LawyerContext(
            input="The court is now in session.",
            context="The judge will now decide who presents first.",
            speaker="judge",
            score=0.0
        )
        self.conversations.append(opening_statement)

        self.current_turn = "human"
        
        first_directive = LawyerContext(
            input=f"The {self.current_turn} lawyer will present first.",
            context="Please present your opening argument.",
            speaker="judge",
            score=0.0
        )
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
                
                human_response = LawyerContext(
                    input=request.input_text,
                    context=response.context,
                    speaker="human",
                    score=score
                )
                
                self.conversations.append(human_response)
                judge_comment = self.generate_judge_comment(human_response)
                self.conversations.append(judge_comment)

                score_difference = abs(self.human_score - self.ai_score)
                if score_difference >= 1 or "@restcase" in request.input_text.lower() or "@endcase" in request.input_text.lower():
                    return self.end_case(request.case_id, human_response)
                
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
                ai_response_data = ai_lawyer.respond(request.input_text)
                score = self.analyze_response(ai_response_data["context"], is_human=False)
                
                ai_response = LawyerContext(
                    input=ai_response_data["context"],
                    context="Based on legal precedent and case analysis",
                    speaker="ai",
                    score=score
                )
                
                self.conversations.append(ai_response)
                judge_comment = self.generate_judge_comment(ai_response)
                self.conversations.append(judge_comment)

                score_difference = abs(self.human_score - self.ai_score)
                if score_difference >= 1:
                    return self.end_case(request.case_id, ai_response)
                
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

    def end_case(self, case_id: str, last_response: LawyerContext) -> TurnResponse:
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
            "winner": winner
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
            last_response=last_response
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
