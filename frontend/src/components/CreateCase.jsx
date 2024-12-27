import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, Plus } from 'lucide-react';
import CryptoJS from 'crypto-js';

const CreateCase = () => {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [lawyer2Files, setLawyer2Files] = useState([]);
  const [loading, setLoading] = useState(false);

  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(
      data, 
      import.meta.env.VITE_ENCRYPTION_KEY
    ).toString();
  };

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files).map(file => ({
      file,
      description: '',
      original_name: file.name
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDescriptionChange = (index, description) => {
    const updatedFiles = [...files];
    updatedFiles[index].description = description;
    setFiles(updatedFiles);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleAIFileUpload = (event) => {
    const newFiles = Array.from(event.target.files).map(file => ({
      file,
      description: '',
      original_name: file.name
    }));
    setLawyer2Files([...lawyer2Files, ...newFiles]);
  };

  const handleAIDescriptionChange = (index, description) => {
    const updatedFiles = [...lawyer2Files];
    updatedFiles[index].description = description;
    setLawyer2Files(updatedFiles);
  };

  const handleRemoveAIFile = (index) => {
    setLawyer2Files(lawyer2Files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = {
        title,
        description,
        lawyer1_address: user.sub,
        files: await Promise.all(files.map(async (fileObj) => {
          const ipfsHash = `placeholder-${fileObj.original_name}`;
          
          return {
            ipfs_hash: ipfsHash,
            description: fileObj.description,
            original_name: fileObj.original_name
          };
        })),
        lawyer2_files: await Promise.all(lawyer2Files.map(async (fileObj) => {
          const ipfsHash = `ai-placeholder-${fileObj.original_name}`;
          
          return {
            ipfs_hash: ipfsHash,
            description: fileObj.description,
            original_name: fileObj.original_name
          };
        })),
        case_status: "Open"
      };

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
      
      navigate(`/cases`);
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="relative bg-white p-8 rounded-[16px] border border-[rgba(0,0,0,0.05)] shadow-lg">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-[#222] font-poppins mb-2">Create New Case</h1>
            <p className="text-[#333] mb-8">Fill in the details to create a new legal case</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-[#333] font-poppins">Case Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full h-[48px] px-[16px] rounded-[8px] border border-[rgba(0,0,0,0.1)] 
                    focus:border-black focus:shadow-sm
                    bg-white text-[#333] placeholder-[#666] font-inter"
                  placeholder="Enter case title"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-[#333] font-poppins mb-1">Case Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-[16px] py-[16px] rounded-[8px] border border-[rgba(0,0,0,0.1)] 
                    focus:border-black focus:shadow-sm
                    bg-white text-[#333] placeholder-[#666] font-inter transition-all"
                  placeholder="Describe your case"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-[#333] font-poppins">Your Evidence Files</label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-[24px] py-[24px] bg-[#F5F5F5] text-[#333] border-2 border-[rgba(0,0,0,0.1)] border-dashed cursor-pointer hover:bg-[#EBEBEB] transition-all rounded-[8px]">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm font-inter">Drop files here or click to upload</span>
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </motion.div>

              {/* File List */}
              <motion.div layout className="space-y-3">
                {files.map((fileObj, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-start space-x-4 bg-[#F5F5F5] p-[16px] rounded-[8px]"
                  >
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-[#333] font-poppins">{fileObj.original_name}</p>
                      <input
                        type="text"
                        value={fileObj.description}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        placeholder="Add file description"
                        className="w-full h-[48px] px-[16px] text-sm rounded-[8px] border border-[rgba(0,0,0,0.1)] focus:border-black focus:shadow-sm font-inter"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-2 text-[#666] hover:text-[#DC2626] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>

              {/* AI Evidence */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
              <div className="space-y-4">
                <label className="block text-sm font-medium text-[#333] font-poppins">AI Evidence Files</label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-[24px] py-[24px] bg-[#F5F5F5] text-[#333] border-2 border-[rgba(0,0,0,0.1)] border-dashed cursor-pointer hover:bg-[#EBEBEB] transition-all rounded-[8px]">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm font-inter">Drop AI files here or click to upload</span>
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleAIFileUpload}
                    />
                  </label>
                </div>
              </div>
              </motion.div>

              {/* AI File List */}
              <motion.div layout className="space-y-3">
                {lawyer2Files.map((fileObj, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-start space-x-4 bg-[#F5F5F5] p-[16px] rounded-[8px]"
                  >
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-[#333] font-poppins">{fileObj.original_name}</p>
                      <input
                        type="text"
                        value={fileObj.description}
                        onChange={(e) => handleAIDescriptionChange(index, e.target.value)}
                        placeholder="Add AI file description"
                        className="w-full h-[48px] px-[16px] text-sm rounded-[8px] border border-[rgba(0,0,0,0.1)] focus:border-black focus:shadow-sm font-inter"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAIFile(index)}
                      className="p-2 text-[#666] hover:text-[#DC2626] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || files.length === 0}
              className={`w-full h-[48px] px-[16px] rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 font-poppins
                ${loading || files.length === 0
                  ? 'bg-[rgba(0,0,0,0.4)] cursor-not-allowed'
                  : 'bg-black hover:opacity-95'
                } transition-all duration-200`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Create Case</span>
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCase;
