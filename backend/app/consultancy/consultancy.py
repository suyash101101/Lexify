from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from phi.agent import Agent, RunResponse
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from phi.model.google import Gemini
import os
from dotenv import load_dotenv
from phi.storage.agent.sqlite import SqlAgentStorage

load_dotenv()

Settings.chunk_size = 256
Settings.chunk_overlap = 50
Settings.embed_model = HuggingFaceEmbedding(
    model_name="all-MiniLM-L6-v2"
)

class RAG:
    def __init__(self):
        data_dir = 'app/consultancy/data'
        documents = SimpleDirectoryReader(input_dir=data_dir).load_data()
        self.index = VectorStoreIndex.from_documents(documents)
        self.retriever = self.index.as_retriever(similarity_top_k=5)
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=self.retriever)
        self.query_agent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv('GEMINI_API_KEY')),
            storage=SqlAgentStorage(table_name="consultancy_sessions", db_file="tmp/consultancy_storage.db"),
            add_history_to_messages=True,
            num_history_responses=3,
            description=(
                "You are a consultancy agent that assists lawyers with their queries. "
                "You provide information about relevant Indian laws and international jurisprudence. "
            ),
            instructions=[
                "You will receive a query regarding a legal case or situation.",
                "Respond to the query in a structured format, including all necessary materials such as articles, acts, rules, regulations, and judgments.",
                "Input format: The following is the query: [query]\nThe following is the context: [context].",
                "Address only the query while utilizing the context to formulate your response.",
                "Ensure that your answer is clear, concise, and well-organized.",
                "Ensure any legal references mentions the particular book, section, and page number used from the knowledge base.",
                "Dont start with 'The following is the answer to your query:' or anything similar."
                "Directly give the answer to the query."
            ],
            debug_mode=True
        )
        self.consulting_agent = Agent(
            model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),
            knowledge_base=self.knowledge_base, 
            description="You are a legal analysis system with extensive knowledge of Indian law and international jurisprudence. Your goal is to provide structured and accurate legal insights.",
            instructions=[
                "You will receive a query about a legal case or situation.",
                "Your task is to gather all relevant context needed to provide a comprehensive answer.",
                "Respond to the query in a structured format, including all necessary materials such as articles, acts, rules, regulations, and judgments.",
                "Ensure that your answer is clear, concise, and well-organized."
                "Be precise and concise in your response."
                "Dont start with 'The following is the answer to your query:' or anything similar."
                "Directly give the answer to the query."
            ],
            debug_mode=True
        )
    
    def ask(self, prompt):
        run: RunResponse = self.consulting_agent.run(prompt)
        print(run.content)
        query = (
            f"The following is the query: {prompt}\n"
            f"The following is the context: {run.content}"
        )
        run: RunResponse = self.query_agent.run(query)
        return run.content
    
# def main():
#     agent = RAG()
#     prompt = input("Enter your query: ")
#     while prompt != "exit":
#         ans = agent.ask(prompt)
#         print(ans)
#         prompt = input("Enter your query: ")

# main()

class ConsultancySession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.rag_agent = RAG()
        
    def ask(self, prompt: str) -> str:
        return self.rag_agent.ask(prompt)

class ConsultancyManager:
    def __init__(self):
        self.active_sessions = {}
        
    def create_session(self, session_id: str) -> ConsultancySession:
        session = ConsultancySession(session_id)
        self.active_sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> ConsultancySession:
        return self.active_sessions.get(session_id)
    
    def remove_session(self, session_id: str):
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]