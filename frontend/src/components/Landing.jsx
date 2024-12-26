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
        {/* Noise Texture Overlay */}
        {/* <div className="absolute inset-0 opacity-[0.03] pointer-events-none" /> */}
        
        {/* Hero Background */}
        <div className="absolute inset-x-0 bottom-0 w-full h-[80vh] mt-[140px]">
          {/* Container for image and gradients */}
          <div className="relative h-full max-w-[100%] mx-auto">
            {/* Side Gradients */}
              {/* <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#d3d3d3] to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#d3d3d3] to-transparent z-10" /> */}
            
            {/* Top Gradient Blend */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F5F5F5] via-[#F5F5F5] to-transparent z-10" />
            
            {/* Bottom Gradient Blend */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#F5F5F5] to-transparent z-10" />
            
            {/* Hero Image */}
            <img 
              src={hero} 
              alt="AI Legal Background" 
              className="mx-auto relative w-full object-contain "
            />
          </div>
        </div>
        
        {/* Content */}
        <Container className="relative z-20">
          <div className="max-w-3xl mx-auto text-center pt-32">
            <h1 className="text-6xl sm:text-7xl font-display font-bold text-primary-main 
                         mb-6 leading-tight">
              Advance Your Practice with AI
            </h1>
            
            <p className="text-xl text-primary-main/60 mb-10 leading-relaxed max-w-2xl mx-auto">
              Transform your legal expertise through AI-powered courtroom simulations 
              and professional development tools.
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={() => loginWithRedirect()}
              className="inline-flex items-center gap-3"
            >
              Start Your Practice
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-32 relative bg-accent-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-primary-main mb-4">
              Empowering Legal Excellence
            </h2>
            <p className="text-xl text-primary-main/60 max-w-2xl mx-auto">
              Discover how our AI-powered platform transforms traditional legal practice
              into an innovative, efficient experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary-main relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5" />
        
        <Container className="relative">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-5xl font-display font-bold text-accent-white mb-6">
              Elevate Your Legal Workflow Today
            </h2>
            <p className="text-xl text-accent-white/80 mb-10">
              Join the next generation of legal professionals using AI to enhance their practice.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => loginWithRedirect()}
              >
                Get Started Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/consultancy')}
                className="!text-accent-white !border-accent-white hover:!bg-accent-white/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-accent-white border-t border-primary-main/5">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
            {/* Brand & Mission */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-main rounded-full flex items-center justify-center">
                  <Scale className="w-5 h-5 text-accent-white" />
                </div>
                <span className="text-2xl font-display font-bold text-primary-main">
                  Lexify
                </span>
              </div>
              <p className="text-primary-main/60 leading-relaxed">
                Empowering legal professionals with next-generation AI technology for enhanced practice and innovation.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-primary-main mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-primary-main/60 hover:text-primary-main transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-primary-main/60 hover:text-primary-main transition-colors">Pricing</a></li>
                <li><a href="#about" className="text-primary-main/60 hover:text-primary-main transition-colors">About Us</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-display font-semibold text-primary-main mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#blog" className="text-primary-main/60 hover:text-primary-main transition-colors">Blog</a></li>
                <li><a href="#help" className="text-primary-main/60 hover:text-primary-main transition-colors">Help Center</a></li>
                <li><a href="#contact" className="text-primary-main/60 hover:text-primary-main transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-display font-semibold text-primary-main mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#privacy" className="text-primary-main/60 hover:text-primary-main transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="text-primary-main/60 hover:text-primary-main transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-primary-main/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-primary-main/60">
                © {new Date().getFullYear()} Lexify. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="#twitter" className="text-primary-main/60 hover:text-primary-main transition-colors">Twitter</a>
                <a href="#linkedin" className="text-primary-main/60 hover:text-primary-main transition-colors">LinkedIn</a>
                <a href="#github" className="text-primary-main/60 hover:text-primary-main transition-colors">GitHub</a>
              </div>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Landing;

