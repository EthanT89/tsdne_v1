import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock fetch globally
global.fetch = vi.fn()

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the application with title and input', () => {
    render(<App />)

    // Check for main elements
    const input = screen.getByPlaceholderText("What's next...")
    expect(input).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /Go/i })
    expect(button).toBeInTheDocument()
  })

  it('allows user to type in input field', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText("What's next...")
    await user.type(input, 'Test message')

    expect(input).toHaveValue('Test message')
  })

  it('disables input and button when loading', async () => {
    const user = userEvent.setup()

    // Mock a slow streaming response
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('Test ')
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('response')
        })
        .mockImplementation(() => new Promise(() => {})) // Never resolves to keep loading
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader }
    })

    render(<App />)

    const input = screen.getByPlaceholderText("What's next...")
    const button = screen.getByRole('button', { name: /Go/i })

    await user.type(input, 'Test message')
    await user.click(button)

    // Wait for loading state
    await waitFor(() => {
      expect(input).toBeDisabled()
      expect(button).toBeDisabled()
    })
  })

  it('displays error message when fetch fails', async () => {
    const user = userEvent.setup()

    // Mock failed fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<App />)

    const input = screen.getByPlaceholderText("What's next...")
    const button = screen.getByRole('button', { name: /Go/i })

    await user.type(input, 'Test message')
    await user.click(button)

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('clears input after successful submission', async () => {
    const user = userEvent.setup()

    // Mock successful streaming response
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('AI response')
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('\n<END>AI response')
        })
        .mockResolvedValueOnce({ done: true })
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader }
    })

    render(<App />)

    const input = screen.getByPlaceholderText("What's next...")
    const button = screen.getByRole('button', { name: /Go/i })

    await user.type(input, 'Test message')
    await user.click(button)

    // Wait for input to be cleared
    await waitFor(() => {
      expect(input).toHaveValue('')
    }, { timeout: 3000 })
  })
})
