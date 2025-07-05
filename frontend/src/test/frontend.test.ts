/**
 * Frontend unit tests for the TSDNE application.
 * 
 * This module contains unit tests for the frontend components and functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ApiService, handleApiError, processStreamResponse } from '../services/api';
import { ValidationError, NetworkError, MessageRole, DEFAULT_SETTINGS } from '../types';
import { useAppState, useSettings, useInputValidation } from '../hooks';
import { renderHook, act } from '@testing-library/react';

// =============================================================================
// API Service Tests
// =============================================================================

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService('http://test-api.com');
    global.fetch = vi.fn();
  });

  it('should create an instance with correct base URL', () => {
    expect(apiService).toBeInstanceOf(ApiService);
  });

  it('should handle successful health check', async () => {
    const mockResponse = { status: 'healthy', message: 'API is running' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(mockResponse)
    });

    const result = await apiService.healthCheck();
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-api.com/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('should handle API errors correctly', async () => {
    const errorResponse = { error: 'API Error' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve(JSON.stringify(errorResponse))
    });

    await expect(apiService.healthCheck()).rejects.toThrow(NetworkError);
  });

  it('should validate input before generating story', async () => {
    await expect(apiService.generateStory({ input: '' }))
      .rejects.toThrow('Input cannot be empty');
    
    await expect(apiService.generateStory({ input: 'a'.repeat(1001) }))
      .rejects.toThrow('Input too long');
  });
});

// =============================================================================
// Error Handling Tests
// =============================================================================

describe('handleApiError', () => {
  it('should handle NetworkError correctly', () => {
    const error = new NetworkError('Test error', 400);
    const result = handleApiError(error);
    expect(result).toBe('Invalid input. Please check your message and try again.');
  });

  it('should handle generic Error correctly', () => {
    const error = new Error('Generic error');
    const result = handleApiError(error);
    expect(result).toBe('Generic error');
  });

  it('should handle unknown errors', () => {
    const result = handleApiError('unknown error');
    expect(result).toBe('An unexpected error occurred. Please try again.');
  });

  it('should handle different HTTP status codes', () => {
    expect(handleApiError(new NetworkError('', 429)))
      .toBe('Too many requests. Please wait a moment and try again.');
    
    expect(handleApiError(new NetworkError('', 500)))
      .toBe('Server error. Please try again later.');
    
    expect(handleApiError(new NetworkError('', 503)))
      .toBe('Service temporarily unavailable. Please try again later.');
  });
});

// =============================================================================
// Custom Hooks Tests
// =============================================================================

describe('useAppState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAppState());
    const [state] = result.current;

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe(MessageRole.DEV);
    expect(state.input).toBe('');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.showSettings).toBe(false);
  });

  it('should update state correctly', () => {
    const { result } = renderHook(() => useAppState());
    const [, updateState] = result.current;

    act(() => {
      updateState({ input: 'test input', loading: true });
    });

    const [newState] = result.current;
    expect(newState.input).toBe('test input');
    expect(newState.loading).toBe(true);
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useAppState());
    const [, updateState] = result.current;

    act(() => {
      updateState(prev => ({ input: prev.input + ' updated' }));
    });

    const [newState] = result.current;
    expect(newState.input).toBe(' updated');
  });
});

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useSettings());
    const { settings } = result.current;

    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should update settings', () => {
    const { result } = renderHook(() => useSettings());
    const { updateSettings } = result.current;

    const newSettings = { ...DEFAULT_SETTINGS, fontSize: 20 };

    act(() => {
      updateSettings(newSettings);
    });

    expect(result.current.settings.fontSize).toBe(20);
  });

  it('should persist settings to localStorage', () => {
    const { result } = renderHook(() => useSettings());
    const { updateSettings } = result.current;

    const newSettings = { ...DEFAULT_SETTINGS, theme: 'light' as const };

    act(() => {
      updateSettings(newSettings);
    });

    const saved = localStorage.getItem('tsdne-settings');
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!).theme).toBe('light');
  });

  it('should reset settings', () => {
    const { result } = renderHook(() => useSettings());
    const { updateSettings, resetSettings } = result.current;

    act(() => {
      updateSettings({ ...DEFAULT_SETTINGS, fontSize: 24 });
    });

    expect(result.current.settings.fontSize).toBe(24);

    act(() => {
      resetSettings();
    });

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('useInputValidation', () => {
  it('should validate input correctly', () => {
    const { result } = renderHook(() => useInputValidation());
    const { validateInput } = result.current;

    // Valid input
    act(() => {
      const isValid = validateInput('Valid input');
      expect(isValid).toBe(true);
    });

    // Empty input
    act(() => {
      const isValid = validateInput('');
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.input).toBe('This field is required');

    // Too long input
    act(() => {
      const isValid = validateInput('a'.repeat(1001));
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.input).toBe('Input is too long (maximum 1000 characters)');
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useInputValidation());
    const { validateInput, clearErrors } = result.current;

    act(() => {
      validateInput('');
    });

    expect(result.current.errors.input).toBeTruthy();

    act(() => {
      clearErrors();
    });

    expect(Object.keys(result.current.errors)).toHaveLength(0);
  });

  it('should clear specific error', () => {
    const { result } = renderHook(() => useInputValidation());
    const { validateInput, clearError } = result.current;

    act(() => {
      validateInput('', 'test-field');
    });

    expect(result.current.errors['test-field']).toBeTruthy();

    act(() => {
      clearError('test-field');
    });

    expect(result.current.errors['test-field']).toBeUndefined();
  });
});

// =============================================================================
// Type Safety Tests
// =============================================================================

describe('Type Safety', () => {
  it('should enforce MessageRole enum', () => {
    expect(MessageRole.PLAYER).toBe('player');
    expect(MessageRole.AI).toBe('ai');
    expect(MessageRole.DEV).toBe('Dev');
  });

  it('should have correct default settings structure', () => {
    expect(DEFAULT_SETTINGS).toHaveProperty('fontSize');
    expect(DEFAULT_SETTINGS).toHaveProperty('animationSpeed');
    expect(DEFAULT_SETTINGS).toHaveProperty('theme');
    
    expect(typeof DEFAULT_SETTINGS.fontSize).toBe('number');
    expect(typeof DEFAULT_SETTINGS.animationSpeed).toBe('number');
    expect(['dark', 'light']).toContain(DEFAULT_SETTINGS.theme);
  });

  it('should validate ValidationError class', () => {
    const error = new ValidationError('Test validation error');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Test validation error');
  });

  it('should validate NetworkError class', () => {
    const error = new NetworkError('Network error', 500);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Network error');
    expect(error.status).toBe(500);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration Tests', () => {
  it('should handle complete message flow', async () => {
    const mockStreamResponse = {
      reader: {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello ') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('world!') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('<END>Full response') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn()
      },
      conversationId: '123'
    };

    const chunks: string[] = [];
    const generator = processStreamResponse(
      mockStreamResponse,
      (chunk) => chunks.push(chunk)
    );

    const result = [];
    for await (const chunk of generator) {
      result.push(chunk);
    }

    expect(chunks).toEqual(['Hello ', 'world!']);
    expect(result).toEqual(['Hello ', 'world!']);
  });
});

export default describe;