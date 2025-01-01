import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  Plus, 
  Scale, 
  Clock, 
  Search,
  ArrowRight,
  InfoIcon,
  X,
  Pencil,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import PropTypes from 'prop-types';
import { Button } from './shared/Button';
import { Card } from './shared/Card';
import { Loading } from './shared/Loading';
import { api } from '../services/api';

const CaseDetailsModal = ({ isOpen, onClose, caseDetails }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-display font-bold">{caseDetails.title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Case ID</h3>
                <p className="mt-1">{caseDetails.case_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">{caseDetails.case_status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1">{caseDetails.created_at}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Updated At</h3>
                <p className="mt-1">{caseDetails.updated_at}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">{caseDetails.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Lawyer 1 Evidences</h3>
              <div className="mt-2 space-y-2">
                {caseDetails.lawyer1_evidences?.map((evidence, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">{evidence.description}</p>
                    <p className="text-sm text-gray-500 mt-1">File: {evidence.original_name}</p>
                    <p className="text-sm text-gray-500">Submitted: {evidence.submitted_at}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Lawyer 2 Evidences</h3>
              <div className="mt-2 space-y-2">
                {caseDetails.lawyer2_evidences?.map((evidence, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">{evidence.description}</p>
                    <p className="text-sm text-gray-500 mt-1">File: {evidence.original_name}</p>
                    <p className="text-sm text-gray-500">Submitted: {evidence.submitted_at}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

CaseDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  caseDetails: PropTypes.object
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, caseName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Delete Case</h3>
        </div>
        
        <p className="text-gray-600 mb-2">Are you sure you want to delete <span className="font-medium text-black">{caseName}</span>?</p>
        <p className="text-sm text-gray-500 mb-6">This action cannot be undone. All case data, evidence, and reports will be permanently deleted.</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete Case
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  caseName: PropTypes.string
};

const CaseCard = ({ legalCase, onDelete }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caseDetails, setCaseDetails] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCaseDetails = async (case_id) => {
    try {
      const details = await api.getCaseDetailsById(case_id);
      setCaseDetails(details);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cases/${legalCase.case_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onDelete(legalCase.case_id);
      } else {
        throw new Error('Failed to delete case');
      }
    } catch (error) {
      console.error('Error deleting case:', error);
    }
    setShowDeleteModal(false);
  };
  
  const statusColors = {
    'Open': 'bg-emerald-50 text-emerald-700',
    'Closed': 'bg-red-50 text-gray-700',
    'closed': 'bg-red-50 text-gray-700',
    'In Progress': 'bg-amber-50 text-amber-700'
  };
  
  return (
    <>
      <Card 
        className="relative p-4 md:p-5 border border-black/5 hover:border-black/10 flex flex-col transition-all duration-200"
        hover={false}
      >
        {/* Top Row with Status and Actions */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[legalCase.case_status]}`}>
            {legalCase.case_status === "closed" ? "Closed" : legalCase.case_status}
          </span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCaseDetails(legalCase.case_id)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <InfoIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/cases/${legalCase.case_id}/edit`)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Case Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-black/5 rounded-lg shrink-0">
            <Scale className="w-5 h-5 text-black" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-display font-semibold text-black mb-0.5 break-words">
              {legalCase.title}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              Case #{legalCase.case_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Created {legalCase.created_at}</span>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(legalCase.case_status === 'Open' ? `/chat/${legalCase.case_id}` : `/chat/${legalCase.case_id}/review`)}
          className="mt-auto w-full border-black/10 hover:bg-black hover:text-white transition-colors group rounded-full"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="font-medium">
              {legalCase.case_status === 'Open' ? 'Enter Courtroom' : 'Review Conversation'}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Button>
      </Card>

      <CaseDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        caseDetails={caseDetails}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        caseName={legalCase.title}
      />
    </>
  );
};

CaseCard.propTypes = {
  legalCase: PropTypes.shape({
    case_id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    case_status: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired
  }).isRequired,
  onDelete: PropTypes.func.isRequired
};

const Cases = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCases();
  }, [user]);

  const fetchCases = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cases`);
      if (response.ok) {
        const allCases = await response.json();
        const userCases = allCases.filter(
          legalCase => legalCase.lawyer1_address === user.sub
        );
        const sortedCases = userCases.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setCases(sortedCases);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseDelete = (caseId) => {
    setCases(cases.filter(c => c.case_id !== caseId));
  };

  if (loading) {
    return <Loading />;
  }

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-black">Your Cases</h1>
              <p className="text-gray-500 mt-1">Manage and track your legal cases</p>
            </div>
            <Button
              onClick={() => navigate('/cases/create')}
              className="sm:w-auto w-full"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Case</span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white border border-black/10 rounded-xl
                       placeholder:text-gray-400 text-black focus:outline-none focus:border-black/20 focus:ring-0"
            />
          </div>
        </div>

        {/* Cases Grid */}
        {filteredCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((legalCase) => (
              <CaseCard 
                key={legalCase.case_id} 
                legalCase={legalCase}
                onDelete={handleCaseDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-black/40" />
            </div>
            <h3 className="text-xl font-display font-semibold text-black mb-2">
              No cases found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? "No cases match your search criteria" 
                : "Get started by creating your first case"}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/cases/create')}
              className="border-black/10"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Case</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cases;
