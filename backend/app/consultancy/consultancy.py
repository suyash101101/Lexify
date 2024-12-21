from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from phi.agent import Agent, RunResponse
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from phi.model.openai.like import OpenAILike
from phi.model.google import Gemini
from phi.model.ollama import Ollama
import os
from dotenv import load_dotenv

load_dotenv()

Settings.chunk_size = 256
Settings.chunk_overlap = 50
Settings.embed_model = HuggingFaceEmbedding(
    model_name="all-MiniLM-L6-v2"
)

class RAG:
    def __init__(self):
        data_dir = os.getenv("DATA_DIR")
        documents = SimpleDirectoryReader(input_dir=data_dir).load_data()
        self.index = VectorStoreIndex.from_documents(documents)
        self.retriever = self.index.as_retriever(similarity_top_k=5)
        self.knowledge_base = LlamaIndexKnowledgeBase(retriever=self.retriever)
        self.query_agent = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")), debug_mode=True)
        self.consulting_agent = Agent(model=Gemini(id="gemini-2.0-flash-exp", api_key=os.getenv("GOOGLE_API_KEY")),knowledge_base=self.knowledge_base, debug_mode=True)
    
    def ask(self, prompt):
        query = f"For the given prompt {prompt} get all relevant context needed to give the answer."
        run: RunResponse = self.consulting_agent.run(query)
        print(run.content)
        query = f"now using the content {run.content} give a good response for the following query {prompt}.Always provide the list of relavent articles and acts for the content based on Indian constitution and all acts. Use the context only if necessary. If you already know the answer without the need of the context do not use the context. "
        run: RunResponse = self.query_agent.run(query)
        return run.content
    
# def main():
#     agent = RAG()
#     ans = agent.ask("If there is a case where a wife kills the husband in self defense what all charges should she be charged with. Give relevant articles and acts for the charges.")
#     print(ans)

# main()