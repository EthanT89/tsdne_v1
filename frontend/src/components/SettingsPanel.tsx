import { useState } from "react";

interface Settings {
  fontSize: number;
  animationSpeed: number;
  theme: "dark" | "light";
}

interface SettingsPanelProps {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  closePanel: () => void;
}

const SettingsPanel = ({ settings, updateSettings, closePanel }: SettingsPanelProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (field: keyof Settings, value: number | "dark" | "light") => {
    setLocalSettings({ ...localSettings, [field]: value });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    closePanel();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className="max-h-[90vh] overflow-y-auto bg-gray-800 rounded-lg p-6 max-w-md w-full custom-scrollbar"
        style={{ color: "white" }}
      >
        <h2 className="text-xl mb-4">Settings</h2>

        <div className="mb-4">
          <label className="block mb-1">
            Font Size: {localSettings.fontSize}px
          </label>
          <input
            type="range"
            min="15"
            max="30"
            value={localSettings.fontSize}
            onChange={(e) => handleChange("fontSize", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">
            Animation Speed: {localSettings.animationSpeed}ms
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            value={localSettings.animationSpeed}
            onChange={(e) =>
              handleChange("animationSpeed", Number(e.target.value))
            }
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Theme</label>
          <select
            value={localSettings.theme}
            onChange={(e) =>
              handleChange("theme", e.target.value as "dark" | "light")
            }
            className="w-full p-2 rounded bg-gray-700"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={closePanel}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
