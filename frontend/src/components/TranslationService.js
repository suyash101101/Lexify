import axios from 'axios';
import toast from 'react-hot-toast';

const MAX_RETRIES = 2;
const DELAY_BETWEEN_RETRIES = 1000;

export const translateText = async (text, targetLang) => {
  if (!text) return '';
  if (targetLang === 'en') return text;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Using Google Cloud Translation API Basic (free tier)
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
        {
          q: text,
          target: targetLang,
          source: 'en',
          model: 'base' // Using base model which is free
        }
      );

      if (response.data?.data?.translations?.[0]?.translatedText) {
        return response.data.data.translations[0].translatedText;
      }
      
      throw new Error('Invalid translation response');
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error('Translation error:', error);
        // Show a gentle toast only on final retry
        toast.error('Translation service temporarily unavailable', {
          duration: 2000,
          position: 'bottom-center',
        });
        return text; // Fallback to original text
      }
      
      // Wait before retrying
      await sleep(DELAY_BETWEEN_RETRIES);
    }
  }

  return text; // Final fallback
}; 