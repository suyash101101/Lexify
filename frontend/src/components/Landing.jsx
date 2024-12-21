import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Shield, Users, LockIcon, Sparkles, ArrowRight, FileText, Brain, Gavel } from 'lucide-react';

// Add this new component for animated gradient background
const AnimatedGradient = () => (
  <motion.div 
    className="fixed inset-0 z-[1]"
    animate={{
      background: [
        'linear-gradient(to right top, #f0f9ff 0%, #ffffff 50%, #e0f2fe 100%)',
        'linear-gradient(to left top, #f0f9ff 0%, #ffffff 50%, #e0f2fe 100%)',
        'linear-gradient(to bottom, #f0f9ff 0%, #ffffff 50%, #e0f2fe 100%)',
      ]
    }}
    transition={{
      duration: 10,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "linear"
    }}
  >
    {/* Subtle overlay patterns */}
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,_#e0f2fe_0%,_transparent_50%)]" />
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_80%,_#bae6fd_0%,_transparent_50%)]" />
  </motion.div>
);

const AnimatedLetter = ({ letter, delay }) => (
  <motion.span
    initial={{ opacity: 0, y: -100, x: -50 }}
    animate={{ opacity: 1, y: 0, x: 0 }}
    transition={{ 
      duration: 1, 
      delay,
      type: "spring",
      stiffness: 120,
      damping: 8
    }}
    whileHover={{ 
      scale: 1.2,
      transition: { duration: 0.3 }
    }}
    className="inline-block relative"
  >
    {/* Main letter with gradient */}
    <span className="relative z-10 bg-gradient-to-br from-violet-400 via-sky-500 to-indigo-600 text-transparent bg-clip-text hover:from-sky-400 hover:via-blue-600 hover:to-violet-600 transition-all duration-300">
      {letter}
    </span>
    
    {/* Glow effect */}
    <motion.span
      className="absolute inset-0 bg-gradient-to-br from-violet-400/20 via-sky-500/20 to-indigo-600/20 blur-lg z-0"
      animate={{
        opacity: [0.5, 0.8, 0.5],
        scale: [0.9, 1.1, 0.9],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {letter}
    </motion.span>
  </motion.span>
);

const AnimatedTitle = ({ text, baseDelay = 0 }) => (
  <motion.div 
    className="relative py-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Background glow */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-sky-500/10 to-indigo-500/10 rounded-full blur-3xl"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />

    <h1 className="text-8xl font-bold tracking-tight relative flex justify-center items-center gap-1">
      {text.split('').map((letter, i) => (
        <AnimatedLetter 
          key={i} 
          letter={letter} 
          delay={baseDelay + i * 0.1}
        />
      ))}

      {/* Animated shine effect */}
      <motion.div
        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
        animate={{
          x: [-200, 500],
          opacity: [0, 0.4, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      />
    </h1>
  </motion.div>
);

const FloatingCard = ({ icon: Icon, title, description, delay }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ 
        scale: 1.05,
        rotate: isHovered ? [0, -1, 1, -1, 0] : 0,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-sky-100 transition-all duration-300"
    >
      <motion.div
        animate={{
          y: isHovered ? [-5, 5, -5] : 0,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="flex flex-col items-center text-center space-y-4"
      >
        <motion.div 
          className="p-3 bg-sky-50 rounded-full"
          animate={{
            rotate: isHovered ? 360 : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-8 h-8 text-sky-600" />
        </motion.div>
        
        <motion.h3 
          className="text-xl font-semibold text-gray-800"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {title}
        </motion.h3>
        
        <p className="text-gray-600">{description}</p>
      </motion.div>

      {/* Animated border gradient */}
      <motion.div
        className="absolute inset-0 rounded-xl z-[-1]"
        animate={{
          background: isHovered 
            ? [
                "linear-gradient(45deg, rgba(14,165,233,0.2) 0%, rgba(56,189,248,0.2) 100%)",
                "linear-gradient(225deg, rgba(14,165,233,0.2) 0%, rgba(56,189,248,0.2) 100%)"
              ]
            : "linear-gradient(45deg, rgba(14,165,233,0) 0%, rgba(56,189,248,0) 100%)",
        }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
    </motion.div>
  );
};

// Add this new component for the particle effect
const ParticleEffect = () => {
  const particles = Array.from({ length: 8 });
  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-sky-300 rounded-full"
          initial={{ 
            opacity: 0,
            x: "50%",
            y: "50%"
          }}
          animate={{ 
            opacity: [0, 1, 0],
            x: `${50 + (Math.random() - 0.5) * 100}%`,
            y: `${50 + (Math.random() - 0.5) * 100}%`,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

// Add this new component for the animated button
const AnimatedButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 20px 40px -15px rgba(14, 165, 233, 0.5)",
      }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="group relative mt-8 bg-gradient-to-r from-blue-500 via-sky-500 to-blue-500 text-white px-10 py-4 rounded-full font-medium flex items-center justify-center space-x-3 mx-auto overflow-hidden"
    >
      {/* Multiple ripple effects */}
      {isHovered && (
        <>
          <motion.div
            initial={{ scale: 0, opacity: 0.35 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-white rounded-full"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0.35 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute inset-0 bg-white rounded-full"
          />
        </>
      )}

      {/* Sparkles */}
      <motion.div className="absolute inset-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={isHovered ? {
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150],
              y: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150],
            } : {}}
            transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
      </motion.div>

      {/* Button content */}
      <motion.div
        className="relative z-10 flex items-center space-x-2"
        animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Sparkles className="w-5 h-5 opacity-75" />
        <motion.span 
          animate={isHovered ? { y: [-1, 1, -1] } : { y: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Begin Your Journey
        </motion.span>
        <motion.div
          animate={isHovered ? { 
            x: [0, 5, 0],
            rotate: [0, 15, 0]
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <ArrowRight className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Gradient border */}
      <motion.div
        className="absolute inset-0 rounded-full z-0"
        animate={isHovered ? {
          background: [
            "linear-gradient(45deg, rgba(59,130,246,0.5) 0%, rgba(14,165,233,0.5) 100%)",
            "linear-gradient(225deg, rgba(59,130,246,0.5) 0%, rgba(14,165,233,0.5) 100%)",
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.button>
  );
};

// Add these background decoration components
const BackgroundDecorations = () => (
  <>
    <motion.div
      className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-sky-200/20 to-blue-200/20 rounded-full mix-blend-screen filter blur-3xl"
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 90, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-sky-100/30 to-blue-100/30 rounded-full mix-blend-screen filter blur-3xl"
      animate={{
        scale: [1.2, 1, 1.2],
        rotate: [0, -90, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  </>
);

const TimelineStep = ({ icon: Icon, title, description, index, isLast }) => {
  const isLeft = index % 2 === 0;
  const [isInView, setIsInView] = React.useState(false);

  return (
    <motion.div 
      className="flex gap-4 md:gap-12 relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ 
        opacity: 1,
        y: 0,
        transition: { 
          duration: 0.6,
          type: "spring",
          stiffness: 100,
          damping: 15
        }
      }}
      viewport={{ once: true, margin: "-50px" }}
      onViewportEnter={() => setIsInView(true)}
    >
      {/* Enhanced connecting line */}
      {!isLast && (
        <motion.div 
          className="absolute top-16 left-6 md:left-1/2 w-1.5 bg-gradient-to-b from-sky-400 via-blue-500 to-transparent"
          initial={{ height: 0 }}
          animate={isInView ? { height: "calc(100% + 4rem)" } : { height: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      )}

      <div className={`flex flex-col md:flex-row items-center gap-8 w-full ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
        {/* Simplified icon animation */}
        <motion.div 
          className="relative z-10 w-16 h-16"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg">
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          {/* Subtle pulse effect */}
          {isInView && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-sky-400"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                scale: [1, 1.2],
                opacity: [0.3, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </motion.div>

        {/* Enhanced content card */}
        <motion.div
          className="flex-1 relative"
          initial={{ x: isLeft ? -30 : 30, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl border border-sky-100 shadow-lg">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="relative z-10"
            >
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Landing = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/cases');
    }
  }, [isAuthenticated, navigate]);

  const timelineSteps = [
    {
      icon: FileText,
      title: "Case Creation",
      description: 
        "Easily create and manage your legal cases with our intuitive interface. " +
        "Add details, documents, and relevant information."
    },
    {
      icon: Scale,
      title: "Evidence Verification",
      description: 
        "Advanced blockchain technology ensures tamper-proof evidence management " +
        "and verification throughout the case lifecycle."
    },
    {
      icon: Brain,
      title: "AI Opposing Lawyer",
      description: 
        "Test your arguments against our AI-powered opposing counsel simulation " +
        "for better case preparation."
    },
    {
      icon: Gavel,
      title: "AI Judge Verdict & Score",
      description: 
        "Receive detailed analysis and scoring of your case from our AI judge, " +
        "helping you identify strengths and weaknesses."
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedGradient />
      <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-white/20" />
      
      <div className="relative z-[3] max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="mb-6 overflow-hidden">
            <AnimatedTitle text="Lexify" baseDelay={0.2} />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8,
              delay: 1.2,
              type: "spring",
              stiffness: 100
            }}
            className="space-y-4"
          >
            <p className="text-2xl text-sky-700 max-w-2xl mx-auto">
              Where Legal Excellence Meets Digital Innovation
            </p>
            <p className="text-lg text-sky-600/80 max-w-2xl mx-auto">
              Transform your legal practice with AI-powered case management
            </p>
          </motion.div>

          <AnimatedButton onClick={() => loginWithRedirect()} />
        </motion.div>

        <div className="mt-32">
          <motion.h2 
            className="text-5xl font-bold text-center mb-32"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-transparent bg-clip-text">
              Flow of Our Product
            </span>
          </motion.h2>
          <div className="space-y-48 px-4 md:px-12">
            {timelineSteps.map((step, index) => (
              <TimelineStep
                key={index}
                icon={step.icon}
                title={step.title}
                description={step.description}
                index={index}
                isLast={index === timelineSteps.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

