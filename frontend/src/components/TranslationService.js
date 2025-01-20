import axios from 'axios';

export const translateText = async (text, targetLanguage, sourceLanguage = 'en') => {
  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`,
      {
        q: text,
        target: targetLanguage,
        source: sourceLanguage
      }
    );
    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}; 