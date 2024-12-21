import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVoice } from '../utils/useVoice';

const VoiceButton = ({ text }) => {
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopSpeaking();
    };
  }, []);

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text, {
        onEnd: () => {
          if (mountedRef.current) {
            stopSpeaking();
          }
        }
      });
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
    >
      {isSpeaking ? (
        <VolumeX className="w-5 h-5 text-red-500" />
      ) : (
        <Volume2 className="w-5 h-5 text-blue-500" />
      )}
    </motion.button>
  );
};

export default React.memo(VoiceButton);
