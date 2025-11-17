import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserInput from '../UserInput'

describe('UserInput', () => {
  it('calls onSubmit when button is clicked', async () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()
    const user = userEvent.setup()

    render(
      <UserInput
        input="Test input"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={false}
        theme="dark"
      />
    )

    const button = screen.getByRole('button', { name: /Go/i })
    await user.click(button)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(setInput).toHaveBeenCalledWith('')
  })

  it('calls onSubmit when Enter key is pressed', async () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()
    const user = userEvent.setup()

    render(
      <UserInput
        input="Test input"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={false}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText("What's next...")
    await user.click(input)
    await user.keyboard('{Enter}')

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(setInput).toHaveBeenCalledWith('')
  })

  it('disables submit when loading', () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()

    render(
      <UserInput
        input="Test"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={true}
        theme="dark"
      />
    )

    const button = screen.getByRole('button', { name: /\.\.\./i })
    expect(button).toBeDisabled()
  })

  it('disables input field when loading', () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()

    render(
      <UserInput
        input="Test"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={true}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText("What's next...")
    expect(input).toBeDisabled()
  })

  it('shows "..." when loading', () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()

    render(
      <UserInput
        input="Test"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={true}
        theme="dark"
      />
    )

    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('shows "Go" when not loading', () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()

    render(
      <UserInput
        input="Test"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={false}
        theme="dark"
      />
    )

    expect(screen.getByText('Go')).toBeInTheDocument()
  })

  it('calls setInput when user types', async () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()
    const user = userEvent.setup()

    render(
      <UserInput
        input=""
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={false}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText("What's next...")
    await user.type(input, 'H')

    expect(setInput).toHaveBeenCalled()
  })

  it('does not call onSubmit when Enter is pressed while loading', async () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()
    const user = userEvent.setup()

    render(
      <UserInput
        input="Test"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={true}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText("What's next...")
    await user.click(input)
    await user.keyboard('{Enter}')

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('applies light theme classes correctly', () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()

    const { container } = render(
      <UserInput
        input="Test"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={false}
        theme="light"
      />
    )

    const input = container.querySelector('.bg-white')
    expect(input).toBeInTheDocument()
  })

  it('applies dark theme classes correctly', () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()

    const { container } = render(
      <UserInput
        input="Test"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={false}
        theme="dark"
      />
    )

    const input = container.querySelector('.bg-gray-800')
    expect(input).toBeInTheDocument()
  })
})
