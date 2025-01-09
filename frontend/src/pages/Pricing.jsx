import { motion } from 'framer-motion';
import { Coins, Check, Sparkles } from 'lucide-react';

const PricingTier = ({ name, price, description, features, popular }) => (
  <div className={`${popular ? 'border-2 border-black scale-105' : 'border border-black/10'} rounded-2xl p-8 bg-white relative`}>
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-medium">
        Most Popular
      </div>
    )}
    <h3 className="text-xl font-display font-bold mb-2">{name}</h3>
    <div className="mb-4">
      <span className="text-3xl font-bold">${price}</span>
      <span className="text-black/60">/month</span>
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
    <button className={`w-full py-3 rounded-xl font-medium transition-colors ${popular ? 'bg-black text-white hover:bg-black/90' : 'bg-black/5 text-black hover:bg-black/10'}`}>
      Get Started
    </button>
  </div>
);

const Pricing = () => {
  const pricingTiers = [
    {
      name: "Starter",
      price: "X",
      description: "Perfect for solo practitioners and small practices",
      features: [
        "AI Legal Consultant (Basic)",
        "Case Management Tools",
        "Simulated Courtroom Sessions (10/month)",
        "Email Support"
      ]
    },
    {
      name: "Professional",
      price: "X",
      description: "Ideal for growing law firms",
      features: [
        "AI Legal Consultant (Advanced)",
        "Advanced Case Management",
        "Simulated Courtroom Sessions (Unlimited)",
        "24/7 Priority Support",
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "X",
      description: "For large firms with complex needs",
      features: [
        "AI Legal Consultant (Enterprise)",
        "Full Practice Management Suite",
        "Advanced Analytics",
        "Dedicated Account Manager",
        "Custom API Access",
        "Training Sessions"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-accent-white px-4 py-16 mt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-black mb-4">Simple, Transparent Pricing</h1>
          <p className="text-black/60 text-lg max-w-2xl mx-auto">
            Choose the perfect plan for your practice. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <PricingTier key={tier.name} {...tier} />
          ))}
        </div>

        <div className="bg-black/5 rounded-3xl p-8 md:p-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-black" />
            <h2 className="text-2xl font-display font-bold">Enterprise Solutions</h2>
          </div>
          <p className="text-black/60 mb-8 max-w-2xl mx-auto">
            Need a custom solution? We offer tailored enterprise plans with custom features, 
            dedicated support, and flexible pricing based on your specific requirements.
          </p>
          <button onClick={() => window.open("mailto:lexifyai.in@gmail.com", "_blank")} className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-black/90 transition-colors">
            Contact Sales
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Pricing;