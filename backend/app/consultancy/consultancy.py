from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from phi.agent import Agent, RunResponse
from phi.storage.agent.sqlite import SqlAgentStorage
from phi.utils.log import logger
import os
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from dotenv import load_dotenv
from .vector_db import VectorDatabase
from phi.model.google import Gemini

load_dotenv()

class ContextRequirement(BaseModel):
    question: str = Field(..., description="Question to ask the client")
    reason: str = Field(..., description="Why this information is needed")
    is_critical: bool = Field(..., description="Whether this information is essential")

class ConsultationResponse(BaseModel):
    needs_context: bool = Field(..., description="Whether additional information is needed")
    needs_research: bool = Field(..., description="Whether research is needed")
    response: Optional[str] = Field(None, description="The consultation response")
    context_requirements: List[ContextRequirement] = Field(
        default=[],
        description="Structured questions to ask the client"
    )
    research_query: Optional[str] = Field(
        None,
        description="Query for the research agent if research is needed"
    )

class ResearchResponse(BaseModel):
    findings: str = Field(..., description="Research findings from knowledge base")
    relevant_laws: List[str] = Field(default=[], description="Relevant legal references")
    confidence: float = Field(..., description="Confidence in the research findings")

class Consultant:
    def __init__(self, retriever):
        logger.info("Initializing Legal Consultation System...")
        try:
            # Initialize query agent with knowledge base
            logger.info("Setting up research agent...")
            self.query_agent = Agent(   
                model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GEMINI_API_KEY")),
                knowledge_base=LlamaIndexKnowledgeBase(retriever=retriever),
                description="""You are a legal research assistant that provides factual information
                             from the knowledge base about legal concepts and precedents.""",
                instructions=[
                    "Search the knowledge base for relevant information",
                    "Provide factual, documented information",
                    "Include relevant legal references",
                    "Maintain high accuracy in responses",
                    "Express confidence level in findings"
                ],
                response_model=ResearchResponse
            )
            
            # Initialize consultation agent
            logger.info("Setting up consultation agent...")
            self.consultation_agent = Agent(
                model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GEMINI_API_KEY")),
                storage=SqlAgentStorage(
                    table_name="consultation_sessions",
                    db_file="tmp/consultation_storage.db"
                ),
                add_history_to_messages=True,
                num_history_responses=3,
                description="""You are a legal consultation assistant who helps people understand their legal situations.
                             You determine when more information is needed and when to consult the knowledge base.""",
                instructions=[
                    "When receiving a query:",
                    "- Assess if you have enough information to proceed",
                    "- If more information is needed, specify structured questions",
                    "- Determine if knowledge base research would be helpful",
                    "- Explain concepts in simple terms",
                    "- Avoid giving direct legal advice",
                    "- Highlight when professional help is needed"
                ],
                response_model=ConsultationResponse
            )
            logger.info("Consultation system initialized successfully")

        except Exception as e:
            logger.error("Failed to initialize consultation system", exc_info=True)
            raise

    def process_query(self, query: str, context: str = "") -> str:
        """Process a consultation query and return response"""
        try:
            logger.info("Processing consultation query...")
            full_query = f"{query}\nContext: {context}" if context else query
            
            # Get initial consultation response
            consultation = self.consultation_agent.run(
                f"""[CLIENT QUERY]
                   Query: {full_query}
                   
                   Analyze this query to determine:
                   1. If specific additional information is needed from the client
                   2. If research in the knowledge base would be helpful
                   3. What information should be explained to the client"""
            ).content

            # If more context is needed
            if consultation.needs_context:
                logger.info("Additional information needed from client")
                questions = []
                for req in consultation.context_requirements:
                    questions.append(f"- {req.question}")
                    if req.reason:
                        questions.append(f"  (Reason: {req.reason})")
                return "To better understand your situation, please answer these questions:\n" + "\n".join(questions)

            # If research is needed
            if consultation.needs_research:
                logger.info("Performing knowledge base research...")
                research = self.query_agent.run(consultation.research_query).content
                
                if research.confidence >= 0.7:  # Threshold for using research findings
                    return self.consultation_agent.run(
                        f"""[RESEARCH FINDINGS]
                           Original Query: {full_query}
                           Research Findings: {research.findings}
                           Relevant Laws: {', '.join(research.relevant_laws)}
                           
                           Please synthesize this information into a clear explanation."""
                    ).content.response
                
            # Return direct response if no research needed or low confidence
            return consultation.response

        except Exception as e:
            logger.error("Error in consultation process", exc_info=True)
            raise

def initialize_database():
    """Initialize vector database and return retriever"""
    try:
        logger.info("Initializing vector database connection...")
        vector_db = VectorDatabase()
        retriever = vector_db.get_retriever()
        logger.info("Vector database connection established")
        return retriever
    except Exception as e:
        logger.error("Failed to initialize vector database", exc_info=True)
        raise

def interactive_session():
    """Run an interactive consultation session"""
    try:
        logger.info("Starting interactive consultation session")
        
        # Initialize database first
        # retriever = initialize_database()
        retriever = None
        
        # Create consultant with retriever
        consultant = Consultant(retriever)

        print("\nWelcome to the Legal Consultation Assistant!")
        print("I can help explain legal concepts and processes. What would you like to know about?")
        
        while True:
            try:
                query = input("\nPlease describe your situation (or type 'exit' to quit): ").strip()
                if query.lower() == 'exit':
                    logger.info("Ending consultation session")
                    print("\nThank you for using the Legal Consultation Assistant!")
                    break

                context = ""
                while True:  # Context gathering loop
                    response = consultant.process_query(query, context)
                    
                    if "To better understand your situation" in response:
                        print("\n" + response)
                        print("\nPlease answer these questions (press enter to skip):")
                        
                        new_context = []
                        for line in response.split('\n'):
                            if line.startswith('- '):
                                info = input(f"{line[2:]}: ").strip()
                                if info:
                                    new_context.append(f"{line[2:]}: {info}")
                        
                        if not new_context:  # If user skipped all questions
                            logger.info("Client skipped providing additional information")
                            print("\nI'll provide information based on what I know so far.")
                            break
                        
                        context = "\n".join(new_context)
                        logger.info("Received additional client information")
                        continue  # Continue the context gathering loop
                    
                    # If no more context needed, print response and break context loop
                    print("\nConsultation Response:")
                    print(response)
                    print("\nRemember: This is general information and not legal advice. Consider consulting a lawyer for specific legal guidance.")
                    print("="*80)
                    break

            except Exception as e:
                logger.error("Error during consultation", exc_info=True)
                print(f"I apologize, but I encountered an error: {str(e)}")
                print("You can try rephrasing your question or asking about something else.")

    except Exception as e:
        logger.error("Fatal session error", exc_info=True)
        print(f"A system error occurred: {str(e)}")
        print("Please try starting a new session.")

# if __name__ == "__main__":
#     interactive_session()