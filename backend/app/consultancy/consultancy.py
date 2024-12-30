from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from phi.knowledge.llamaindex import LlamaIndexKnowledgeBase
from phi.agent import Agent, RunResponse
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from phi.model.google import Gemini
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
        query = (
            "You are a legal analysis system with comprehensive knowledge of Indian law and international jurisprudence. "
            "\nTask Configuration:"
            f"Analyze the following query: {prompt}"
            f"Reference content provided: {run.content}"
            "\nAnalysis Framework:"
            "1. Query Classification:"
            "   - Determine if query requires provided context or can be answered from legal knowledge base"
            "   - Identify primary legal domains involved"
            "   - Assess jurisdictional scope"
            "\n2. Legal Foundation Analysis:"
            "   - Relevant Articles of the Indian Constitution"
            "   - Applicable Central and State Acts"
            "   - Pertinent Rules and Regulations"
            "   - Related International Treaties/Conventions (if applicable)"
            "\n3. Precedent Examination:"
            "   - Supreme Court judgments"
            "   - High Court rulings"
            "   - Landmark international cases (if relevant)"
            "\n4. Response Structure:"
            "   - Primary legal principles"
            "   - Statutory framework"
            "   - Judicial interpretations"
            "   - Practical implications"
            "\n5. Mandatory Citations:"
            "   - Constitutional provisions with article numbers"
            "   - Complete Act names with years"
            "   - Case citations with proper format"
            "   - Sections and sub-sections of relevant laws"
            "\nResponse Parameters:"
            "- Begin with clear identification of applicable laws"
            "- Provide hierarchical legal framework starting with Constitutional provisions"
            "- Include specific sections and sub-sections of relevant acts"
            "- Reference landmark judgments with complete citations"
            "- Add explanatory notes for complex legal concepts"
            "\nContext Integration Rules:"
            "- Use provided context only if essential for query resolution"
            "- Clearly distinguish between context-based and general legal knowledge"
        )
        run: RunResponse = self.query_agent.run(query)
        return run.content
    
# def main():
#     agent = RAG()
#     ans = agent.ask("If there is a case where a wife kills the husband in self defense what all charges should she be charged with. Give relevant articles and acts for the charges.")
#     print(ans)

# main()