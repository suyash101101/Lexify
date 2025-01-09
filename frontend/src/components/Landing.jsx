import React from 'react';
import PropTypes from 'prop-types';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Gavel, Brain, MessageCircle, ArrowRight, Play } from 'lucide-react';
import { Button } from './shared/Button';
import { Card } from './shared/Card';
import { Container } from './shared/Container';
import Navigation from './Navigation';
import hero from "../assets/hero.png"

const FeatureCard = ({ icon: Icon, title, description }) => (
  <Card className="group flex flex-col items-start space-y-4 hover:border-primary-main/20">
    <div className="w-14 h-14 bg-primary-main/5 rounded-2xl flex items-center justify-center
                    group-hover:bg-primary-main/10 transition-colors duration-200">
      <Icon className="w-7 h-7 text-primary-main" />
    </div>
    <div>
      <h3 className="text-xl font-display font-semibold text-primary-main mb-2">
        {title}
      </h3>
      <p className="text-primary-main/60 leading-relaxed">
        {description}
      </p>
    </div>
  </Card>
);

FeatureCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

const ProductCard = ({ title, subtitle, description, imagePath }) => (
  <div className="sticky top-0 min-h-screen flex items-center justify-center bg-[#F5F5F5]">
    <div className="w-full max-w-[1100px] mx-auto">
      <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_-2px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="text-emerald-600/90 font-bold text-sm tracking-wide">{subtitle}</div>
            <h3 className="text-[32px] font-semibold text-[#1a1a1a] tracking-[-0.02em] leading-tight">{title}</h3>
          </div>
          <p className="text-[#666666] text-lg leading-relaxed max-w-[640px]">{description}</p>
        </div>

        {/* Image Section */}
        <div className="relative w-full bg-gradient-to-b from-gray-50 to-white p-6">
          <div className="relative rounded-lg overflow-hidden shadow-[0_2px_16px_-2px_rgba(0,0,0,0.1)] bg-white">
            <img 
              src={`/product_demo/${imagePath}`}
              alt={title}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

ProductCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  imagePath: PropTypes.string.isRequired,
};

const Landing = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/cases');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Gavel,
      title: "Virtual Court Experience",
      description: "Practice in realistic court simulations with AI powered opposing counsel and judges."
    },
    {
      icon: Brain,
      title: "AI Powered Analysis",
      description: "Receive instant, detailed feedback on your arguments and presentation style."
    },
    {
      icon: MessageCircle,
      title: "Expert Consultation",
      description: "Connect with our AI legal experts for in-depth case analysis and strategy planning."
    }
  ];

  const productCards = [
    {
      subtitle: "Dashboard",
      title: "Your Legal Command Center",
      description: "Access all your cases, analytics, and practice sessions in one intuitive interface. Track your progress and get insights into your performance.",
      imagePath: "Dashboard.png"
    },
    {
      subtitle: "Case Creation",
      title: "Build Your Perfect Practice Case",
      description: "Create customized court scenarios with our intelligent case builder. Set complexity levels and choose specific legal areas to focus on.",
      imagePath: "CaseCreation.png"
    },
    {
      subtitle: "Virtual Courtroom",
      title: "Immersive Court Experience",
      description: "Step into our AI powered courtroom where you can practice arguments, handle objections, and receive real time feedback on your performance.",
      imagePath: "Courtroom.png"
    },
    {
      subtitle: "AI Consultation",
      title: "Expert Legal Guidance",
      description: "Get instant insights and advice from our AI legal consultant. Perfect for case strategy, argument preparation, and legal research.",
      imagePath: "Consultation.png"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[110vh] flex items-start pt-32 lg:pt-40">
        {/* Hero Background */}
        <div className="absolute inset-x-0 bottom-0 w-full h-[70vh] lg:h-[80vh] translate-y-[20%]">
          {/* Container for image and gradients */}
          <div className="relative h-full max-w-[100%] mx-auto">
            {/* Top Gradient Blend */}
            <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#F5F5F5] via-[#F5F5F5] to-transparent z-10" />
            
            {/* Bottom Gradient Blend */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#F5F5F5] to-transparent z-10" />
            
            {/* Hero Image */}
            <img 
              src={hero} 
              alt="AI Legal Background" 
              className="mx-auto relative w-full h-full lg:h-auto object-cover lg:object-contain opacity-40"
            />
          </div>
        </div>
        
        {/* Content */}
        <Container className="relative z-20">
          <div className="max-w-3xl mx-auto text-center px-4 space-y-7">
            {/* Launch Video Button */}
            <a 
              href="https://app.supademo.com/demo/cm5ofonkx03fr9mg9wuhje5wt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 p-1 sm:p-1.5 rounded-full text-sm sm:text-base 
                        font-semibold text-gray-700 group transition-all duration-500 ease-out select-none
                        bg-gradient-to-r from-gray-200/80 via-emerald-50/50 to-gray-200/80
                        hover:from-gray-200 hover:via-emerald-50/70 hover:to-gray-200
                        hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
                        border border-gray-300/30"
            >
              <div className="relative flex justify-center items-center">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 absolute z-10 text-emerald-950/80 transition-colors fill-current" />
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-white via-emerald-50/50 to-gray-50/50 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.03)]"></div>
              </div>
              <span className="pr-1.5 sm:pr-3 group-hover:text-emerald-950/90 font-medium">
                See the demo video
              </span>
            </a>

            <h1 className="text-4xl md:text-5xl lg:text-[4.5rem] font-semibold text-primary-main/90 
                         tracking-tight leading-[1.15]">
              Unlock your <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 via-emerald-950 to-gray-900">legal</span>
              <span className="block mt-2">potential</span>
            </h1>
            
            <p className="text-balance text-lg sm:text-xl md:text-2xl font-light text-[#64646F] tracking-tight max-w-2xl mx-auto leading-[1.4]">
              Practice, learn, and excel with AI powered court simulations at your fingertips
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => loginWithRedirect()}
                className="inline-flex items-center gap-2.5 text-base py-2.5 px-6 w-auto justify-center
                          bg-gradient-to-r from-emerald-950 to-gray-900 hover:from-emerald-900 hover:to-gray-800
                          transition-all duration-300 font-light tracking-wide text-white/90"
              >
                Start practicing for free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Showcase Section */}
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="sticky top-0 h-screen bg-[#F5F5F5]" />
        </div>
        
        <Container className="relative">
          <div className="text-center pt-20 lg:pt-32 pb-12">
            <h2 className="text-3xl lg:text-6xl font-display font-bold text-primary-main mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 via-emerald-950 to-gray-900">
              Excel
            </h2>
            <p className="text-xl font-medium text-slate-600/50 text-wrap max-w-2xl mx-auto px-4">
              Comprehensive tools and features designed to enhance your legal practice journey
            </p>
          </div>

          {/* Scrolling Product Cards */}
          <div className="relative">
            {productCards.map((card, index) => (
              <ProductCard key={index} {...card} />
            ))}
          </div>
        </Container>
      </section>

      {/* Features Section */}
      {/* <section id="features" className="py-20 lg:py-32 relative bg-accent-white">
        <Container>
          <div className="text-center mb-16 lg:mb-20 px-4">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-main mb-4">
              Empowering Legal Excellence
            </h2>
            <p className="text-lg lg:text-xl text-primary-main/60 max-w-2xl mx-auto">
              Discover how our AI powered platform transforms traditional legal practice
              into an innovative, efficient experience.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 px-4">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </Container>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-primary-main relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5" />
        
        <Container className="relative">
          <div className="text-center max-w-2xl mx-auto px-4">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-accent-white mb-6 lg:mb-8">
              Elevate Your Legal Workflow Today
            </h2>
            <p className="text-lg lg:text-xl text-accent-white/80 mb-8 lg:mb-10">
              Join the next generation of legal professionals using AI to enhance their practice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => loginWithRedirect()}
                className="text-base sm:text-lg py-3 px-6 sm:py-4 sm:px-8 w-auto hover:opacity-90 transition-opacity"
              >
                Get Started Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/consultancy')}
                className="text-base sm:text-lg py-3 px-6 sm:py-4 sm:px-8 w-auto !text-accent-white !border-accent-white 
                          hover:!bg-accent-white/10 transition-opacity"
              >
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Landing;

