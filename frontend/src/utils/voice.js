export const SPEECH_LANGUAGE_MAP = {
  'English': 'en-IN',
  'Hindi': 'hi-IN',
  'Telugu': 'te-IN',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Tamil': 'ta-IN',
  'Bengali': 'bn-IN',
  'Marathi': 'mr-IN',
  'Gujarati': 'gu-IN',
  'Kannada': 'kn-IN',
  'Malayalam': 'ml-IN',
  'Urdu': 'ur-IN',
  'Portuguese': 'pt-PT',
  'Japanese': 'ja-JP',
  'Korean': 'ko-KR',
  'Chinese': 'zh-CN'
};

export function getBestVoice(languageName) {
  const targetCode = SPEECH_LANGUAGE_MAP[languageName] || 'en-US';
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) return null;

  // 1. Exact locale match (e.g. hi-IN)
  let voice = voices.find(v => v.lang === targetCode || v.lang.replace('_', '-') === targetCode);
  if (voice) return voice;
  
  // 2. Base language match (e.g. hi)
  const baseLang = targetCode.split('-')[0];
  voice = voices.find(v => v.lang.startsWith(baseLang));
  if (voice) return voice;
  
  // 3. Return null if no matching voice is found, so the browser can try its default behavior
  return null;
}
