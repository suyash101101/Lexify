import { useState, useRef, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, Plus, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

const CASE_TEMPLATES = [
  {
    id: 1,
    title: "Intellectual Property Dispute",
    description: "A comprehensive template for intellectual property cases, specifically designed for software patent disputes, trademark infringements, and copyright violations. Ideal for tech companies, startups, and digital content creators seeking to protect their intellectual assets.",
    icon: "💡",
    sampleData: {
      title: "Software Patent Infringement - Algorithm Implementation",
      description: `Case regarding unauthorized use of proprietary machine learning algorithms in competitor's software product.

Key Points:
• Patent No. US 10,XXX,XXX covers novel ML-based data processing methods
• Evidence of implementation in competitor's product version 2.4.1
• Estimated market impact of $2.5M in lost revenue
• Prior communication with defendant dated March 15, 2024

Initial Assessment:
Clear indication of patent infringement based on code analysis and market research. The implementation closely mirrors our protected methodologies, particularly in the data preprocessing and model optimization components.`,
      files: [
        {
          ipfs_hash: "template-patent-technical",
          description: "Technical Analysis Report comparing patent claims with competitor's implementation. Includes code snippets, architecture diagrams, and performance metrics demonstrating similarity in methodology.",
          original_name: "technical_analysis.pdf"
        },
        {
          ipfs_hash: "template-patent-market",
          description: "Market Impact Assessment detailing revenue loss, market share impact, and competitive advantage erosion due to infringement.",
          original_name: "market_impact.pdf"
        },
        {
          ipfs_hash: "template-patent-communication",
          description: "Prior communication records with the defendant, including cease and desist notices and response documentation.",
          original_name: "communication_history.pdf"
        }
      ],
      lawyer2_files: [
        {
          ipfs_hash: "ai-template-patent-precedent",
          description: "AI-generated analysis of similar patent infringement cases in the software industry, with success rates and settlement statistics.",
          original_name: "precedent_analysis.pdf"
        },
        {
          ipfs_hash: "ai-template-patent-valuation",
          description: "AI-driven patent valuation report including market analysis, technology assessment, and damages calculation methodology.",
          original_name: "valuation_report.pdf"
        }
      ],
      case_status: "Open"
    }
  },
  {
    id: 2,
    title: "Contract Breach Resolution",
    description: "Specialized template for complex contract disputes, focusing on service agreements, payment terms, and delivery obligations. Perfect for business-to-business conflicts, service provider disputes, and commercial contract breaches.",
    icon: "📝",
    sampleData: {
      title: "Enterprise SaaS Agreement Breach - Service Level Violation",
      description: `High-priority contract breach case involving enterprise SaaS provider's failure to meet agreed service levels and data security requirements.

Key Violations:
• Consistent failure to maintain 99.9% uptime SLA (documented downtimes)
• Multiple data security incidents violating ISO 27001 compliance requirements
• Delayed implementation of critical security patches
• Financial impact exceeding $500,000 in business losses

Timeline of Events:
1. Contract Execution: January 1, 2024
2. Initial SLA Violations: March 2024
3. Formal Complaints: April 15, 2024
4. Security Incidents: May 2024
5. Breach Notice: June 1, 2024`,
      files: [
        {
          ipfs_hash: "template-contract-original",
          description: "Original service agreement with highlighted sections detailing SLA requirements, security obligations, and breach remedies.",
          original_name: "service_agreement.pdf"
        },
        {
          ipfs_hash: "template-contract-violations",
          description: "Comprehensive documentation of SLA violations, including downtime logs, incident reports, and financial impact assessments.",
          original_name: "violation_evidence.pdf"
        },
        {
          ipfs_hash: "template-contract-correspondence",
          description: "Email correspondence, formal notices, and meeting minutes documenting the escalation of issues.",
          original_name: "correspondence.pdf"
        }
      ],
      lawyer2_files: [
        {
          ipfs_hash: "ai-template-contract-analysis",
          description: "AI analysis of contract terms, breach severity, and potential remedies based on similar cases and legal precedents.",
          original_name: "legal_analysis.pdf"
        },
        {
          ipfs_hash: "ai-template-damages-calculation",
          description: "AI-generated damage calculation report including direct losses, consequential damages, and potential recovery strategies.",
          original_name: "damages_report.pdf"
        }
      ],
      case_status: "Open"
    }
  },
  {
    id: 3,
    title: "Employment Discrimination",
    description: "Comprehensive template for workplace discrimination cases, covering various forms of discrimination, harassment, and retaliation. Suitable for cases involving protected characteristics, workplace harassment, or unfair treatment.",
    icon: "👥",
    sampleData: {
      title: "Workplace Age Discrimination and Systematic Bias",
      description: `Employment discrimination case involving systematic age discrimination in tech company's hiring and promotion practices.

Allegations:
• Discriminatory hiring practices targeting candidates over 40
• Pattern of promotion denials for senior employees
• Hostile work environment and age-related harassment
• Retaliatory actions following internal complaints

Evidence Timeline:
1. Initial Hiring Data Analysis: 2023-2024
2. Internal HR Complaints: Multiple instances
3. Performance Reviews: 2023-2024
4. Witness Statements: 15 current/former employees
5. Statistical Analysis: Department demographics

Supporting Documentation includes internal communications, HR records, and statistical analysis of hiring/promotion patterns over 24 months.`,
      files: [
        {
          ipfs_hash: "template-hr-demographics",
          description: "Detailed statistical analysis of company demographics, hiring patterns, and promotion history showing age-based disparities.",
          original_name: "demographic_analysis.pdf"
        },
        {
          ipfs_hash: "template-hr-complaints",
          description: "Collection of internal complaints, HR responses, and witness statements documenting discriminatory practices.",
          original_name: "complaint_records.pdf"
        },
        {
          ipfs_hash: "template-hr-performance",
          description: "Performance reviews and promotion records showing discrepancies between age groups despite similar qualifications.",
          original_name: "performance_records.pdf"
        }
      ],
      lawyer2_files: [
        {
          ipfs_hash: "ai-template-discrimination-analysis",
          description: "AI-powered analysis of discrimination patterns, statistical significance, and comparison with industry standards.",
          original_name: "pattern_analysis.pdf"
        },
        {
          ipfs_hash: "ai-template-precedent-review",
          description: "Comprehensive review of similar age discrimination cases, settlement amounts, and successful legal strategies.",
          original_name: "precedent_review.pdf"
        }
      ],
      case_status: "Open"
    }
  }
];

const LEGAL_QUOTES = [
  "Justice delayed is justice denied, but preparation ensures perfection.",
  "The law is reason, free from passion.",
  "In law, nothing is certain but the expense.",
  "The best lawyer knows both law and human nature.",
  "Laws are like cobwebs, which may catch small flies, but let wasps and hornets break through."
];

const LoadingModal = ({ isOpen, progress }) => {
  const [quote, setQuote] = useState(() => 
    LEGAL_QUOTES[Math.floor(Math.random() * LEGAL_QUOTES.length)]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(LEGAL_QUOTES[Math.floor(Math.random() * LEGAL_QUOTES.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Processing Files', description: 'Analyzing and preparing case documents' },
    { id: 2, title: 'Content Verification', description: 'Verifying evidence and cross-referencing data' },
    { id: 3, title: 'Generating Case Report', description: 'Creating comprehensive case documentation' },
    { id: 4, title: 'Finalizing', description: 'Saving case details and setting up the workspace' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black">Creating Your Case</h3>
            <p className="text-sm text-gray-500 mt-1">Please wait while we set everything up</p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isActive = progress === index;
              const isCompleted = progress > index;
              return (
                <div 
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors
                    ${isActive ? 'bg-gray-50 border border-gray-100' : ''}`}
                >
                  <div className={`mt-0.5 ${isCompleted ? 'text-green-500' : isActive ? 'text-black' : 'text-gray-300'}`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <div className={`w-5 h-5 border-2 rounded-full ${isActive ? 'border-black' : 'border-current'}`}>
                        {isActive && (
                          <div className="w-full h-full rounded-full bg-black/10 animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-black' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quote Section */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center italic">"{quote}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

LoadingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  progress: PropTypes.number.isRequired
};

const CreateCase = () => {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [lawyer2Files, setLawyer2Files] = useState([]);
  const [loading, setLoading] = useState(false);
  const [descriptionFile, setDescriptionFile] = useState(null);
  const [originalDescription, setOriginalDescription] = useState('');
  const fileInputRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleTemplateSelect = (template) => {
    setTitle(template.sampleData.title);
    setDescription(template.sampleData.description);
    
    // Convert template files to the expected format
    const templateFiles = template.sampleData.files.map(file => ({
      file: new File(["template content"], file.original_name, { type: "application/pdf" }),
      fileContent: file.description,
      userDescription: file.description,
      original_name: file.original_name
    }));
    
    const templateAIFiles = template.sampleData.lawyer2_files.map(file => ({
      file: new File(["template content"], file.original_name, { type: "application/pdf" }),
      fileContent: file.description,
      userDescription: file.description,
      original_name: file.original_name
    }));
    
    setFiles(templateFiles);
    setLawyer2Files(templateAIFiles);
  };

  const handleFileUpload = async (event) => {
    const newFiles = await Promise.all(Array.from(event.target.files).map(async (file) => {
      let fileContent = '';
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        fileContent = await readFileContent(file);
      }
      return {
        file,
        fileContent,
        userDescription: '',
        original_name: file.name
      };
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleAIFileUpload = async (event) => {
    const newFiles = await Promise.all(Array.from(event.target.files).map(async (file) => {
      let fileContent = '';
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        fileContent = await readFileContent(file);
      }
      return {
        file,
        fileContent,
        userDescription: '',
        original_name: file.name
      };
    }));
    setLawyer2Files([...lawyer2Files, ...newFiles]);
  };

  const handleDescriptionChange = (index, userDescription) => {
    const updatedFiles = [...files];
    updatedFiles[index].userDescription = userDescription;
    setFiles(updatedFiles);
  };

  const handleAIDescriptionChange = (index, userDescription) => {
    const updatedFiles = [...lawyer2Files];
    updatedFiles[index].userDescription = userDescription;
    setLawyer2Files(updatedFiles);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleRemoveAIFile = (index) => {
    setLawyer2Files(lawyer2Files.filter((_, i) => i !== index));
  };

  const handleDescriptionFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain')) {
      setDescriptionFile(selectedFile);
      const fileContent = await readFileContent(selectedFile);
      setOriginalDescription(description);
      setDescription(description + '\n' + fileContent);
    } else {
      alert('Please upload a valid PDF or TXT file.');
      e.target.value = null;
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (file.type === 'application/pdf') {
          try {
            const pdf = await pdfjsLib.getDocument({ data: event.target.result }).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              textContent.items.forEach(item => {
                text += item.str + ' ';
              });
            }
            resolve(text);
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(event.target.result);
        }
      };
      reader.onerror = (error) => reject(error);
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleRemoveDescriptionFile = () => {
    setDescriptionFile(null);
    setDescription(originalDescription);
    setOriginalDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingProgress(0);

    try {
      // Start file processing
      setLoadingProgress(0);
      const formData = {
        title,
        description,
        lawyer1_address: user.sub,
        files: await Promise.all(files.map(async (fileObj) => {
          const ipfsHash = `placeholder-${fileObj.original_name}`;
          return {
            ipfs_hash: ipfsHash,
            description: fileObj.fileContent + '\n' + fileObj.userDescription,
            original_name: fileObj.original_name
          };
        })),
        lawyer2_files: await Promise.all(lawyer2Files.map(async (fileObj) => {
          const ipfsHash = `ai-placeholder-${fileObj.original_name}`;
          return {
            ipfs_hash: ipfsHash,
            description: fileObj.fileContent + '\n' + fileObj.userDescription,
            original_name: fileObj.original_name
          };
        })),
        case_status: "Open"
      };

      // Content verification stage
      setLoadingProgress(1);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate verification time

      // Case report generation
      setLoadingProgress(2);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cases/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create case');
      }

      // Finalizing
      setLoadingProgress(3);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Give time to see the completion
      
      navigate(`/cases`);
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-black">Create New Case</h1>
            <p className="text-gray-600 text-sm mt-1">Fill in the details or use a template to get started quickly</p>
          </div>

          <div className="grid lg:grid-cols-[300px,1fr] gap-6">
            {/* Templates Section - Left Side */}
            <div>
              <div className="sticky top-8">
                <h2 className="text-base font-medium text-black mb-1">Templates</h2>
                <p className="text-gray-500 text-sm mb-3">Quick start with pre-built cases</p>
                
                <div className="space-y-2">
                  {CASE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <h3 className="font-medium text-black text-sm">{template.title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{template.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Create Case Form - Right Side */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-md border border-gray-200 
                        focus:border-black focus:ring-0
                        bg-white text-black placeholder-gray-400"
                      placeholder="Enter case title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-3 py-2 rounded-md border border-gray-200 
                        focus:border-black focus:ring-0
                        bg-white text-black placeholder-gray-400"
                      placeholder="Describe your case"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description File</label>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleDescriptionFileChange}
                      ref={fileInputRef}
                      className="block w-full text-sm text-gray-500 
                        file:mr-4 file:py-2 file:px-4 
                        file:rounded-md file:border file:border-gray-200
                        file:text-sm file:font-medium
                        file:bg-white file:text-black
                        hover:file:border-gray-300"
                    />
                  </div>

                  {/* Evidence Files Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Evidence Files</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                        <input
                          type="file"
                          hidden
                          multiple
                          onChange={handleFileUpload}
                          id="evidence-upload"
                        />
                        <label 
                          htmlFor="evidence-upload"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Drop files or click to upload</span>
                        </label>
                      </div>
                    </div>

                    {/* File List */}
                    <div className="space-y-2">
                      {files.map((fileObj, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-md border border-gray-200 bg-gray-50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">{fileObj.original_name}</p>
                            <input
                              type="text"
                              value={fileObj.userDescription}
                              onChange={(e) => handleDescriptionChange(index, e.target.value)}
                              placeholder="Add description"
                              className="mt-1 w-full text-sm px-3 py-1.5 rounded-md border border-gray-200 
                                focus:border-black focus:ring-0"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* AI Evidence Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">AI Evidence Files</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                        <input
                          type="file"
                          hidden
                          multiple
                          onChange={handleAIFileUpload}
                          id="ai-evidence-upload"
                        />
                        <label 
                          htmlFor="ai-evidence-upload"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Drop AI files or click to upload</span>
                        </label>
                      </div>
                    </div>

                    {/* AI File List */}
                    <div className="space-y-2">
                      {lawyer2Files.map((fileObj, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-md border border-gray-200 bg-gray-50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">{fileObj.original_name}</p>
                            <input
                              type="text"
                              value={fileObj.userDescription}
                              onChange={(e) => handleAIDescriptionChange(index, e.target.value)}
                              placeholder="Add description"
                              className="mt-1 w-full text-sm px-3 py-1.5 rounded-md border border-gray-200 
                                focus:border-black focus:ring-0"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAIFile(index)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || files.length === 0}
                  className={`w-full h-11 px-6 rounded-full text-white font-medium flex items-center justify-center gap-2
                    ${loading || files.length === 0
                      ? 'bg-black/40 cursor-not-allowed'
                      : 'bg-black hover:bg-black/90'
                    } transition-colors`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Create Case</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
      <LoadingModal isOpen={loading} progress={loadingProgress} />
    </div>
  );
};

export default CreateCase;