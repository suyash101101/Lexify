import { useState, useEffect, useCallback, useRef } from 'react';

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
  const recognitionRef = useRef(null);
  
  useEffect(() => {
    // Create recognition instance once
    recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    return () => {
      if (isListening) {
        recognitionRef.current?.stop();
      }
    };
  }, []);

  const startListening = useCallback((onResult) => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      onResult(transcript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    startListening,
    stopListening,
    isListening
  };
}
