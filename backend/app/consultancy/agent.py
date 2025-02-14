from phi.agent import Agent, RunResponse
from phi.model.google import Gemini
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from phi.storage.agent.sqlite import SqlAgentStorage
from phi.utils.log import logger
import os
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from dotenv import load_dotenv
from vector_db import VectorDatabase

load_dotenv()

class SynthesisResponse(BaseModel):
    needs_context: bool = Field(
        ..., 
        description="Whether additional context is needed"
    )
    response: Optional[str] = Field(
        None,
        description="The synthesized response or None if more context needed"
    )
    context_requirements: List[str] = Field(
        default=[],
        description="List of specific information needed if needs_context is True"
    )

class TaskAssignment(BaseModel):
    required_agents: List[str] = Field(
        default=[],
        description="List of specialist agents to consult"
    )
    queries: Dict[str, str] = Field(
        default={},
        description="Specific queries for each specialist agent"
    )
    reasoning: str = Field(
        ...,
        description="Explanation of agent selection and query formulation"
    )

class ConsultationResponse(BaseModel):
    agent_name: str = Field(..., description="Name of the specialist agent")
    response: str = Field(..., description="Research findings from the specialist")

class BaseLegalAgent:
    """Base class for all legal agents"""
    def __init__(self, name: str, description: str, instructions: List[str]):
        self.name = name
        self.agent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GEMINI_API_KEY")),
            description=description,
            instructions=instructions
        )

class SpecializedAgent(BaseLegalAgent):
    """Base class for specialized legal agents"""
    def __init__(self, name: str, description: str, instructions: List[str], retriever):
        super().__init__(name, description, instructions)
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=retriever)
        self.agent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GEMINI_API_KEY")),
            knowledge_base=self.knowledge_base,
            description=description,
            instructions=instructions
        )

    def get_response(self, query: str) -> str:
        logger.info(f"Consulting {self.name} specialist")
        try:
            response = self.agent.run(query)
            return response.content
        except Exception as e:
            logger.error(f"Error getting response from {self.name}: {str(e)}", exc_info=True)
            raise

# Specialized agent implementations
class CriminalLawAgent(SpecializedAgent):
    def __init__(self, retriever):
        super().__init__(
            name="Criminal Law",
            description="""You are a criminal law research specialist with deep expertise in criminal jurisprudence.
                         You analyze criminal procedures, penal codes, and criminal justice principles.""",
            instructions=[
                "Research and analyze criminal law aspects of the query in detail.",
                "Identify relevant sections of the penal code and criminal procedure.",
                "Find and reference relevant case laws and precedents.",
                "Analyze procedural aspects and implementation patterns.",
                "Structure your research with proper legal citations."
            ],
            retriever=retriever
        )

class CivilLawAgent(SpecializedAgent):
    def __init__(self, retriever):
        super().__init__(
            name="Civil Law",
            description="""You are a civil law research specialist focusing on private rights, obligations, and remedies.
                         You analyze civil procedures, contracts, and property law.""",
            instructions=[
                "Research civil law implications thoroughly.",
                "Identify relevant civil code provisions and procedures.",
                "Analyze civil remedies and enforcement mechanisms.",
                "Find and reference relevant civil case laws and precedents.",
                "Structure your research with clear legal reasoning."
            ],
            retriever=retriever
        )

class FamilyLawAgent(SpecializedAgent):
    def __init__(self, retriever):
        super().__init__(
            name="Family Law",
            description="""You are a family law research specialist with expertise in domestic relations and personal laws.
                         You analyze various personal law systems, marriage laws, and family dispute resolution.""",
            instructions=[
                "Research family law aspects comprehensively.",
                "Identify implications under relevant personal laws.",
                "Analyze marriage, divorce, and family rights.",
                "Reference family law statutes and precedents.",
                "Consider cultural and social implications.",
                "Structure your research with practical insights for family law matters."
            ],
            retriever=retriever
        )

class CorporateLawAgent(SpecializedAgent):
    def __init__(self, retriever):
        super().__init__(
            name="Corporate Law",
            description="""You are a corporate law research specialist specializing in business and commercial law.
                         You analyze corporate governance, securities law, and business regulations.""",
            instructions=[
                "Research corporate and commercial law aspects in detail.",
                "Identify implications for business operations and governance.",
                "Analyze relevant company law provisions and regulations.",
                "Reference corporate law precedents and practices.",
                "Structure your research with practical implications for businesses."
            ],
            retriever=retriever
        )

class LegalAgent:
    def __init__(self, retriever):
        logger.info("Initializing Legal Research Assistant...")
        
        try:
            # Initialize specialized agents with provided retriever
            logger.info("Initializing specialized agents with retriever...")
            self.specialized_agents = {
                "Criminal Law": CriminalLawAgent(retriever),
                "Civil Law": CivilLawAgent(retriever),
                "Family Law": FamilyLawAgent(retriever),
                "Corporate Law": CorporateLawAgent(retriever)
            }
            logger.info("All specialized agents initialized successfully")

        except Exception as e:
            logger.error("Failed to initialize specialized agents", exc_info=True)
            raise

        self.agent_descriptions = {
            "Criminal Law": "Specializes in criminal procedures, penal codes, criminal liability, and justice system analysis",
            "Civil Law": "Focuses on private rights, obligations, contracts, torts, and civil remedies research",
            "Family Law": "Researches personal laws, marriage, divorce, custody, and domestic relations",
            "Corporate Law": "Analyzes business law, corporate governance, securities, and commercial regulations"
        }
        
        self.synthesis_agent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GEMINI_API_KEY")),
            storage=SqlAgentStorage(table_name="synthesis_sessions", db_file="tmp/legal_storage.db"),
            add_history_to_messages=True,
            num_history_responses=5,
            description="""You are a legal research synthesis expert. Your role is to:
                         1. Understand and analyze legal research queries
                         2. Identify when more context is needed
                         3. Synthesize research findings from specialist agents
                         You maintain conversation history and can reference past discussions.""",
            instructions=[
                "When receiving a query from a user:",
                "- Analyze if you have enough context to provide a meaningful response",
                "- If more context is needed, specify exactly what information would help",
                "- Consider your conversation history for relevant past discussions",
                
                "When receiving specialist research findings:",
                "- Synthesize the findings into a comprehensive response",
                "- Ensure all relevant aspects are covered",
                "- Structure the response clearly with proper citations",
                "- Focus on facts, precedents, and legal principles"
            ],
            response_model=SynthesisResponse
        )

        self.task_agent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GEMINI_API_KEY")),
            description="""You are a legal research coordinator. Your role is to:
                         1. Analyze research requirements
                         2. Determine which specialist agents are strictly necessary
                         3. Formulate specific queries for selected specialists
                         You ensure efficient and focused research coverage.""",
            instructions=[
                "When receiving a research overview:",
                "- Carefully analyze the core legal domains involved",
                "- Select ONLY the specialist agents whose expertise is directly relevant",
                "- Do not include specialists whose domains are only tangentially related",
                "- Create focused, specific queries for each selected specialist",
                "- Ensure each specialist query addresses unique aspects",
                "- Provide clear reasoning for each specialist selected"
            ],
            response_model=TaskAssignment
        )
        
        logger.info("Legal Research Assistant initialized successfully")

    def process_query(self, query: str, context: str = "") -> str:
        try:
            full_query = f"{query}\nContext: {context}" if context else query
            logger.info(f"Processing new research query: {query[:100]}")
            
            initial_response = self.synthesis_agent.run(
                f"""[USER QUERY]
                   Query: {full_query}
                   
                   Analyze if you have enough context to provide a meaningful response.
                   If more context is needed, specify exactly what additional information would help."""
            ).content

            if initial_response.needs_context:
                logger.info("Additional context needed")
                required_context = "\n".join([f"- {item}" for item in initial_response.context_requirements])
                return f"To better research this topic, please provide the following information:\n{required_context}"

            logger.info("Getting specialist assignments")
            task_assignment = self.task_agent.run(
                f"""Research Overview: {full_query}

                   Available Specialists and their expertise:
                   {', '.join(f'{k}: {v}' for k, v in self.agent_descriptions.items())}
                   
                   Analyze the query and select ONLY the specialists whose expertise is directly relevant.
                   For each selected specialist, create a focused research query that leverages their specific expertise.
                   
                   Remember: Only select specialists whose domains are central to the research query."""
            ).content

            # Collect specialist responses
            consultations = []
            if task_assignment.required_agents:
                logger.info(f"Consulting specialists: {', '.join(task_assignment.required_agents)}")
                for expert in task_assignment.required_agents:
                    if expert in self.specialized_agents:
                        try:
                            response = self.specialized_agents[expert].get_response(
                                task_assignment.queries[expert]
                            )
                            consultations.append(ConsultationResponse(
                                agent_name=expert,
                                response=response
                            ))
                        except Exception as e:
                            logger.error(f"Error consulting {expert}: {str(e)}", exc_info=True)
            else:
                logger.info("No specialists required for this query")

            # Final synthesis
            logger.info("Synthesizing final research findings")
            consultation_context = "\n".join([
                f"Expert: {c.agent_name}\nFindings: {c.response}"
                for c in consultations
            ])

            final_response = self.synthesis_agent.run(
                f"""[SPECIALIST FINDINGS]
                   Original Query: {full_query}
                   
                   Specialist Research Findings:
                   {consultation_context}
                   
                   Please synthesize these findings into a comprehensive analysis."""
            ).content

            return final_response.response

        except Exception as e:
            logger.error(f"Error processing research query: {str(e)}", exc_info=True)
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
    """Run an interactive research session"""
    try:
        logger.info("Starting interactive research session")
        
        # Initialize database first
        retriever = initialize_database()
        
        # Create agent with retriever
        agent = LegalAgent(retriever)

        while True:
            try:
                query = input("\nEnter your research query (or 'exit' to quit): ").strip()
                if query.lower() == 'exit':
                    logger.info("Ending research session")
                    break

                context = ""
                while True:  # Context gathering loop
                    response = agent.process_query(query, context)
                    
                    if "To better research this topic" in response:
                        print("\n" + response)
                        print("\nPlease provide the requested information (or press enter to skip):")
                        
                        new_context = []
                        for line in response.split('\n'):
                            if line.startswith('- '):
                                info = input(f"{line[2:]}: ").strip()
                                if info:
                                    new_context.append(f"{line[2:]}: {info}")
                        
                        if not new_context:  # If user skipped all context
                            logger.info("User skipped providing additional context")
                            break
                        
                        context = "\n".join(new_context)
                        logger.info("Received additional context, reprocessing query")
                        continue  # Continue the context gathering loop
                    
                    # If no more context needed, print response and break context loop
                    print("\nResearch Findings:")
                    print(response)
                    print("\n" + "="*80)
                    break

            except Exception as e:
                logger.error("Error processing query", exc_info=True)
                print(f"An error occurred: {str(e)}")
                print("You can try another query")

    except Exception as e:
        logger.error("Fatal session error", exc_info=True)
        print(f"A fatal error occurred: {str(e)}")

if __name__ == "__main__":
    interactive_session()