import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPanel from '../SettingsPanel'

describe('SettingsPanel', () => {
  const defaultSettings = {
    fontSize: 16,
    animationSpeed: 500,
    theme: 'dark' as const
  }

  it('renders all settings controls', () => {
    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    expect(screen.getByText(/Font Size:/)).toBeInTheDocument()
    expect(screen.getByText(/Animation Speed:/)).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('displays current font size value', () => {
    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    expect(screen.getByText(/16px/)).toBeInTheDocument()
  })

  it('displays current animation speed value', () => {
    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    expect(screen.getByText(/500ms/)).toBeInTheDocument()
  })

  it('displays current theme', () => {
    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    const themeSelect = screen.getByRole('combobox')
    expect(themeSelect).toHaveValue('dark')
  })

  it('updates font size when slider is changed', () => {
    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    const sliders = screen.getAllByRole('slider')
    const fontSlider = sliders[0]

    fireEvent.change(fontSlider, { target: { value: '20' } })

    expect(screen.getByText(/20px/)).toBeInTheDocument()
  })

  it('updates animation speed when slider is changed', () => {
    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    const sliders = screen.getAllByRole('slider')
    const animationSlider = sliders[1]

    fireEvent.change(animationSlider, { target: { value: '1000' } })

    expect(screen.getByText(/1000ms/)).toBeInTheDocument()
  })

  it('updates theme when dropdown is changed', () => {
    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    const themeSelect = screen.getByRole('combobox')
    fireEvent.change(themeSelect, { target: { value: 'light' } })

    expect(themeSelect).toHaveValue('light')
  })

  it('calls updateSettings with new values when Save is clicked', async () => {
    const updateSettingsMock = vi.fn()
    const user = userEvent.setup()

    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={updateSettingsMock}
        closePanel={vi.fn()}
      />
    )

    const sliders = screen.getAllByRole('slider')
    fireEvent.change(sliders[0], { target: { value: '20' } })
    fireEvent.change(sliders[1], { target: { value: '1000' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    expect(updateSettingsMock).toHaveBeenCalledWith({
      fontSize: 20,
      animationSpeed: 1000,
      theme: 'dark'
    })
  })

  it('calls closePanel when Save is clicked', async () => {
    const closePanelMock = vi.fn()
    const user = userEvent.setup()

    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={closePanelMock}
      />
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    expect(closePanelMock).toHaveBeenCalledTimes(1)
  })

  it('calls closePanel when Cancel is clicked without saving', async () => {
    const updateSettingsMock = vi.fn()
    const closePanelMock = vi.fn()
    const user = userEvent.setup()

    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={updateSettingsMock}
        closePanel={closePanelMock}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(closePanelMock).toHaveBeenCalledTimes(1)
    expect(updateSettingsMock).not.toHaveBeenCalled()
  })

  it('does not update parent settings until Save is clicked', () => {
    const updateSettingsMock = vi.fn()

    render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={updateSettingsMock}
        closePanel={vi.fn()}
      />
    )

    const sliders = screen.getAllByRole('slider')
    fireEvent.change(sliders[0], { target: { value: '25' } })

    // updateSettings should not be called yet
    expect(updateSettingsMock).not.toHaveBeenCalled()
  })

  it('applies dark theme classes when theme is dark', () => {
    const { container } = render(
      <SettingsPanel
        settings={defaultSettings}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    const panel = container.querySelector('.bg-gray-800')
    expect(panel).toBeInTheDocument()
  })

  it('applies light theme classes when theme is light', () => {
    const { container } = render(
      <SettingsPanel
        settings={{ ...defaultSettings, theme: 'light' }}
        updateSettings={vi.fn()}
        closePanel={vi.fn()}
      />
    )

    const panel = container.querySelector('.bg-white')
    expect(panel).toBeInTheDocument()
  })
})
