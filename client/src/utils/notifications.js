// src/utils/notifications.js
import api from "./api";

// Check if browser supports notifications
export const isNotificationsSupported = () => {
  return "Notification" in window;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationsSupported()) {
    return { granted: false, reason: "not_supported" };
  }

  try {
    const permission = await Notification.requestPermission();
    return { granted: permission === "granted", reason: permission };
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return { granted: false, reason: "error" };
  }
};

// Show a notification
export const showNotification = (title, options = {}) => {
  if (!isNotificationsSupported() || Notification.permission !== "granted") {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: "/notification-icon.png",
      badge: "/notification-badge.png",
      ...options,
    });

    // Add click handler
    notification.onclick =
      options.onClick ||
      (() => {
        window.focus();
        notification.close();
      });

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
};

// Create a notification for a new article
export const notifyNewArticle = (feedName, article) => {
  return showNotification(`New article in ${feedName}`, {
    body: article.title,
    data: { articleUrl: article.url, feedId: article.feed_id },
    onClick: function () {
      window.open(article.url, "_blank");
      this.close();
    },
  });
};

// Setup periodic check for new articles in starred feeds
let checkInterval = null;

export const startNotificationService = (intervalMinutes = 5) => {
  if (checkInterval) clearInterval(checkInterval);

  // Convert minutes to milliseconds
  const intervalMs = intervalMinutes * 60 * 1000;

  // Initial check
  checkForNewArticles();

  // Setup interval
  checkInterval = setInterval(checkForNewArticles, intervalMs);

  return () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };
};

// Stop notification service
export const stopNotificationService = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

// Check for new articles
let lastCheckedTime = Date.now();
let knownArticleIds = new Set();

export const checkForNewArticles = async () => {
  try {
    if (Notification.permission !== "granted") return;

    // Get starred feeds
    const starredFeedsResp = await api.get("/starred-feeds");
    const starredFeeds = starredFeedsResp.data || [];

    if (starredFeeds.length === 0) return;

    // Get new articles
    const now = Date.now();
    const postsResp = await api.get("/posts");
    const posts = postsResp.data || [];

    // Filter by starred feeds and new articles since last check
    const newArticles = posts.filter((article) => {
      const isStarredFeed = starredFeeds.some(
        (feed) => feed.id === article.feed_id
      );
      const isNew = !knownArticleIds.has(article.id);
      const publishedTime = new Date(
        article.published_at || article.created_at
      ).getTime();
      const isRecent = publishedTime > lastCheckedTime;

      if (isNew) knownArticleIds.add(article.id);

      return isStarredFeed && isNew && isRecent;
    });

    // Update last checked time
    lastCheckedTime = now;

    // Show notifications for new articles
    newArticles.forEach((article) => {
      const feed = starredFeeds.find((f) => f.id === article.feed_id);
      if (feed) {
        notifyNewArticle(feed.name || "Starred feed", article);
      }
    });

    return newArticles;
  } catch (error) {
    console.error("Error checking for new articles:", error);
    return [];
  }
};

export default {
  isNotificationsSupported,
  requestNotificationPermission,
  showNotification,
  notifyNewArticle,
  startNotificationService,
  stopNotificationService,
  checkForNewArticles,
};
