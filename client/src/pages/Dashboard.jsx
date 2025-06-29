import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import Navigation from "../components/Navigation";
import SearchBar from "../components/SearchBar";
import MessageBanner from "../components/MessageBanner";
import EnhancedPostCard from "../components/EnhancedPostCard";
import StarButton from "../components/StarButton";
import {
  requestNotificationPermission,
  startNotificationService,
} from "../utils/notifications";

function Dashboard() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get("tab");

  const navigate = useNavigate();

  const [userSettings, setUserSettings] = useState({
    postsPerPage: 5,
    defaultTab: "feeds",
    theme: "light",
    autoRefresh: false,
    refreshInterval: 5,
    notificationsEnabled: true,
    notificationInterval: 5,
  });

  const [feeds, setFeeds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState(tabParam ? tabParam : "feeds");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(5);
  const [totalPosts, setTotalPosts] = useState(0);
  const [allPosts, setAllPosts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filteredFeeds, setFilteredFeeds] = useState([]);

  useEffect(() => {
    const storedSettings = localStorage.getItem("userSettings");
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setUserSettings(parsedSettings);
        setPostsPerPage(parsedSettings.postsPerPage || 5);
        if (!tabParam) {
          setActiveTab(parsedSettings.defaultTab || "feeds");
        }
      } catch (e) {
        console.error("Failed to parse stored settings", e);
      }
    }
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/dashboard${tab === "posts" ? "?tab=posts" : ""}`);
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      if (userSettings.notificationsEnabled) {
        const permission = await requestNotificationPermission();
        if (permission.granted) {
          const stopService = startNotificationService(
            userSettings.notificationInterval || 5
          );
          return () => stopService();
        }
      }
    };

    initializeNotifications();
  }, [userSettings.notificationsEnabled, userSettings.notificationInterval]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [feedsResponse, postsResponse, starredResponse] = await Promise.all(
        [
          api.get("/feeds"),
          api.get("/posts"),
          api.get("/starred-feeds").catch(() => ({ data: [] })),
        ]
      );

      const fetchedFeeds = feedsResponse.data || [];
      const fetchedPosts = postsResponse.data || [];
      const starredFeedIds = (starredResponse.data || []).map(
        (feed) => feed.id
      );

      const feedsWithStarStatus = fetchedFeeds.map((feed) => ({
        ...feed,
        starred: starredFeedIds.includes(feed.id),
      }));

      setFeeds(feedsWithStarStatus);
      setFilteredFeeds(feedsWithStarStatus);

      setAllPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
      setTotalPosts(fetchedPosts.length);

      const indexOfLastPost = currentPage * postsPerPage;
      const indexOfFirstPost = indexOfLastPost - postsPerPage;
      setPosts(fetchedPosts.slice(indexOfFirstPost, indexOfLastPost));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load data. Please try again later."
      );
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate, currentPage, postsPerPage]);


  useEffect(() => {
    if (!userSettings.autoRefresh) return;

    const refreshInterval = userSettings.refreshInterval * 60 * 1000;
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing data...");
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [userSettings.autoRefresh, userSettings.refreshInterval]);

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (value.trim() === "") {
      setFilteredFeeds(feeds);
      setFilteredPosts(allPosts);
      setPosts(allPosts.slice(0, postsPerPage));
    } else {
      const lowercaseTerm = value.toLowerCase();

      const matchingFeeds = feeds.filter(
        (feed) =>
          (feed.name && feed.name.toLowerCase().includes(lowercaseTerm)) ||
          feed.url.toLowerCase().includes(lowercaseTerm)
      );
      setFilteredFeeds(matchingFeeds);

      const matchingPosts = allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(lowercaseTerm) ||
          (post.description &&
            post.description.toLowerCase().includes(lowercaseTerm))
      );
      setFilteredPosts(matchingPosts);
      setPosts(matchingPosts.slice(0, postsPerPage));
    }
  };

  const handleStarToggle = (isStarred, feedId) => {
    const updatedFeeds = feeds.map((feed) =>
      feed.id === feedId ? { ...feed, starred: isStarred } : feed
    );

    setFeeds(updatedFeeds);

    const updatedFilteredFeeds = filteredFeeds.map((feed) =>
      feed.id === feedId ? { ...feed, starred: isStarred } : feed
    );

    setFilteredFeeds(updatedFilteredFeeds);

    setMessage({
      type: "success",
      text: isStarred
        ? "Feed starred! You'll receive notifications for new articles."
        : "Feed unstarred. Notifications disabled for this feed.",
    });

    setTimeout(() => setMessage(null), 3000);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    const indexOfLastPost = pageNumber * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    setPosts(filteredPosts.slice(indexOfFirstPost, indexOfLastPost));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation isLoggedIn={true} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mb-5">
          {" "}
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange("feeds")}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "feeds"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Feeds
            </button>
            <button
              onClick={() => handleTabChange("posts")}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "posts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Latest Posts
            </button>
          </nav>
        </div>{" "}
        <div className="mb-6">
          <SearchBar
            placeholder={
              activeTab === "feeds"
                ? "Search feeds by name or URL..."
                : "Search posts by title or content..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
          />
        </div>
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
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
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
              {error}
            </div>
          ) : message ? (
            <div
              className={`p-4 rounded-md mb-6 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-blue-50 text-blue-800"
              }`}
            >
              {message.text}
              <button
                onClick={() => setMessage(null)}
                className="float-right text-sm opacity-75 hover:opacity-100"
              >
                &times;
              </button>
            </div>
          ) : (
            <>
              {activeTab === "feeds" && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Your RSS Feeds</h2>
                    <button
                      onClick={() => navigate("/add-feed")}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add New Feed
                    </button>
                  </div>{" "}
                  {filteredFeeds.length === 0 ? (
                    <div className="text-center py-10">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                      </svg>
                      <p className="mt-2 text-gray-500">
                        {searchTerm
                          ? "No feeds found matching your search."
                          : "No feeds yet. Add your first RSS feed!"}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilteredFeeds(feeds);
                          }}
                          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredFeeds.map((feed) => (
                        <div
                          key={feed.id}
                          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
                        >
                          {" "}
                          <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {feed.name || "Untitled Feed"}
                              </h3>
                              <StarButton
                                feedId={feed.id}
                                initialStarred={feed.starred}
                                onStarChange={handleStarToggle}
                              />
                            </div>
                            <p className="mt-1 text-sm text-gray-500 truncate">
                              {feed.url}
                            </p>
                            <div className="mt-4 flex justify-end">
                              <a
                                href={`/feed/${feed.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                              >
                                View posts{" "}
                                <span aria-hidden="true">&rarr;</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "posts" && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-6">Latest Posts</h2>
                  {posts.length === 0 ? (
                    <div className="text-center py-10">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                      <p className="mt-2 text-gray-500">
                        {searchTerm
                          ? "No posts found matching your search."
                          : "No posts yet. Follow some feeds to see posts here!"}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilteredPosts(allPosts);
                            const indexOfLastPost = currentPage * postsPerPage;
                            const indexOfFirstPost =
                              indexOfLastPost - postsPerPage;
                            setPosts(
                              allPosts.slice(indexOfFirstPost, indexOfLastPost)
                            );
                            setTotalPosts(allPosts.length);
                          }}
                          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Clear search
                        </button>
                      )}{" "}
                      {!searchTerm &&
                        feeds.length > 0 &&
                        allPosts.length === 0 && (
                          <MessageBanner
                            message="You've added feeds, but the server may still be fetching content. The feed scraper runs periodically to collect new posts. Check back soon!"
                            type="info"
                            duration={0} 
                          />
                        )}
                    </div>
                  ) : (
                    <>
                      {" "}
                      <div className="space-y-8">
                        {posts.map((post) => (
                          <div key={post.id} className="mb-4">
                            <div className="flex items-center mb-2">
                              <span className="text-sm text-gray-500">
                                {post.feed_name || "Unknown Feed"}
                              </span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-sm text-gray-500">
                                {formatDate(
                                  post.published_at || post.created_at
                                )}
                              </span>
                            </div>

                            <EnhancedPostCard
                              post={post}
                              formatDate={formatDate}
                            />
                          </div>
                        ))}
                      </div>
                      {totalPosts > postsPerPage && (
                        <div className="flex items-center justify-center mt-8 space-x-1">
                          <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md ${
                              currentPage === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            Previous
                          </button>

                          {[...Array(Math.ceil(totalPosts / postsPerPage))].map(
                            (_, i) => (
                              <button
                                key={i}
                                onClick={() => paginate(i + 1)}
                                className={`px-3 py-1 rounded-md ${
                                  currentPage === i + 1
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {i + 1}
                              </button>
                            )
                          )}

                          <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={
                              currentPage ===
                              Math.ceil(totalPosts / postsPerPage)
                            }
                            className={`px-3 py-1 rounded-md ${
                              currentPage ===
                              Math.ceil(totalPosts / postsPerPage)
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
