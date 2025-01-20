import React, { useState, useCallback } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const VoiceButton = ({ text, language = 'en' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState(null);

  const stopSpeaking = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsSpeaking(false);
  }, [audio]);

  const speak = useCallback(async () => {
    if (!text) return;
    setIsLoading(true);

    try {
      const response = await axios.post(
        'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
        {
          text: text,
          model_id: "eleven_multilingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        },
        {
          headers: {
            'xi-api-key': import.meta.env.VITE_ELEVEN_LABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'blob'
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => setIsSpeaking(false);
      newAudio.onpause = () => setIsSpeaking(false);

      setAudio(newAudio);
      await newAudio.play();
      setIsSpeaking(true);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      toast.error('Failed to generate speech');
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak();
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      disabled={isLoading}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      ) : isSpeaking ? (
        <VolumeX className="w-5 h-5 text-red-500" />
      ) : (
        <Volume2 className="w-5 h-5 text-blue-500" />
      )}
    </motion.button>
  );
};

export default VoiceButton;
