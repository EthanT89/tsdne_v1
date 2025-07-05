/**
 * Custom hooks for the TSDNE application.
 * 
 * This module contains reusable custom hooks for state management and side effects.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Settings, 
  AppState, 
  MessageRole, 
  DEFAULT_SETTINGS,
  ThemeType 
} from '../types';
import { sendMessage, handleApiError } from '../services/api';

// =============================================================================
// Application State Hook
// =============================================================================

export function useAppState() {
  const [state, setState] = useState<AppState>({
    messages: [
      {
        role: MessageRole.DEV,
        text: `Welcome to This Story Does Not Exist, where every choice you make writes a story only you can tell. You are both the reader and the written.

Hi, I'm Ethan Thornberg! I built this because I believe storytelling should be as limitless as your imagination. This project is my way of combining AI and creativity to build something truly unique. Check out the links below to see what else I'm working on—I'd love to connect!

To begin, describe your world. It could be a bustling city, a quiet forest, or something entirely new. Wherever you take it, the adventure is yours to create.

What's next?`,
      },
    ],
    input: '',
    loading: false,
    error: null,
    settings: DEFAULT_SETTINGS,
    showSettings: false,
    currentConversationId: undefined,
  });

  const updateState = useCallback((updates: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
    setState(prev => {
      const updatedValues = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...updatedValues };
    });
  }, []);

  return [state, updateState] as const;
}

// =============================================================================
// Story Generation Hook
// =============================================================================

export function useStoryGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateStory = useCallback(async (
    input: string,
    conversationId: number | undefined,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string, newConversationId?: string) => void,
    onError: (error: string) => void
  ) => {
    if (isGenerating) {
      return; // Prevent multiple concurrent generations
    }

    // Validate input
    if (!input.trim()) {
      onError('Please enter some text to continue the story.');
      return;
    }

    setIsGenerating(true);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const result = await sendMessage(
        input.trim(),
        conversationId,
        onChunk
      );

      onComplete(result.fullText, result.conversationId);
    } catch (error) {
      const errorMessage = handleApiError(error);
      onError(errorMessage);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [isGenerating]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    generateStory,
    cancelGeneration
  };
}

// =============================================================================
// Settings Management Hook
// =============================================================================

export function useSettings(initialSettings: Settings = DEFAULT_SETTINGS) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Try to load settings from localStorage
    try {
      const saved = localStorage.getItem('tsdne-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return initialSettings;
  });

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    
    // Save to localStorage
    try {
      localStorage.setItem('tsdne-settings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, []);

  const resetSettings = useCallback(() => {
    updateSettings(DEFAULT_SETTINGS);
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    resetSettings
  };
}

// =============================================================================
// Input Validation Hook
// =============================================================================

export function useInputValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateInput = useCallback((input: string, fieldName: string = 'input'): boolean => {
    const newErrors = { ...errors };

    // Clear previous error for this field
    delete newErrors[fieldName];

    // Validate input
    if (!input || !input.trim()) {
      newErrors[fieldName] = 'This field is required';
    } else if (input.length > 1000) {
      newErrors[fieldName] = 'Input is too long (maximum 1000 characters)';
    } else if (input.length < 1) {
      newErrors[fieldName] = 'Input is too short (minimum 1 character)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [errors]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateInput,
    clearErrors,
    clearError
  };
}

// =============================================================================
// Auto-scroll Hook
// =============================================================================

export function useAutoScroll(dependency: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const element = scrollRef.current;
      const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
      
      if (isNearBottom) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [dependency]);

  return scrollRef;
}

// =============================================================================
// Theme Management Hook
// =============================================================================

export function useTheme(initialTheme: ThemeType = 'dark') {
  const [theme, setTheme] = useState<ThemeType>(() => {
    // Try to load theme from localStorage
    try {
      const saved = localStorage.getItem('tsdne-theme');
      if (saved && (saved === 'dark' || saved === 'light')) {
        return saved as ThemeType;
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    
    return initialTheme;
  });

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    try {
      localStorage.setItem('tsdne-theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme]);

  const setThemeDirectly = useCallback((newTheme: ThemeType) => {
    setTheme(newTheme);
    
    try {
      localStorage.setItem('tsdne-theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme: setThemeDirectly
  };
}

// =============================================================================
// Local Storage Hook
// =============================================================================

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
    }
    return defaultValue;
  });

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }, [key, value]);

  const removeStoredValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setValue(defaultValue);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  }, [key, defaultValue]);

  return [value, setStoredValue, removeStoredValue] as const;
}