import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  Plus, 
  Scale, 
  Clock, 
  Search,
  ArrowRight
} from 'lucide-react';
import PropTypes from 'prop-types';
import { Button } from './shared/Button';
import { Card } from './shared/Card';
import { Loading } from './shared/Loading';

const CaseCard = ({ legalCase }) => {
  const navigate = useNavigate();
  
  const statusColors = {
    'Open': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Closed': 'bg-gray-50 text-gray-700 border border-gray-200',
    'In Progress': 'bg-amber-50 text-amber-700 border border-amber-200'
  };
  
  return (
    <Card 
      className="relative overflow-hidden p-5 border border-black/5"
      hover={false}
    >
      {/* Status Badge */}
      <div className={`
        absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium
        ${statusColors[legalCase.case_status]}
      `}>
        {legalCase.case_status}
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-black/5 rounded-lg">
            <Scale className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-black mb-0.5">
              {legalCase.title}
            </h3>
            <p className="text-gray-500 text-sm">
              Case #{legalCase.case_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Clock className="w-4 h-4" />
          <span>Created {new Date(legalCase.created_at).toLocaleDateString()}</span>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(`/chat/${legalCase.case_id}`)}
          className="w-full border-black/10 hover:bg-black hover:text-white transition-colors group"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="font-medium">Enter Courtroom</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Button>
      </div>
    </Card>
  );
};

CaseCard.propTypes = {
  legalCase: PropTypes.shape({
    case_id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    case_status: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired
  }).isRequired
};

const Cases = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cases`);
        if (response.ok) {
          const allCases = await response.json();
          const userCases = allCases.filter(
            legalCase => legalCase.lawyer1_address === user.sub
          );
          setCases(userCases);
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user]);

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
