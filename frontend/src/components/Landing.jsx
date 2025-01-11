import React from 'react';
import PropTypes from 'prop-types';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Play, Scale, Gavel, ScrollText,
  Briefcase, Building2, ShieldCheck, BookOpenCheck
} from 'lucide-react';
import { Button } from './shared/Button';
import { Card } from './shared/Card';
import { Container } from './shared/Container';
import Navigation from './Navigation';
import hero from "../assets/hero.png"
import { WarpBackground } from './shared/WarpBackground';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <Card className="group flex flex-col items-start space-y-4 hover:scale-[1.02] transition-all duration-300">
    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center
                    group-hover:bg-emerald-100 transition-colors duration-200">
      <Icon className="w-6 h-6 text-emerald-900" />
    </div>
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
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
  <div className="sticky top-0 min-h-screen flex items-center justify-center">
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 sm:p-8 md:p-12">
          <div className="space-y-3">
            <div className="text-emerald-600 font-medium text-sm">{subtitle}</div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">{title}</h3>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl">{description}</p>
          </div>
        </div>

        <div className="relative bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6">
          <div className="rounded-xl overflow-hidden shadow-lg">
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

const FloatingIcon = ({ icon: Icon, className, style = 1 }) => {
  const styles = {
    1: "bg-gradient-to-br from-emerald-50 to-white text-emerald-900/80",
    2: "bg-gradient-to-br from-sky-50 to-white text-sky-900/80",
    3: "bg-gradient-to-br from-violet-50 to-white text-violet-900/80",
    4: "bg-gradient-to-br from-amber-50 to-white text-amber-900/80",
    5: "bg-gradient-to-br from-rose-50 to-white text-rose-900/80",
    6: "bg-gradient-to-br from-indigo-50 to-white text-indigo-900/80",
    7: "bg-gradient-to-br from-teal-50 to-white text-teal-900/80",
    8: "bg-gradient-to-br from-blue-50 to-white text-blue-900/80"
  };

  return (
    <div className={`absolute transform ${className}`}>
      <div className="relative w-12 h-12 md:w-16 md:h-16">
        {/* 3D Shadow Effect */}
        <div className={`absolute inset-0 ${styles[style]} rounded-xl transform translate-y-1 blur-sm opacity-30`} />
        {/* Main Icon Container */}
        <div className={`absolute inset-0 ${styles[style]} rounded-xl backdrop-blur-sm 
                        border border-white/40 shadow-lg`}>
          <div className="absolute inset-0 bg-white/40 rounded-xl" />
          <div className="relative h-full flex items-center justify-center">
            <Icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
};

FloatingIcon.propTypes = {
  icon: PropTypes.elementType.isRequired,
  className: PropTypes.string.isRequired,
  style: PropTypes.number
};

const Landing = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/cases');
    }
  }, [isAuthenticated, navigate]);

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
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[140vh] flex items-start">
        <div className="absolute inset-0 top-[50vh]">
          <img 
            src={hero}
            alt="AI Legal Background"
            className="md:w-full md:h-full w-96 h-96 object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/50 to-[#fcfcfd]" />
        </div>
        
        <Container className="relative z-20">
          <div className="max-w-3xl mx-auto text-center space-y-8 pt-20 sm:pt-32 md:pt-40">
            <div className="relative">
              {/* Desktop Icons - Only visible on large screens */}
              <FloatingIcon 
                icon={Scale} 
                className="hidden lg:block -left-52 top-8"
                style={1}
              />
              <FloatingIcon 
                icon={Briefcase} 
                className="hidden lg:block -left-36 top-32"
                style={2}
              />
              <FloatingIcon 
                icon={BookOpenCheck} 
                className="hidden lg:block -left-48 top-56"
                style={3}
              />
              <FloatingIcon 
                icon={Gavel} 
                className="hidden lg:block -left-32 top-80"
                style={7}
              />
              <FloatingIcon 
                icon={ScrollText} 
                className="hidden lg:block -left-44 top-[26rem]"
                style={8}
              />

              <FloatingIcon 
                icon={Building2} 
                className="hidden lg:block -right-52 top-8"
                style={4}
              />
              <FloatingIcon 
                icon={ShieldCheck} 
                className="hidden lg:block -right-36 top-32"
                style={5}
              />
              <FloatingIcon 
                icon={BookOpenCheck} 
                className="hidden lg:block -right-48 top-56"
                style={6}
              />
              <FloatingIcon 
                icon={Scale} 
                className="hidden lg:block -right-32 top-80"
                style={1}
              />
              <FloatingIcon 
                icon={Briefcase} 
                className="hidden lg:block -right-44 top-[26rem]"
                style={2}
              />

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-900 text-sm font-medium">
                <Play className="w-4 h-4" />
                <a href="https://app.supademo.com/demo/cm5ofonkx03fr9mg9wuhje5wt" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="hover:text-emerald-700">
                  Watch the demo
                </a>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mt-8">
                Unlock your
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-900"> legal </span>
                potential
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mt-8">
                Practice, learn, and excel with AI powered court simulations at your fingertips
              </p>

              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => loginWithRedirect()}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-emerald-900 hover:bg-emerald-800 text-white font-medium rounded-xl
                            transition-all duration-200 shadow-lg shadow-emerald-900/10"
                >
                  Get started free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Showcase Section */}
      <section className="relative bg-gray-50/50">
        <div className="absolute inset-0 pointer-events-none">
          <div className="sticky top-0 h-screen" />
        </div>
        
        <Container className="relative">
          <div className="text-center py-16 sm:py-20 lg:py-32">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Designed for modern legal practice
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and features to enhance your legal journey
            </p>
          </div>

          <div className="relative space-y-40 pb-20">
            {productCards.map((card, index) => (
              <ProductCard key={index} {...card} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-emerald-900">
        <WarpBackground 
          className="py-10 sm:py-20 md:py-24 lg:py-32" 
          beamsPerSide={6}
          beamSize={3}
          beamDuration={15}
          beamDelayMax={10}
          beamDelayMin={5}
          perspective={200}
          gridColor="rgba(52, 211, 153, 0.08)"
        >
       
            <div className="max-w-2xl md:max-w-5xl mx-auto text-center sm:px-6 lg:px-8">
              <h2 className=" text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
                Ready to transform your legal practice?
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-emerald-100 mb-6 sm:mb-8">
                Join the next generation of legal professionals using AI to enhance their practice.
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => loginWithRedirect()}
                className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-white/90 text-emerald-900 hover:bg-white 
                          font-medium rounded-xl transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/10"
              >
                Get Started
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
 
        </WarpBackground>
      </section>
    </div>
  );
};

export default Landing;
