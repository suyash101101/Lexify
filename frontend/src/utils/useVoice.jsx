import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export function useVoice(language = 'en') {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audio, setAudio] = useState(null);

  const stopSpeaking = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsSpeaking(false);
  }, [audio]);

  const speak = useCallback(async (text, options = {}) => {
    stopSpeaking();
    
    if (!text) return;

    try {
      // Use ElevenLabs' free tier voice
      const response = await axios.post(
        'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', // Free tier voice
        {
          text,
          model_id: "eleven_multilingual_v1", // Free tier model
          language_code: language
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
      
      newAudio.onended = () => {
        setIsSpeaking(false);
        options.onEnd?.();
      };

      newAudio.onpause = () => {
        setIsSpeaking(false);
        options.onEnd?.();
      };

      setAudio(newAudio);
      await newAudio.play();
      setIsSpeaking(true);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      options.onEnd?.();
    }
  }, [language, stopSpeaking]);

  return {
    speak,
    stopSpeaking,
    isSpeaking
  };
}

export function useSpeechRecognition(language = 'en') {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback((onResult) => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast.error('Speech recognition failed');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsListening(false);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    startListening,
    stopListening,
    isListening
  };
}
