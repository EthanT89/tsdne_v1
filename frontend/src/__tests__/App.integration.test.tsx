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

  it('renders the application with initial welcome message', () => {
    render(<App />)

    expect(screen.getByText(/Welcome to This Story Does Not Exist/i)).toBeInTheDocument()
    expect(screen.getByText(/Ethan Thornberg/i)).toBeInTheDocument()
  })

  it('displays input field and submit button', () => {
    render(<App />)

    expect(screen.getByPlaceholderText("What's next...")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go/i })).toBeInTheDocument()
  })

  it('shows settings button', () => {
    render(<App />)

    const buttons = screen.getAllByRole('button')
    const settingsButton = buttons.find(btn => btn.getAttribute('title') === 'Settings')
    expect(settingsButton).toBeInTheDocument()
  })

  it('shows My Stories button', () => {
    render(<App />)

    const buttons = screen.getAllByRole('button')
    const storiesButton = buttons.find(btn => btn.getAttribute('title') === 'My Stories')
    expect(storiesButton).toBeInTheDocument()
  })

  it('shows New Story button', () => {
    render(<App />)

    const buttons = screen.getAllByRole('button')
    const newStoryButton = buttons.find(btn => btn.getAttribute('title') === 'New Story')
    expect(newStoryButton).toBeInTheDocument()
  })

  it('opens settings panel when settings button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const buttons = screen.getAllByRole('button')
    const settingsButton = buttons.find(btn => btn.getAttribute('title') === 'Settings')

    if (settingsButton) {
      await user.click(settingsButton)
      await waitFor(() => {
        expect(screen.getByText('Font Size:')).toBeInTheDocument()
      })
    }
  })

  it('sends message when user submits input', async () => {
    const user = userEvent.setup()

    // Mock streaming response
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('Test ')
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('<END>Test response')
        })
        .mockResolvedValueOnce({ done: true })
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    })

    render(<App />)

    const input = screen.getByPlaceholderText("What's next...")
    const button = screen.getByRole('button', { name: /go/i })

    await user.type(input, 'Test message')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Test message/)).toBeInTheDocument()
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(screen.getByText(/Test response/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays error message when API call fails', async () => {
    const user = userEvent.setup()

    ;(global.fetch as any).mockRejectedValueOnce(new Error('API Error'))

    render(<App />)

    const input = screen.getByPlaceholderText("What's next...")
    const button = screen.getByRole('button', { name: /go/i })

    await user.type(input, 'Test message')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/AI is currently unavailable/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('disables input during loading', async () => {
    const user = userEvent.setup()

    // Create a promise that we control
    let resolveRead: any
    const readPromise = new Promise((resolve) => {
      resolveRead = resolve
    })

    const mockReader = {
      read: vi.fn().mockImplementation(() => readPromise)
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    })

    render(<App />)

    const input = screen.getByPlaceholderText("What's next...")
    const button = screen.getByRole('button', { name: /go/i })

    await user.type(input, 'Test')
    await user.click(button)

    // Input should be disabled while loading
    await waitFor(() => {
      expect(input).toBeDisabled()
      expect(button).toBeDisabled()
    })

    // Resolve the read promise to complete the test
    resolveRead({ done: true })
  })

  it('clears input after submitting message', async () => {
    const user = userEvent.setup()

    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('<END>Response')
        })
        .mockResolvedValueOnce({ done: true })
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    })

    render(<App />)

    const input = screen.getByPlaceholderText("What's next...")
    const button = screen.getByRole('button', { name: /go/i })

    await user.type(input, 'Test message')
    await user.click(button)

    // Input should be cleared
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('resets conversation when New Story button is clicked', async () => {
    const user = userEvent.setup()

    render(<App />)

    const buttons = screen.getAllByRole('button')
    const newStoryButton = buttons.find(btn => btn.getAttribute('title') === 'New Story')

    if (newStoryButton) {
      await user.click(newStoryButton)

      // Should see the welcome message again
      expect(screen.getByText(/Welcome to This Story Does Not Exist/i)).toBeInTheDocument()
    }
  })
})
