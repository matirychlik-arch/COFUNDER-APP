export type UserAge = '18-24' | '25-30' | '31-40' | '41+';
export type CompanyStage = 'idea' | 'mvp' | 'pre-seed' | 'seed' | 'series-a' | 'growth';
export type CommunicationStyle = 'casual' | 'structured';
export type UserGender = 'male' | 'female' | 'other' | 'prefer_not';
export type FounVoice = 'female' | 'male';

export const FOUN_VOICES = {
  female: { id: 'lcMyyd2HUfFzxdCaC4Ta', name: 'Zosia' },
  male:   { id: 'EOVAuWqgSZN2Oel78Psj', name: 'Adam' },
} as const;

export interface UserProfile {
  name: string;
  companyName: string;
  age: UserAge;
  stage: CompanyStage;
  industry: string;
  challenges: string[];
  goals: string;
  communicationStyle: CommunicationStyle;
  visionerMode: boolean;
  gender: UserGender;
  targetMarket: string;
  // AI keys
  deepseekApiKey: string;       // primary model (required)
  anthropicApiKey?: string;     // creative mode + Visioner (optional)
  openAiApiKey?: string;        // Whisper STT (optional, fallback to Web Speech API)
  elevenLabsApiKey?: string;    // ElevenLabs TTS (optional)
  // Voice
  founVoice: FounVoice;         // 'female' (Zosia) | 'male' (Adam)
  theme: 'light' | 'dark';
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Folder {
  slug: string;
  label: string;
  emoji: string;
  colorClass: string;
  textColorClass: string;
  isDefault: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isVoice?: boolean;
}

export interface SessionRecap {
  title: string;
  summary: string;
  keyDecisions: string[];
  actionItems: string[];
  tags: string[];
  generatedAt: string;
}

export interface Conversation {
  id: string;
  folderSlug: string;
  messages: Message[];
  recap: SessionRecap | null;
  status: 'active' | 'ended';
  visionerModeActive: boolean;
  startedAt: string;
  endedAt: string | null;
}

export interface AppStorage {
  version: number;
  userProfile: UserProfile | null;
  conversations: Record<string, Conversation>;
  customFolders: Folder[];
}
