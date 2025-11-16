import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OutputBox from '../OutputBox'

describe('OutputBox', () => {
  it('renders messages correctly', () => {
    const messages = [
      { role: 'player', text: 'Hello world' },
      { role: 'ai', text: 'Hi there!' }
    ]

    render(<OutputBox story={messages} animationSpeed={0} theme="dark" />)

    expect(screen.getByText(/Hello world/)).toBeInTheDocument()
    expect(screen.getByText(/Hi there!/)).toBeInTheDocument()
  })

  it('displays error message when error prop is set', () => {
    render(<OutputBox story={[]} error="API Error" animationSpeed={0} theme="dark" />)

    expect(screen.getByText('API Error')).toBeInTheDocument()
    expect(screen.getByText('API Error')).toHaveClass('text-red-500')
  })

  it('renders player messages with "You: " prefix', () => {
    const messages = [
      { role: 'player', text: 'Test message' }
    ]

    render(<OutputBox story={messages} animationSpeed={0} theme="dark" />)

    expect(screen.getByText('You:')).toBeInTheDocument()
  })

  it('does not prefix AI messages with "You: "', () => {
    const messages = [
      { role: 'ai', text: 'AI response' }
    ]

    render(<OutputBox story={messages} animationSpeed={0} theme="dark" />)

    expect(screen.queryByText('You:')).not.toBeInTheDocument()
  })

  it('applies dark theme classes correctly', () => {
    const { container } = render(
      <OutputBox story={[]} animationSpeed={0} theme="dark" />
    )

    const outputBox = container.querySelector('.bg-gray-800')
    expect(outputBox).toBeInTheDocument()
  })

  it('applies light theme classes correctly', () => {
    const { container } = render(
      <OutputBox story={[]} animationSpeed={0} theme="light" />
    )

    const outputBox = container.querySelector('.bg-white')
    expect(outputBox).toBeInTheDocument()
  })

  it('renders multiple messages in order', () => {
    const messages = [
      { role: 'player', text: 'First' },
      { role: 'ai', text: 'Second' },
      { role: 'player', text: 'Third' }
    ]

    render(<OutputBox story={messages} animationSpeed={0} theme="dark" />)

    const allMessages = screen.getAllByText(/First|Second|Third/)
    expect(allMessages).toHaveLength(3)
  })

  it('handles empty story array', () => {
    const { container } = render(
      <OutputBox story={[]} animationSpeed={0} theme="dark" />
    )

    // Should render without errors
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
  })

  it('calls onFinalRenderComplete when finalRender is true', () => {
    const mockCallback = vi.fn()

    render(
      <OutputBox
        story={[{ role: 'ai', text: 'Test' }]}
        animationSpeed={0}
        theme="dark"
        finalRender={true}
        onFinalRenderComplete={mockCallback}
      />
    )

    // The callback should be called during the effect
    // Note: This may need adjustment based on timing
    expect(mockCallback).toHaveBeenCalled()
  })

  it('splits paragraphs correctly on double newlines', () => {
    const messages = [
      { role: 'ai', text: 'First paragraph\n\nSecond paragraph' }
    ]

    const { container } = render(
      <OutputBox story={messages} animationSpeed={0} theme="dark" />
    )

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBeGreaterThanOrEqual(2)
  })
})
