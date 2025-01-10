import { motion } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

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

const PricingTier = ({ name, price, credits, description, features, popular, isCustom, onPurchase, isProcessing, originalPrice }) => (
  <div className={`${popular ? 'border-2 border-black scale-105' : 'border border-black/10'} rounded-2xl p-8 bg-white relative hover:shadow-xl transition-all duration-300`}>
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-medium">
        Most Popular
      </div>
    )}
    <h3 className="text-xl font-display font-bold mb-2 text-black">{name}</h3>
    <div className="mb-4 flex items-baseline gap-2">
      <span className="text-3xl font-bold text-black">₹{price}</span>
      {originalPrice && (
        <>
          <span className="text-lg line-through text-black/40">₹{originalPrice}</span>
          <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">Save 30%</span>
        </>
      )}
    </div>
    <div className="mb-4">
      <span className="text-xl font-semibold text-green-800">{credits} Credits</span>
    </div>
    <p className="text-black/60 mb-6">{description}</p>
    <ul className="space-y-3 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-black/80">
          <Check className="w-5 h-5 text-black" />
          {feature}
        </li>
      ))}
    </ul>
    <button 
      onClick={() => onPurchase(price, credits, name)}
      disabled={isProcessing}
      className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
        isCustom ? 'bg-black text-white hover:bg-black/90' :
        popular ? 'bg-black text-white hover:bg-black/90 shadow-lg shadow-black/10' : 'bg-black/5 text-black hover:bg-black/10'
      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isProcessing ? 'Get Started' : isCustom ? 'Contact Sales' : 'Get Started'}
    </button>
  </div>
);

PricingTier.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  credits: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  features: PropTypes.arrayOf(PropTypes.string).isRequired,
  popular: PropTypes.bool,
  isCustom: PropTypes.bool,
  onPurchase: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool,
  originalPrice: PropTypes.string
};

const Pricing = () => {
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const [isYearly, setIsYearly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pricingTiers = [
    {
      name: "Student",
      price: isYearly ? "4,950" : "499",
      originalPrice: isYearly ? "5,988" : "699",
      credits: isYearly ? "98,000" : "8,000",
      description: "Perfect for law students and interns",
      features: [
        `${isYearly ? "98,000" : "8,000"} total credits`,
        "Basic Research Tools",
        "Case Analysis",
        "Document Templates",
        isYearly ? "2 months free access" : "Student ID required",
      ]
    },
    {
      name: "Basic",
      price: isYearly ? "7,950" : "799",
      originalPrice: isYearly ? "9,588" : "999",
      credits: isYearly ? "140,000" : "10,000",
      description: "Ideal for individual practitioners",
      features: [
        `${isYearly ? "140,000" : "10,000"} total credits`,
        "Advanced Research Tools",
        "Priority Support",
        "Analytics Dashboard",
        isYearly ? "2 months free access" : "Credit rollover",
      ],
    },
    {
      name: "Expert",
      price: isYearly ? "30,000" : "3,499",
      originalPrice: isYearly ? "41,988" : "4,499",
      credits: isYearly ? "700,000" : "50,000",
      description: "Best for growing practices",
      features: [
        `${isYearly ? "700,000" : "50,000"} total credits`,
        "Complete Tool Access",
        "24/7 Premium Support",
        "Custom Integrations",
        isYearly ? "2 months free + bonuses" : "Unlimited rollover",
      ],
      popular: true
    },
    {
      name: "Law Firm",
      price: "Custom",
      credits: "Custom",
      description: "Enterprise-grade solution for law firms",
      features: [
        "Unlimited credits",
        "Dedicated Manager",
        "Custom API Access",
        "Team Training",
        "Enterprise Support"
      ],
      isCustom: true
    }
  ];

  const handlePurchase = async (amount, credits, packageName) => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase credits');
      return;
    }

    setIsProcessing(true);

    try {
      // Load Razorpay script
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Please try again later.');
        return;
      }

      // Create order
      const orderData = await fetch(`${import.meta.env.VITE_API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(amount.replace(/,/g, '')),
          credits: parseInt(credits.replace(/,/g, '')),
          package_name: packageName,
          user_id: user.sub
        }),
      }).then(t => t.json());

      if (!orderData.order_id) {
        toast.error('Could not create order. Please try again.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: parseInt(amount.replace(/,/g, '')) * 100, // Convert to paise
        currency: "INR",
        name: "Lexify",
        description: `${packageName} - ${parseInt(credits.replace(/,/g, ''))} Credits`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            // Verify payment
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
            Get started today with special introductory pricing. Save 30% with yearly plans!
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
              Yearly (Save 30%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <PricingTier 
              key={tier.name} 
              {...tier} 
              onPurchase={handlePurchase}
              isProcessing={isProcessing}
            />
          ))}
        </div>

        {/* <div className="bg-black/[0.02] rounded-3xl p-8 md:p-12 border border-black/5">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold mb-4 text-black">Try For Free</h2>
            <p className="text-black/60">
              Start with our free tier and upgrade as you grow
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="font-semibold mb-3 text-black">Legal Research</h3>
              <p className="text-black/60">5 free searches monthly</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="font-semibold mb-3 text-black">Document Analysis</h3>
              <p className="text-black/60">3 free documents</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="font-semibold mb-3 text-black">AI Assistant</h3>
              <p className="text-black/60">Basic features included</p>
            </div>
          </div>
        </div> */}
      </motion.div>
    </div>
  );
};

export default Pricing;