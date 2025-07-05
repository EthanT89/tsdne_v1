"use client";

import React from "react";
import { CogIcon } from "@heroicons/react/24/solid";

import Title from "./components/Title";
import OutputBox from "./components/OutputBox";
import UserInput from "./components/UserInput";
import Footer from "./components/Footer";
import SettingsPanel from "./components/SettingsPanel";
import ErrorBoundary from "./components/ErrorBoundary";

import { 
  useAppState, 
  useStoryGeneration, 
  useSettings,
  useTheme 
} from "./hooks";
import { Message, MessageRole } from "./types";
import { apiService, processStreamResponse, handleApiError } from "./services/api";

export default function App() {
  const [state, updateState] = useAppState();
  const { settings, updateSettings } = useSettings();
  const { theme } = useTheme(settings.theme);
  const { isGenerating } = useStoryGeneration();

  // Update theme when settings change
  React.useEffect(() => {
    if (settings.theme !== theme) {
      updateSettings({ ...settings, theme });
    }
  }, [theme, settings, updateSettings]);

  const themeClasses = theme === "dark"
    ? "bg-gradient-to-b from-gray-900 to-gray-950 text-white"
    : "bg-gradient-to-b from-slate-50 to-slate-100 text-gray-900";

  const sendMessage = async () => {
    if (!state.input.trim() || isGenerating) return;

    const userMessage: Message = { 
      role: MessageRole.PLAYER, 
      text: state.input.trim() 
    };

    // Add user message and clear input
    updateState({
      messages: [...state.messages, userMessage],
      input: "",
      loading: true,
      error: null
    });

    // Create AI message placeholder
    const aiMessage: Message = { role: MessageRole.AI, text: "" };
    updateState({
      messages: [...state.messages, userMessage, aiMessage]
    });

    try {
      const streamResponse = await apiService.generateStory({
        input: userMessage.text,
        conversation_id: state.currentConversationId
      });

      for await (const chunk of processStreamResponse(streamResponse)) {
        updateState(prev => ({
          messages: prev.messages.map((msg, index) => 
            index === prev.messages.length - 1 && msg.role === MessageRole.AI
              ? { ...msg, text: msg.text + chunk }
              : msg
          )
        }));
      }

      updateState({
        loading: false,
        currentConversationId: streamResponse.conversationId ? parseInt(streamResponse.conversationId) : state.currentConversationId
      });

    } catch (error) {
      const errorMessage = handleApiError(error);
      updateState({
        loading: false,
        error: errorMessage
      });
    }
  };

  const handleSettingsUpdate = (newSettings: typeof settings) => {
    updateSettings(newSettings);
    updateState({ settings: newSettings });
  };

  return (
    <ErrorBoundary theme={theme}>
      <div
        className={`h-screen w-full overflow-hidden flex flex-col ${themeClasses} font-annie`}
        style={{ fontSize: settings.fontSize + "px" }}
      >
        <header className="p-3 text-center flex justify-between items-center">
          <Title theme={theme} />
          <button
            onClick={() => updateState({ showSettings: true })}
            className={`p-2 rounded-lg transition-colors ${
              theme === "light" 
                ? "hover:bg-gray-200 text-black" 
                : "hover:bg-gray-800 text-white"
            }`}
            aria-label="Open settings"
          >
            <CogIcon className="h-8 w-8" />
          </button>
        </header>

        <main className="flex-grow overflow-hidden flex flex-col items-center px-4">
          <div className="w-full sm:w-4/5 md:w-3/4 max-w-2xl flex flex-col h-full">
            <div className="flex-grow overflow-auto">
              <OutputBox
                story={state.messages}
                error={state.error}
                animationSpeed={settings.animationSpeed}
                theme={theme}
              />
            </div>
            <UserInput
              input={state.input}
              setInput={(value) => updateState({ input: value })}
              onSubmit={sendMessage}
              isLoading={state.loading || isGenerating}
              theme={theme}
            />
          </div>
        </main>

        <Footer theme={theme} />

        {state.showSettings && (
          <SettingsPanel
            settings={settings}
            updateSettings={handleSettingsUpdate}
            closePanel={() => updateState({ showSettings: false })}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}