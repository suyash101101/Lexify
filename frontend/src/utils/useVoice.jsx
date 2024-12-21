import { useState, useEffect, useCallback } from 'react';

export function useVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      setVoices(synth.getVoices());
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      synth.cancel();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text, options = {}) => {
    stopSpeaking();
    
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.voice = options.voice || voices[0];

    utterance.onend = () => {
      setIsSpeaking(false);
      options.onEnd?.();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      options.onEnd?.();
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [voices, stopSpeaking]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    voices
  };
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, []);

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;

  const startListening = (onResult) => {
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      onResult(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognition.stop();
    setIsListening(false);
  };

  return {
    startListening,
    stopListening,
    isListening
  };
}
