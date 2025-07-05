/**
 * TypeScript type definitions for the TSDNE application.
 * 
 * This file contains all type definitions, interfaces, and enums used throughout the frontend.
 */

// =============================================================================
// Core Application Types
// =============================================================================

export interface Message {
  id?: number;
  role: MessageRole;
  text: string;
  created_at?: string;
}

export enum MessageRole {
  PLAYER = 'player',
  AI = 'ai',
  DEV = 'Dev'
}

export interface Conversation {
  id: number;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages?: Message[];
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface ConversationResponse {
  conversation: Conversation;
  messages: Message[];
}

export interface GenerateRequest {
  input: string;
  conversation_id?: number;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  version?: string;
}

// =============================================================================
// UI Component Props Types
// =============================================================================

export interface Settings {
  fontSize: number;
  animationSpeed: number;
  theme: ThemeType;
}

export type ThemeType = 'dark' | 'light';

export interface TitleProps {
  theme: ThemeType;
}

export interface OutputBoxProps {
  story: Message[];
  error?: string | null;
  animationSpeed?: number;
  finalRender?: boolean;
  onFinalRenderComplete?: () => void;
  theme?: ThemeType;
}

export interface UserInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  theme?: ThemeType;
}

export interface SettingsPanelProps {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  closePanel: () => void;
}

export interface FooterProps {
  theme: ThemeType;
}

// =============================================================================
// Application State Types
// =============================================================================

export interface AppState {
  messages: Message[];
  input: string;
  loading: boolean;
  error: string | null;
  settings: Settings;
  showSettings: boolean;
  currentConversationId?: number;
}

export interface ConversationState {
  conversations: Conversation[];
  currentConversation?: Conversation;
  loading: boolean;
  error: string | null;
}

// =============================================================================
// Error Types
// =============================================================================

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

// =============================================================================
// Utility Types
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface StreamResponse {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  conversationId?: string;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface AppConfig {
  apiBaseUrl: string;
  streamSpeed: number;
  maxInputLength: number;
  defaultSettings: Settings;
}

// =============================================================================
// Event Handler Types
// =============================================================================

export type SubmitHandler = () => void | Promise<void>;
export type SettingsChangeHandler = (settings: Settings) => void;
export type MessageHandler = (message: Message) => void;
export type ErrorHandler = (error: string | Error) => void;

// =============================================================================
// Constants and Defaults
// =============================================================================

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 16,
  animationSpeed: 500,
  theme: 'dark'
};

export const API_ENDPOINTS = {
  GENERATE: '/generate',
  CONVERSATIONS: '/conversations',
  HEALTH: '/health'
} as const;

export const THEME_CLASSES = {
  dark: {
    bg: 'bg-gradient-to-b from-gray-900 to-gray-950 text-white',
    container: 'bg-gray-800 text-white border-gray-700',
    input: 'bg-gray-800 text-white border-gray-600 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500',
    button: 'bg-gray-600 hover:bg-gray-500 text-white',
    scrollButton: 'bg-gray-700 hover:bg-gray-600 text-white'
  },
  light: {
    bg: 'bg-gradient-to-b from-slate-50 to-slate-100 text-gray-900',
    container: 'bg-white text-gray-900 border-gray-200',
    input: 'bg-white text-gray-900 border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500',
    button: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
    scrollButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  }
} as const;