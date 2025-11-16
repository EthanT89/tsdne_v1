import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserInput from '../UserInput'

describe('UserInput', () => {
  it('renders input field and button', () => {
    render(
      <UserInput
        input=""
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        theme="dark"
      />
    )

    expect(screen.getByPlaceholderText("What's next...")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go/i })).toBeInTheDocument()
  })

  it('calls setInput when typing in the input field', async () => {
    const setInputMock = vi.fn()
    const user = userEvent.setup()

    render(
      <UserInput
        input=""
        setInput={setInputMock}
        onSubmit={vi.fn()}
        isLoading={false}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText("What's next...")
    await user.type(input, 'Test')

    expect(setInputMock).toHaveBeenCalled()
  })

  it('calls onSubmit when button is clicked', async () => {
    const onSubmitMock = vi.fn()
    const setInputMock = vi.fn()
    const user = userEvent.setup()

    render(
      <UserInput
        input="Test input"
        setInput={setInputMock}
        onSubmit={onSubmitMock}
        isLoading={false}
        theme="dark"
      />
    )

    const button = screen.getByRole('button', { name: /go/i })
    await user.click(button)

    expect(onSubmitMock).toHaveBeenCalledTimes(1)
    expect(setInputMock).toHaveBeenCalledWith('')
  })

  it('calls onSubmit when Enter key is pressed', async () => {
    const onSubmitMock = vi.fn()
    const setInputMock = vi.fn()

    render(
      <UserInput
        input="Test input"
        setInput={setInputMock}
        onSubmit={onSubmitMock}
        isLoading={false}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText("What's next...")
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    expect(onSubmitMock).toHaveBeenCalledTimes(1)
    expect(setInputMock).toHaveBeenCalledWith('')
  })

  it('disables input and button when loading', () => {
    render(
      <UserInput
        input="Test"
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={true}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText("What's next...")
    const button = screen.getByRole('button')

    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('shows loading indicator when isLoading is true', () => {
    render(
      <UserInput
        input="Test"
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={true}
        theme="dark"
      />
    )

    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.queryByText('Go')).not.toBeInTheDocument()
  })

  it('shows "Go" text when not loading', () => {
    render(
      <UserInput
        input="Test"
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        theme="dark"
      />
    )

    expect(screen.getByText('Go')).toBeInTheDocument()
    expect(screen.queryByText('...')).not.toBeInTheDocument()
  })

  it('does not call onSubmit when Enter is pressed while loading', () => {
    const onSubmitMock = vi.fn()

    render(
      <UserInput
        input="Test"
        setInput={vi.fn()}
        onSubmit={onSubmitMock}
        isLoading={true}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText("What's next...")
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    expect(onSubmitMock).not.toHaveBeenCalled()
  })

  it('does not call onSubmit when button is clicked while loading', async () => {
    const onSubmitMock = vi.fn()
    const setInputMock = vi.fn()

    render(
      <UserInput
        input="Test"
        setInput={setInputMock}
        onSubmit={onSubmitMock}
        isLoading={true}
        theme="dark"
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // onSubmit should not be called when loading
    expect(onSubmitMock).not.toHaveBeenCalled()
  })

  it('applies dark theme classes correctly', () => {
    const { container } = render(
      <UserInput
        input=""
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        theme="dark"
      />
    )

    const input = container.querySelector('.bg-gray-800')
    expect(input).toBeInTheDocument()
  })

  it('applies light theme classes correctly', () => {
    const { container } = render(
      <UserInput
        input=""
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        theme="light"
      />
    )

    const input = container.querySelector('.bg-white')
    expect(input).toBeInTheDocument()
  })

  it('displays the current input value', () => {
    render(
      <UserInput
        input="My test input"
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        theme="dark"
      />
    )

    const input = screen.getByDisplayValue('My test input')
    expect(input).toBeInTheDocument()
  })
})
