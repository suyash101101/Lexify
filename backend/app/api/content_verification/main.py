from .Agents.AITextDetector import AITextDetection
from .Agents.FlowAnalyser import FlowAnalysis
from .Agents.ReferenceAnalyser import ReferenceAnalysis
from .Agents.Summarizer import Summarize
from .Agents.Verifier import Verify

class ContentVerification:
    def __init__(self,file_path,reference_path):
        self.file_path = file_path
        self.reference_path = reference_path
    
    def verify_content(self, file_path, reference_path):
        """
        Runs all verification checks and returns results
        """
        self.file_path = file_path
        self.reference_path = reference_path
        
        print(AITextDetection(self.file_path))
        print(FlowAnalysis(self.file_path))
        print(Summarize(self.file_path))
        print(ReferenceAnalysis(self.file_path, self.reference_path))
        print(Verify(self.file_path))

