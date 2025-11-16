import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OutputBox from '../OutputBox'

describe('OutputBox', () => {
  it('renders messages correctly', () => {
    const messages = [
      { role: 'player', text: 'Hello world' },
      { role: 'ai', text: 'Hi there!' }
    ]

    render(<OutputBox story={messages} error={null} animationSpeed={0} theme="dark" />)

    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('displays error message when error prop is set', () => {
    render(<OutputBox story={[]} error="API Error" animationSpeed={0} theme="dark" />)

    expect(screen.getByText('API Error')).toBeInTheDocument()
  })

  it('displays "You: " prefix for player messages', () => {
    const messages = [
      { role: 'player', text: 'Test message' }
    ]

    render(<OutputBox story={messages} error={null} animationSpeed={0} theme="dark" />)

    expect(screen.getByText(/You:/)).toBeInTheDocument()
  })

  it('does not display "You: " prefix for AI messages', () => {
    const messages = [
      { role: 'ai', text: 'AI response' }
    ]

    render(<OutputBox story={messages} error={null} animationSpeed={0} theme="dark" />)

    expect(screen.queryByText(/You:/)).not.toBeInTheDocument()
  })

  it('renders empty story with no error', () => {
    const { container } = render(<OutputBox story={[]} error={null} animationSpeed={0} theme="dark" />)

    expect(container.querySelector('.text-red-500')).not.toBeInTheDocument()
  })

  it('applies light theme classes correctly', () => {
    const messages = [
      { role: 'ai', text: 'Test' }
    ]

    const { container } = render(<OutputBox story={messages} error={null} animationSpeed={0} theme="light" />)

    const outputBox = container.querySelector('.bg-white')
    expect(outputBox).toBeInTheDocument()
  })

  it('applies dark theme classes correctly', () => {
    const messages = [
      { role: 'ai', text: 'Test' }
    ]

    const { container } = render(<OutputBox story={messages} error={null} animationSpeed={0} theme="dark" />)

    const outputBox = container.querySelector('.bg-gray-800')
    expect(outputBox).toBeInTheDocument()
  })

  it('renders multiple paragraphs from text with double newlines', () => {
    const messages = [
      { role: 'ai', text: 'Paragraph 1\n\nParagraph 2' }
    ]

    render(<OutputBox story={messages} error={null} animationSpeed={0} theme="dark" />)

    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
  })
})
