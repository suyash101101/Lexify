import { motion } from 'framer-motion';
import { Sparkles, Check, Scale, Building2, Globe2, Users } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

const INR_TO_USD = 0.012; // This is an example rate, adjust as needed

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const roundToNearestPricePoint = (price) => {
  const decimal = price - Math.floor(price);
  if (decimal < 0.49) {
    return Math.floor(price) - 0.01;
  }
};

const PricingTier = ({ name, price, credits, description, features, popular, isCustom, onPurchase, isProcessing, originalPrice, icon: Icon, freeMonths, isYearly }) => (
  <div className={`${popular ? 'border-2 border-black scale-105' : 'border border-black/10'} rounded-2xl p-8 bg-white relative hover:shadow-xl transition-all duration-300`}>
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-medium">
        Most Popular
      </div>
    )}
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-display font-bold text-black">{name}</h3>
      <Icon className="w-6 h-6 text-black" />
    </div>
    <p className="text-black/60 mb-4">{description}</p>
    <div className="mb-4 flex items-baseline gap-2">
      <span className="text-3xl font-bold text-black">
        {isYearly
          ? (typeof price === 'object'
              ? (price.yearly === 0 ? 'Free' : price.yearly === 'Custom' ? 'Custom' : `$${price.yearly}`)
              : price)
          : (typeof price === 'object'
              ? (price.monthly === 0 ? 'Free' : price.monthly === 'Custom' ? 'Custom' : `$${price.monthly}`)
              : price)
        }
      </span>
      {price !== 'Custom' && <span className="text-lg text-black/60">/mo</span>}
    </div>
    {freeMonths > 0 && (
      <div className="mb-4">
        <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
          {freeMonths} {freeMonths === 1 ? 'month' : 'months'} free
        </span>
      </div>
    )}
    {originalPrice && (
      <div className="mb-4">
        <span className="text-sm line-through text-black/40 mr-2">${originalPrice}</span>
        <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">Save 30%</span>
      </div>
    )}
    <div className="mb-4">
      <span className="text-xl font-semibold text-green-800">{credits} Credits</span>
    </div>
    <ul className="space-y-3 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-black/80">
          <Check className="w-5 h-5 text-black" />
          {feature}
        </li>
      ))}
    </ul>
    <button 
      onClick={() => onPurchase(price.monthly, credits, name)}
      disabled={isProcessing || (typeof price === 'object' && price.monthly === 0)}
      className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
        isCustom ? 'bg-black text-white hover:bg-black/90' :
        popular ? 'bg-black text-white hover:bg-black/90 shadow-lg shadow-black/10' : 'bg-black/5 text-black hover:bg-black/10'
      } ${isProcessing || (typeof price === 'object' && price.monthly === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isProcessing ? 'Processing...' : isCustom ? 'Contact Sales' : typeof price === 'object' && price.monthly === 0 ? 'Get Started' : 'Get Started'}
    </button>
  </div>
);

PricingTier.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.shape({
      monthly: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      yearly: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ]).isRequired,
  credits: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  features: PropTypes.arrayOf(PropTypes.string).isRequired,
  popular: PropTypes.bool,
  isCustom: PropTypes.bool,
  onPurchase: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool,
  originalPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  icon: PropTypes.elementType.isRequired,
  freeMonths: PropTypes.number,
  isYearly: PropTypes.bool.isRequired,
};

const Pricing = () => {
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const [isYearly, setIsYearly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const PLANS = [
    {
      name: 'Free',
      description: 'Perfect for trying out Lexify',
      price: { monthly: 0, yearly: 0 },
      priceINR: { monthly: 0, yearly: 0 },
      credits: '1,000',
      features: [
        'Case creation (1 per month)',
        'Basic legal consulting',
        'Document analysis',
        'English language support',
        'Single user account',
        'Community support',
        'Basic AI responses',
        'Standard response time',
        'Basic case templates'
      ],
      icon: Scale,
      mostPopular: false,
      freeMonths: 0
    },
    {
      name: 'Basic',
      description: 'Great for individual practitioners',
      price: { 
        monthly: roundToNearestPricePoint(Math.round(399 * INR_TO_USD)), 
        yearly: roundToNearestPricePoint(Math.round(3600 * INR_TO_USD / 12))
      },
      priceINR: { monthly: 399, yearly: 3600 },
      credits: '10,000',
      features: [
        'Case creation (10 per month)',
        'Advanced legal consulting',
        'Enhanced document analysis',
        'English & Hindi support',
        'Single user account',
        'Email support',
        'Priority AI responses',
        'Faster response time',
        'Custom case templates'
      ],
      freeMonths: 1,
      icon: Sparkles,
      mostPopular: false
    },
    {
      name: 'Growth',
      description: 'Perfect for growing practices',
      price: { 
        monthly: roundToNearestPricePoint(Math.round(899 * INR_TO_USD)), 
        yearly: roundToNearestPricePoint(Math.round(7999 * INR_TO_USD / 12))
      },
      priceINR: { monthly: 899, yearly: 7999 },
      credits: '25,000',
      features: [
        'Case creation (25 per month)',
        'Premium legal consulting',
        'Advanced document analysis',
        'Multi-language support (5)',
        'Collaborative workspace',
        'Priority email & chat support',
        'Voice call consultations',
        'Advanced case analytics',
        'Premium case templates',
        'Basic API access'
      ],
      freeMonths: 1,
      icon: Globe2,
      mostPopular: false
    },
    {
      name: 'Plus',
      description: 'Most popular for legal professionals',
      price: { 
        monthly: roundToNearestPricePoint(Math.round(1699 * INR_TO_USD)), 
        yearly: roundToNearestPricePoint(Math.round(14999 * INR_TO_USD / 12))
      },
      priceINR: { monthly: 1699, yearly: 14999 },
      credits: '50,000',
      features: [
        'Unlimited case creation',
        'AI-powered legal research',
        'Advanced document OCR',
        '36 languages support',
        'Dual account access',
        'Premium voice AI',
        'Custom lawyer agents',
        '24/7 priority support',
        'Advanced analytics dashboard',
        'Dedicated success manager',
        'Full API access',
        'White-label options'
      ],
      freeMonths: 3,
      icon: Users,
      mostPopular: true
    },
    {
      name: 'Pro',
      description: 'For established practices',
      price: { 
        monthly: roundToNearestPricePoint(Math.round(3499 * INR_TO_USD)), 
        yearly: roundToNearestPricePoint(Math.round(30999 * INR_TO_USD / 12))
      },
      priceINR: { monthly: 3499, yearly: 30999 },
      credits: '100,000',
      features: [
        'Everything in Plus, plus:',
        '4 account access',
        'Credits rollback',
        'Custom AI training',
        'Enterprise support',
        'Custom integrations',
        'Advanced API access',
        'Custom features',
        'Volume discounts',
        'On-premise deployment'
      ],
      freeMonths: 3,
      icon: Building2,
      mostPopular: false
    },
    {
      name: 'Enterprise',
      description: 'Custom enterprise solution',
      price: { monthly: 'Custom', yearly: 'Custom' },
      priceINR: { monthly: null, yearly: null },
      credits: 'Custom',
      features: [
        'Everything in Pro, plus:',
        'Unlimited accounts',
        'Custom credit allocation',
        'Custom AI models',
        'Dedicated support team',
        'SLA guarantees',
        'Custom features',
        'Volume discounts',
        'On-premise options',
        'Custom contracts'
      ],
      icon: Building2,
      isCustom: true,
      freeMonths: 0
    }
  ];

  const handlePurchase = async (amount, credits, packageName) => {
    console.log('Purchase:', amount, typeof(credits), packageName);
    if (!isAuthenticated) {
      toast.error('Please login to purchase credits');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Please try again later.');
        return;
      }
      console.log('Razorpay SDK loaded successfully');

      const selectedPlan = PLANS.find(plan => plan.name === packageName);
      const amountINR = isYearly ? selectedPlan.priceINR.yearly : selectedPlan.priceINR.monthly;
      console.log('Selected plan:', selectedPlan, 'Amount:', amountINR);
      if (amountINR === 0 || amountINR === null) {
        if (packageName === 'Free') {
          toast.success('You have selected the Free plan. No payment required.');
        } else if (packageName === 'Enterprise') {
          toast.info('Please contact our sales team for Enterprise pricing.');
        }
        setIsProcessing(false);
        return;
      }
      console.log('Amount in INR:', typeof(amountINR));


      console.log('Package:', typeof(packageName));
      console.log('User:', typeof(user.sub));

      console.log('Credits:', typeof(credits));
      
      const orderData = await fetch(`${import.meta.env.VITE_API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountINR,
          credits: parseInt(credits.replace(/,/g, '')),
          package_name: packageName,
          user_id: user.sub
        }),
      }).then(t => t.json());
      console.log('Order data:', orderData);
      if (!orderData.order_id) {
        toast.error('Could not create order. Please try again.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountINR * 100, // Convert to paise
        currency: "INR",
        name: "Lexify",
        description: `${packageName} - ${credits} Credits`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
                user_id: user.sub
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              toast.success('Payment successful! Credits added to your account.');
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled. Please try again if you wish to purchase credits.');
            setIsProcessing(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Error during purchase:', error);
      toast.error('Failed to process purchase. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  const CreditCostsTable = ({ costs }) => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Cost</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {costs.map(({ feature, cost }) => (
          <tr key={feature}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feature}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cost}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const CREDIT_COSTS = [
    { feature: "Consulting Call", cost: 250 },
    { feature: "Case Creation", cost: 200 },
    { feature: "Multilingual (Others)", cost: 150 },
    { feature: "Multilingual (Hindi)", cost: 100 },
    { feature: "Chat Consulting", cost: 80 },
    { feature: "Case Response", cost: 50 },
    { feature: "Courtroom Session", cost: 35 },
  ];

  return (
    <div className="min-h-screen bg-white px-4 py-16 mt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-black mb-4">
            Pricing Plans
          </h1>
          <p className="text-black/60 text-lg max-w-2xl mx-auto">
            Get started today with special introductory pricing. Save up to 30% with yearly plans!
          </p>
          {!isAuthenticated && (
            <p className="mt-4 text-green-800">
              Please <button onClick={() => loginWithRedirect()} className="underline">login</button> to get started
            </p>
          )}
          <div className="mt-8 inline-flex items-center p-1 bg-black/5 rounded-xl">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !isYearly ? 'bg-white text-black shadow-sm' : 'text-black/60'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isYearly ? 'bg-white text-black shadow-sm' : 'text-black/60'
              }`}
            >
              Yearly (Save up to 30%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {PLANS.map((plan) => (
            <PricingTier 
              key={plan.name} 
              {...plan} 
              price={isYearly ? {
                monthly: plan.price.yearly,
                yearly: plan.price.yearly
              } : plan.price}
              originalPrice={isYearly ? roundToNearestPricePoint(plan.price.monthly * 12) : null}
              onPurchase={handlePurchase}
              isProcessing={isProcessing}
              popular={plan.name === 'Plus'}
              isYearly={isYearly}
            />
          ))}
        </div>

        {/* Credit Costs Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-8 text-center">Credit Costs for Features</h2>
          <div className="max-w-2xl mx-auto">
            <CreditCostsTable costs={CREDIT_COSTS} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Pricing;


