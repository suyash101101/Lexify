import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import PropTypes from 'prop-types';
import { CREDIT_COSTS } from '../constants/credits';

const CreditContext = createContext();

export function CreditProvider({ children }) {
  const { user } = useAuth0();
  const [credits, setCredits] = useState(null);

  // Fetch initial credits
  useEffect(() => {
    if (user?.sub) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/credits/${user.sub}`);
      const data = await response.json();
      setCredits(data.credits);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const deductCredits = async (service) => {
    const cost = CREDIT_COSTS[service];
    if (!cost) throw new Error('Invalid service');

    // Check if user has enough credits
    if (credits < cost) {
      return { success: false, message: 'Insufficient credits' };
    }

    try {
      // Immediate deduction through API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/use-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.sub,
          service
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state only after successful API call
        setCredits(data.remaining_credits);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Failed to deduct credits' };
      }
    } catch (error) {
      console.error('Error deducting credits:', error);
      return { success: false, message: 'Failed to process credit deduction' };
    }
  };

  const value = {
    credits,
    deductCredits,
    CREDIT_COSTS
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
}

CreditProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
}; 