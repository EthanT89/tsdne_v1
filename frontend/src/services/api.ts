/**
 * API service module for the TSDNE application.
 * 
 * This module handles all API calls and provides a clean interface for the components.
 */

import {
  ConversationsResponse,
  ConversationResponse,
  GenerateRequest,
  HealthCheckResponse,
  StreamResponse,
  NetworkError,
  API_ENDPOINTS
} from '../types';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Handle API response and check for errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || 'Unknown error occurred';
    } catch {
      errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new NetworkError(errorMessage, response.status);
  }
  
  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text() as unknown as T;
}

/**
 * Create request headers with proper content type
 */
function createHeaders(contentType: string = 'application/json'): HeadersInit {
  return {
    'Content-Type': contentType,
    'Accept': 'application/json'
  };
}

/**
 * Validate input before sending to API
 */
function validateInput(input: string): void {
  if (!input || !input.trim()) {
    throw new Error('Input cannot be empty');
  }
  
  if (input.length > 1000) {
    throw new Error('Input too long (max 1000 characters)');
  }
}

// =============================================================================
// API Service Class
// =============================================================================

export class ApiService {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.HEALTH}`, {
      method: 'GET',
      headers: createHeaders()
    });
    
    return handleResponse<HealthCheckResponse>(response);
  }
  
  /**
   * Generate story response with streaming
   */
  async generateStory(request: GenerateRequest): Promise<StreamResponse> {
    validateInput(request.input);
    
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.GENERATE}`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new NetworkError(
        `Failed to generate story: ${response.statusText}`,
        response.status
      );
    }
    
    if (!response.body) {
      throw new NetworkError('No response body received');
    }
    
    const conversationId = response.headers.get('X-Conversation-ID') || undefined;
    
    return {
      reader: response.body.getReader(),
      conversationId
    };
  }
  
  /**
   * Get all conversations
   */
  async getConversations(): Promise<ConversationsResponse> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CONVERSATIONS}`, {
      method: 'GET',
      headers: createHeaders()
    });
    
    return handleResponse<ConversationsResponse>(response);
  }
  
  /**
   * Get specific conversation with messages
   */
  async getConversation(conversationId: number): Promise<ConversationResponse> {
    if (conversationId <= 0) {
      throw new Error('Invalid conversation ID');
    }
    
    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.CONVERSATIONS}/${conversationId}`,
      {
        method: 'GET',
        headers: createHeaders()
      }
    );
    
    return handleResponse<ConversationResponse>(response);
  }
  
  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: number): Promise<void> {
    if (conversationId <= 0) {
      throw new Error('Invalid conversation ID');
    }
    
    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.CONVERSATIONS}/${conversationId}`,
      {
        method: 'DELETE',
        headers: createHeaders()
      }
    );
    
    await handleResponse<void>(response);
  }
}

// =============================================================================
// Stream Processing Utilities
// =============================================================================

/**
 * Process streaming response from the generate endpoint
 */
export async function* processStreamResponse(
  streamResponse: StreamResponse,
  onChunk?: (chunk: string) => void
): AsyncGenerator<string, string, unknown> {
  const decoder = new TextDecoder();
  const { reader } = streamResponse;
  
  let fullText = '';
  let isComplete = false;
  
  try {
    while (!isComplete) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      
      if (chunk.includes('<END>')) {
        // Extract the full text from the end marker
        const endMarker = chunk.indexOf('<END>');
        const beforeEnd = chunk.substring(0, endMarker);
        const afterEnd = chunk.substring(endMarker + 5);
        
        if (beforeEnd) {
          fullText += beforeEnd;
          yield beforeEnd;
          onChunk?.(beforeEnd);
        }
        
        fullText = afterEnd.replace(/ <BREAK> /g, '\n\n');
        isComplete = true;
      } else {
        fullText += chunk;
        yield chunk;
        onChunk?.(chunk);
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  return fullText;
}

// =============================================================================
// Default API Service Instance
// =============================================================================

export const apiService = new ApiService();

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Send a message and get streaming response
 */
export async function sendMessage(
  input: string,
  conversationId?: number,
  onChunk?: (chunk: string) => void
): Promise<{ fullText: string; conversationId?: string }> {
  const streamResponse = await apiService.generateStory({
    input,
    conversation_id: conversationId
  });
  
  let fullText = '';
  for await (const chunk of processStreamResponse(streamResponse, onChunk)) {
    fullText += chunk;
  }
  
  return {
    fullText,
    conversationId: streamResponse.conversationId
  };
}

/**
 * Check if the API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiService.healthCheck();
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: unknown): string {
  if (error instanceof NetworkError) {
    if (error.status === 400) {
      return 'Invalid input. Please check your message and try again.';
    } else if (error.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    } else if (error.status === 500) {
      return 'Server error. Please try again later.';
    } else if (error.status === 503) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}