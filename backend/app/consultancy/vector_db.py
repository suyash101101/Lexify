from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from phi.utils.log import logger
import os
from dotenv import load_dotenv

load_dotenv()

Settings.chunk_size = 256
Settings.chunk_overlap = 50
Settings.embed_model = HuggingFaceEmbedding(
    model_name="all-MiniLM-L6-v2"
)

class VectorDatabase:
    _instance = None
    _is_initialized = False

    def __new__(cls):
        if cls._instance is None:
            logger.info("Creating new VectorDatabase instance")
            cls._instance = super(VectorDatabase, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._is_initialized:
            logger.info("Initializing VectorDatabase...")
            try:
                data_dir = os.getenv("DATA_DIR")
                if not data_dir:
                    raise ValueError("DATA_DIR environment variable not set")
                
                logger.info(f"Loading documents from {data_dir}")
                documents = SimpleDirectoryReader(input_dir=data_dir).load_data()
                logger.info(f"Loaded {len(documents)} documents")

                logger.info("Creating vector index...")
                self.index = VectorStoreIndex.from_documents(documents)
                logger.info("Vector index created successfully")

                logger.info("Setting up retriever...")
                self.retriever = self.index.as_retriever(similarity_top_k=10)
                logger.info("Retriever setup complete")

                self._is_initialized = True
                logger.info("VectorDatabase initialization complete")

            except Exception as e:
                logger.error(f"Error initializing VectorDatabase: {str(e)}", exc_info=True)
                raise

    def get_retriever(self):
        """Get the retriever instance"""
        try:
            return self.retriever
        except AttributeError:
            logger.error("Retriever not initialized", exc_info=True)
            raise