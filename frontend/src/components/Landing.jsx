import React from 'react';
import PropTypes from 'prop-types';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Scale, Gavel, Brain, MessageCircle, ArrowRight } from 'lucide-react';
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
      description: "Practice in realistic court simulations with AI-powered opposing counsel and judges."
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Receive instant, detailed feedback on your arguments and presentation style."
    },
    {
      icon: MessageCircle,
      title: "Expert Consultation",
      description: "Connect with our AI legal experts for in-depth case analysis and strategy planning."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen">
        {/* Hero Background */}
        <div className="absolute inset-x-0 bottom-0 w-full h-[60vh] lg:h-[80vh] mt-[80px] lg:mt-[140px]">
          {/* Container for image and gradients */}
          <div className="relative h-full max-w-[100%] mx-auto">
            {/* Top Gradient Blend */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F5F5F5] via-[#F5F5F5] to-transparent z-10" />
            
            {/* Bottom Gradient Blend */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#F5F5F5] to-transparent z-10" />
            
            {/* Hero Image */}
            <img 
              src={hero} 
              alt="AI Legal Background" 
              className="mx-auto relative w-full h-full lg:h-auto object-cover lg:object-contain"
            />
          </div>
        </div>
        
        {/* Content */}
        <Container className="relative z-20">
          <div className="max-w-3xl mx-auto text-center pt-20 lg:pt-32 px-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-main 
                         mb-4 lg:mb-6 leading-tight">
              Advance Your Practice with AI
            </h1>
            
            <p className="text-lg lg:text-xl text-primary-main/60 mb-8 lg:mb-10 leading-relaxed max-w-2xl mx-auto">
              Transform your legal expertise through AI-powered courtroom simulations 
              and professional development tools.
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={() => loginWithRedirect()}
              className="inline-flex items-center gap-2 text-sm sm:text-base py-2.5 px-5 sm:py-3 sm:px-6 w-auto justify-center
                        hover:opacity-90 transition-opacity"
            >
              Start Your Practice
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-32 relative bg-accent-white">
        <Container>
          <div className="text-center mb-12 lg:mb-16 px-4">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-main mb-4">
              Empowering Legal Excellence
            </h2>
            <p className="text-lg lg:text-xl text-primary-main/60 max-w-2xl mx-auto">
              Discover how our AI-powered platform transforms traditional legal practice
              into an innovative, efficient experience.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 px-4">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-32 bg-primary-main relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5" />
        
        <Container className="relative">
          <div className="text-center max-w-2xl mx-auto px-4">
            <h2 className="text-3xl lg:text-5xl font-display font-bold text-accent-white mb-4 lg:mb-6">
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
                className="text-sm sm:text-base py-2.5 px-5 sm:py-3 sm:px-6 w-auto hover:opacity-90 transition-opacity"
              >
                Get Started Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/consultancy')}
                className="text-sm sm:text-base py-2.5 px-5 sm:py-3 sm:px-6 w-auto !text-accent-white !border-accent-white 
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

