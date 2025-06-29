import React, { useState } from "react";
import {
  showNotification,
  requestNotificationPermission,
} from "../utils/notifications";

function NotificationTest() {
  const [permissionStatus, setPermissionStatus] = useState("unknown");
  const [notificationSent, setNotificationSent] = useState(false);

  const checkPermission = async () => {
    const result = await requestNotificationPermission();
    setPermissionStatus(result.granted ? "granted" : result.reason);
  };

  const sendTestNotification = () => {
    const notification = showNotification("RSS Aggregator Test", {
      body: "This is a test notification. If you see this, notifications are working!",
      icon: "/vite.svg",
      data: { type: "test", time: new Date().toISOString() },
      onClick: function () {
        console.log("Notification clicked");
        window.focus();
        this.close();
      },
    });

    if (notification) {
      setNotificationSent(true);
      setTimeout(() => setNotificationSent(false), 3000);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Test Notifications
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Use these controls to test if browser notifications are working
        correctly.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={checkPermission}
          className="px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Check Permission
        </button>

        <button
          onClick={sendTestNotification}
          className="px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          disabled={permissionStatus !== "granted"}
        >
          Send Test Notification
        </button>
      </div>

      {permissionStatus !== "unknown" && (
        <div
          className={`mt-3 text-sm ${
            permissionStatus === "granted" ? "text-green-600" : "text-red-600"
          }`}
        >
          Permission status: {permissionStatus}
        </div>
      )}

      {notificationSent && (
        <div className="mt-3 text-sm text-green-600">
          ✓ Notification sent! Check your system notifications.
        </div>
      )}
    </div>
  );
}

export default NotificationTest;
