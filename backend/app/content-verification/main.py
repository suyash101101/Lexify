from Agents.AITextDetector import AITextDetection
from Agents.FlowAnalyser import FlowAnalysis
from Agents.ReferenceAnalyser import ReferenceAnalysis
from Agents.Summarizer import Summarize
from Agents.Verifier import Verify

file_path = r'./case.txt'
reference_path = r'./references'

def Verification(file_path, reference_path):
    print(AITextDetection(file_path))
    print(FlowAnalysis(file_path))
    print(Summarize(file_path))
    print(ReferenceAnalysis(file_path,reference_path))
    print(Verify())

Verification(file_path,reference_path)