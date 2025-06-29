import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Navigation from "../components/Navigation";
import NotificationTest from "../components/NotificationTest";

function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [settings, setSettings] = useState({
    postsPerPage: 5,
    defaultTab: "feeds",
    theme: "light",
    autoRefresh: false,
    refreshInterval: 5,
    enableAISummary: true,
    summaryLength: "medium",
    notificationsEnabled: true,
    notificationInterval: 5,
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem("userSettings");
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings((prevSettings) => ({
          ...prevSettings,
          ...parsedSettings,
        }));
      } catch (e) {
        console.error("Failed to parse stored settings", e);
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]); 
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newValue =
      type === "checkbox"
        ? checked
        : type === "number"
        ? parseInt(value, 10)
        : value;

    setSettings({
      ...settings,
      [name]: newValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      localStorage.setItem("userSettings", JSON.stringify(settings));

      setMessage({
        type: "success",
        text: "Settings saved successfully!",
      });
      if (settings.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation isLoggedIn={true} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Settings</h2>

            {message.text && (
              <div
                className={`p-4 mb-6 rounded-md ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Display Settings
                </h3>
                <div className="space-y-4">
                  {" "}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Tab
                    </label>
                    <select
                      name="defaultTab"
                      value={settings.defaultTab}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="feeds">Feeds</option>
                      <option value="posts">Posts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posts Per Page
                    </label>
                    <select
                      name="postsPerPage"
                      value={settings.postsPerPage}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme
                    </label>
                    <select
                      name="theme"
                      value={settings.theme}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark (Coming Soon)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Refresh Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="autoRefresh"
                        name="autoRefresh"
                        type="checkbox"
                        checked={settings.autoRefresh}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="autoRefresh"
                        className="font-medium text-gray-700"
                      >
                        Auto Refresh
                      </label>
                      <p className="text-gray-500">
                        Automatically refresh posts periodically
                      </p>
                    </div>
                  </div>

                  {settings.autoRefresh && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refresh Interval (minutes)
                      </label>
                      <input
                        type="number"
                        name="refreshInterval"
                        value={settings.refreshInterval}
                        onChange={handleChange}
                        min="1"
                        max="60"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  AI Summarization Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="enableAISummary"
                        name="enableAISummary"
                        type="checkbox"
                        checked={settings.enableAISummary}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="enableAISummary"
                        className="font-medium text-gray-700"
                      >
                        Enable AI Summary
                      </label>
                      <p className="text-gray-500">
                        Show AI summary option for posts
                      </p>
                    </div>
                  </div>

                  {settings.enableAISummary && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Summary Length
                      </label>
                      <select
                        name="summaryLength"
                        value={settings.summaryLength}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="notificationsEnabled"
                        name="notificationsEnabled"
                        type="checkbox"
                        checked={settings.notificationsEnabled}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="notificationsEnabled"
                        className="font-medium text-gray-700"
                      >
                        Enable Notifications
                      </label>
                      <p className="text-gray-500">
                        Receive notifications for new articles in starred feeds
                      </p>
                    </div>
                  </div>

                  {settings.notificationsEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check Interval (minutes)
                      </label>
                      <input
                        type="number"
                        name="notificationInterval"
                        value={settings.notificationInterval}
                        onChange={handleChange}
                        min="1"
                        max="60"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  )}

                  {settings.notificationsEnabled && <NotificationTest />}
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
