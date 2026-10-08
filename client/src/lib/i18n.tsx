import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'ta';

const STRINGS = {
  tagline: { en: 'Report civic issues in Chennai', ta: 'சென்னையில் குடிமைப் பிரச்சினைகளைப் புகாரளிக்கவும்' },
  heroBody: {
    en: 'Potholes, garbage, water, streetlights — write, snap a photo or record a voice note in English, தமிழ், हिन्दी or Tanglish. AI routes it to the right department in seconds.',
    ta: 'பள்ளங்கள், குப்பை, தண்ணீர், தெருவிளக்கு — ஆங்கிலம், தமிழ், இந்தி அல்லது Tanglish-ல் எழுதுங்கள், புகைப்படம் அல்லது குரல் பதிவு அனுப்புங்கள். AI சரியான துறைக்கு உடனே அனுப்பும்.',
  },
  reportIssue: { en: 'Report an issue', ta: 'புகார் அளிக்க' },
  trackComplaint: { en: 'Track a complaint', ta: 'புகாரைக் கண்காணிக்க' },
  trackingCode: { en: 'Tracking code', ta: 'கண்காணிப்பு எண்' },
  track: { en: 'Track', ta: 'தேடு' },
  yourReports: { en: 'Your recent reports', ta: 'உங்கள் சமீபத்திய புகார்கள்' },
  howItWorks: { en: 'How it works', ta: 'எப்படி செயல்படுகிறது' },
  step1: { en: 'Describe it your way — text, photo or voice', ta: 'உங்கள் வழியில் சொல்லுங்கள் — எழுத்து, படம் அல்லது குரல்' },
  step2: { en: 'AI picks the department, priority and deadline', ta: 'AI துறை, முன்னுரிமை, காலக்கெடுவைத் தீர்மானிக்கும்' },
  step3: { en: 'Same problem reported by others? We merge them so it gets fixed faster', ta: 'மற்றவர்களும் புகார் அளித்திருந்தால் ஒன்றாக இணைத்து விரைவாக சரிசெய்வோம்' },
  statsComplaints: { en: 'complaints received', ta: 'புகார்கள் பெறப்பட்டன' },
  statsResolved: { en: 'issues resolved', ta: 'பிரச்சினைகள் தீர்க்கப்பட்டன' },
  statsMerged: { en: 'duplicates merged', ta: 'நகல்கள் இணைக்கப்பட்டன' },
  newComplaint: { en: 'New complaint', ta: 'புதிய புகார்' },
  describe: { en: 'What is the problem?', ta: 'பிரச்சினை என்ன?' },
  describePlaceholder: {
    en: 'e.g. Big pothole near the bus stop on 2nd Avenue, bikes are falling…  (Tamil / Hindi / Tanglish OK)',
    ta: 'உ.தா. 2வது அவென்யூ பஸ் நிறுத்தம் அருகே பெரிய பள்ளம்… (ஆங்கிலம் / Tanglish பரவாயில்லை)',
  },
  addPhoto: { en: 'Add photo', ta: 'படம் சேர்' },
  changePhoto: { en: 'Change photo', ta: 'படம் மாற்று' },
  recordVoice: { en: 'Record voice', ta: 'குரல் பதிவு' },
  stopRecording: { en: 'Stop', ta: 'நிறுத்து' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  location: { en: 'Location', ta: 'இடம்' },
  locationHelp: { en: 'Tap the map or drag the pin to the exact spot', ta: 'சரியான இடத்திற்கு வரைபடத்தைத் தட்டவும் அல்லது பின்னை இழுக்கவும்' },
  useMyLocation: { en: 'Use my location', ta: 'என் இருப்பிடம்' },
  locating: { en: 'Locating…', ta: 'கண்டறிகிறது…' },
  yourName: { en: 'Your name (optional)', ta: 'உங்கள் பெயர் (விருப்பம்)' },
  phone: { en: 'Phone (optional, for updates)', ta: 'தொலைபேசி (விருப்பம்)' },
  submit: { en: 'Submit complaint', ta: 'புகாரைச் சமர்ப்பி' },
  analysing: { en: 'AI is reading your complaint…', ta: 'AI உங்கள் புகாரைப் படிக்கிறது…' },
  analysingSteps: {
    en: 'Detecting language · Translating · Choosing department · Checking for duplicates',
    ta: 'மொழி கண்டறிதல் · மொழிபெயர்ப்பு · துறை தேர்வு · நகல் சரிபார்ப்பு',
  },
  needInput: { en: 'Please describe the problem, or add a photo or voice note.', ta: 'பிரச்சினையை விவரிக்கவும், அல்லது படம் / குரல் சேர்க்கவும்.' },
  submitted: { en: 'Complaint registered', ta: 'புகார் பதிவு செய்யப்பட்டது' },
  saveCode: { en: 'Save this code to track your complaint', ta: 'இந்த எண்ணைச் சேமித்துக் கொள்ளுங்கள்' },
  copy: { en: 'Copy', ta: 'நகலெடு' },
  copied: { en: 'Copied', ta: 'நகலெடுக்கப்பட்டது' },
  routedTo: { en: 'Routed to', ta: 'அனுப்பப்பட்ட துறை' },
  priority: { en: 'Priority', ta: 'முன்னுரிமை' },
  expectedIn: { en: 'Target resolution', ta: 'தீர்வு இலக்கு' },
  category: { en: 'Category', ta: 'வகை' },
  aiSummary: { en: 'AI summary', ta: 'AI சுருக்கம்' },
  detectedLanguage: { en: 'Detected language', ta: 'கண்டறியப்பட்ட மொழி' },
  mergedNotice: {
    en: 'Others reported this too — your report was added to an existing issue.',
    ta: 'மற்றவர்களும் இதைப் புகாரளித்துள்ளனர் — உங்கள் புகார் ஏற்கனவே உள்ள பிரச்சினையுடன் இணைக்கப்பட்டது.',
  },
  reports: { en: 'reports', ta: 'புகார்கள்' },
  viewStatus: { en: 'View status', ta: 'நிலையைக் காண்க' },
  reportAnother: { en: 'Report another', ta: 'இன்னொன்று' },
  spamNotice: {
    en: 'This doesn’t look like a civic complaint, so it was not sent to a department. If this is a mistake, please describe the problem in more detail.',
    ta: 'இது குடிமைப் புகாராகத் தெரியவில்லை. தவறு என்றால், விரிவாக விவரிக்கவும்.',
  },
  status: { en: 'Status', ta: 'நிலை' },
  progress: { en: 'Progress', ta: 'முன்னேற்றம்' },
  notFound: { en: 'No complaint found with that code.', ta: 'அந்த எண்ணில் புகார் இல்லை.' },
  yourComplaint: { en: 'Your complaint', ta: 'உங்கள் புகார்' },
  translation: { en: 'English translation', ta: 'ஆங்கில மொழிபெயர்ப்பு' },
  retry: { en: 'Try again', ta: 'மீண்டும் முயற்சி' },
  staffLogin: { en: 'Staff login', ta: 'ஊழியர் உள்நுழைவு' },
  back: { en: 'Back', ta: 'பின்' },
} as const;

export type StringKey = keyof typeof STRINGS;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: StringKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  try {
    return localStorage.getItem('cp_lang') === 'ta' ? 'ta' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('cp_lang', l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
  }, []);
  const t = useCallback((k: StringKey) => STRINGS[k][lang], [lang]);
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n outside I18nProvider');
  return ctx;
}
