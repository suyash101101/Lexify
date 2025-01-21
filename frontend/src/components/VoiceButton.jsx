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
    } else {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [audio]);

  const useBrowserSpeech = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    // Adjust speech parameters based on language
    if (language.startsWith('hi') || 
        language.startsWith('bn') || 
        language.startsWith('te') || 
        language.startsWith('ta') || 
        language.startsWith('mr') || 
        language.startsWith('gu') || 
        language.startsWith('kn') || 
        language.startsWith('ml') || 
        language.startsWith('pa')) {
      // Use slower rate for Indian languages
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }
    
    utterance.volume = 1.0;

    // Try to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(voice => 
      voice.lang.startsWith(language) || 
      voice.lang.startsWith(language.split('-')[0])
    );
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Browser speech synthesis error:', event);
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [text, language]);

  const speak = useCallback(async () => {
    if (!text) return;
    setIsLoading(true);

    try {
      // Check if ElevenLabs API key exists
      if (!import.meta.env.VITE_ELEVEN_LABS_API_KEY) {
        throw new Error('No API key');
      }

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
          responseType: 'blob',
          timeout: 10000 // 10 second timeout
        }
      );

      if (!response.data || response.data.size === 0) {
        throw new Error('Invalid response from ElevenLabs');
      }

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl); // Clean up the URL
      };
      newAudio.onpause = () => setIsSpeaking(false);
      newAudio.playbackRate = 1.0; // Normal playback speed

      setAudio(newAudio);
      await newAudio.play();
      setIsSpeaking(true);
    } catch (error) {
      console.error('ElevenLabs error:', error);
      useBrowserSpeech(); // Fallback to browser speech
    } finally {
      setIsLoading(false);
    }
  }, [text, useBrowserSpeech]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak();
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
      window.speechSynthesis.cancel();
    };
  }, [audio]);

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
