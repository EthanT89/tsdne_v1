import { useState } from "react";
import { SettingsPanelProps } from "../types";

const SettingsPanel = ({ settings, updateSettings, closePanel }: SettingsPanelProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (field: keyof typeof settings, value: number | "dark" | "light") => {
    setLocalSettings({ ...localSettings, [field]: value });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    closePanel();
  };

  const isDark = settings.theme === "dark";
  const panelClasses = isDark 
    ? "bg-gray-800 text-white" 
    : "bg-white text-gray-900 border border-gray-200";
  
  const inputClasses = isDark
    ? "bg-gray-700 border-gray-600 text-white"
    : "bg-gray-50 border-gray-300 text-gray-900";
    
  const selectClasses = isDark
    ? "bg-gray-700 border-gray-600 text-white"
    : "bg-gray-50 border-gray-300 text-gray-900";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className={`max-h-[90vh] overflow-y-auto rounded-lg p-6 max-w-md w-full custom-scrollbar shadow-lg ${panelClasses}`}
      >
        <h2 className="text-xl mb-4 font-semibold">Settings</h2>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">
            Font Size: {localSettings.fontSize}px
          </label>
          <input
            type="range"
            min="15"
            max="30"
            value={localSettings.fontSize}
            onChange={(e) => handleChange("fontSize", Number(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${inputClasses}`}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">
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
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${inputClasses}`}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Theme</label>
          <select
            value={localSettings.theme}
            onChange={(e) =>
              handleChange("theme", e.target.value as "dark" | "light")
            }
            className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${selectClasses}`}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={closePanel}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? "bg-gray-600 hover:bg-gray-500 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-800 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
