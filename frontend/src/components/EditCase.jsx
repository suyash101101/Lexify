import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const EditCase = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    case_status: ''
  });

  // Query for fetching case details
  const { isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const data = await api.getCaseDetailsById(caseId);
      if (data.lawyer1_address !== user.sub) {
        toast.error("You don't have permission to edit this case");
        navigate('/cases');
        return null;
      }
      // Prefill form data
      setFormData({
        title: data.title,
        description: data.description,
        case_status: data.case_status
      });
      return data;
    },
    enabled: !!user?.sub && !!caseId,
    onError: () => {
      toast.error('Failed to load case details');
      navigate('/cases');
    }
  });

  // Mutation for updating case
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update case');
      return response.json();
    },
    onSuccess: (response) => {
      // Update both case list and individual case cache
      queryClient.setQueryData(['case', caseId], (old) => ({ ...old, ...response }));
      queryClient.invalidateQueries(['cases', user?.sub]);
      toast.success('Case updated successfully');
      navigate('/cases');
    },
    onError: () => {
      toast.error('Failed to update case');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/cases')}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-black">Edit Case</h1>
              <p className="text-gray-600 text-sm mt-1">Update case details and status</p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full h-10 px-3 rounded-md border border-gray-200 
                      focus:border-black focus:ring-0
                      bg-white text-black placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Case Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 
                      focus:border-black focus:ring-0
                      bg-white text-black placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Case Status</label>
                  <select
                    name="case_status"
                    value={formData.case_status}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 
                      focus:border-black focus:ring-0
                      bg-white text-black"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/cases')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 
                    disabled:bg-black/40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditCase; 