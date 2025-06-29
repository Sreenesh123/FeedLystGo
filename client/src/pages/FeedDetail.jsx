import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import Navigation from "../components/Navigation";
import FeedStatus from "../components/FeedStatus";
import EnhancedPostCard from "../components/EnhancedPostCard";
import StarButton from "../components/StarButton";
import { format, formatDistanceToNow } from "date-fns";

function FeedDetail() {
  const { feedId } = useParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [feedInfo, setFeedInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(5);
  const [totalPosts, setTotalPosts] = useState(0);

  const [feedFollowId, setFeedFollowId] = useState(null);
  const [isStarred, setIsStarred] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching feed data for ID:", feedId);
        const feedsResponse = await api.get("/feeds");
        const feed = feedsResponse.data.find((f) => f.id === feedId);
        if (feed) {
          setFeedInfo(feed);
        }

        const feedFollowsResponse = await api.get("/feed_follows");

        const starredResponse = await api
          .get("/starred-feeds")
          .catch(() => ({ data: [] }));
        const isStarred = starredResponse.data?.some((f) => f.id === feedId);
        setIsStarred(isStarred);

        const followEntry = feedFollowsResponse.data.find(
          (follow) => follow.feed_id === feedId
        );
        if (followEntry) {
          setFeedFollowId(followEntry.id);
        }

        const postsResponse = await api.get(`/posts?feed_id=${feedId}`);
        let feedPosts = postsResponse.data;
        if (!feedPosts || feedPosts.length === 0 || !Array.isArray(feedPosts)) {
          console.log(
            "No posts returned or invalid response format, checking complete posts list"
          );
          const allPostsResponse = await api.get("/posts");

          feedPosts = allPostsResponse.data.filter(
            (post) => post.feed_id === feedId
          );
          console.log(
            `Filtered ${allPostsResponse.data.length} total posts to ${feedPosts.length} for feed ${feedId}`
          );
        }

        setAllPosts(feedPosts || []);
        setTotalPosts(feedPosts.length);
        const indexOfLastPost = currentPage * postsPerPage;
        const indexOfFirstPost = indexOfLastPost - postsPerPage;
        setPosts(feedPosts.slice(indexOfFirstPost, indexOfLastPost));

        setError(null);
      } catch (err) {
        console.error("Error fetching feed data:", err);
        setError("Failed to load feed data. Please try again later.");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    if (feedId) {
      fetchData();
    }
  }, [feedId, navigate, currentPage, postsPerPage]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    const indexOfLastPost = pageNumber * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    setPosts(allPosts.slice(indexOfFirstPost, indexOfLastPost));
  };

  const handleUnfollow = async () => {
    if (!feedFollowId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await api.delete(`/feed_follows/${feedFollowId}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error unfollowing feed:", err);
      setError("Failed to unfollow feed. Please try again.");
    }
  };

  const handleStarToggle = async (starred) => {
    try {
      if (starred) {
        await api.post("/starred-feeds", { feed_id: feedId });
        setMessage({
          type: "success",
          text: "Feed starred! You'll receive notifications for new articles.",
        });
      } else {
        await api.delete(`/starred-feeds/${feedId}`);
        setMessage({
          type: "success",
          text: "Feed unstarred. Notifications disabled for this feed.",
        });
      }

      setIsStarred(starred);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Error toggling star status:", err);
      setMessage({
        type: "error",
        text: "Failed to update star status. Please try again.",
      });
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      return `${format(date, "PPP p")} (${formatDistanceToNow(date, {
        addSuffix: true,
      })})`;
    } catch (err) {
      console.error("Date formatting error:", err);
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation isLoggedIn={true} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {" "}
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <svg
                className="animate-spin h-10 w-10 text-blue-600"
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
              {" "}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                {" "}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {" "}
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {feedInfo?.name || "Feed Posts"}
                      </h2>
                      <StarButton
                        feedId={feedId}
                        initialStarred={isStarred}
                        onStarChange={(starred) => handleStarToggle(starred)}
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {feedInfo?.url || ""}
                    </p>
                    <FeedStatus feed={feedInfo} />
                    <button
                      onClick={() => {
                        setLoading(true);
                        api
                          .get(`/posts?feed_id=${feedId}`)
                          .then((res) => {
                            const refreshedPosts = res.data.filter(
                              (post) => post.feed_id === feedId
                            );
                            setAllPosts(refreshedPosts || []);
                            setTotalPosts(refreshedPosts.length);
                            setPosts(refreshedPosts.slice(0, postsPerPage));
                            setCurrentPage(1);
                          })
                          .catch((err) =>
                            console.error("Error refreshing posts:", err)
                          )
                          .finally(() => setLoading(false));
                      }}
                      className="mt-2 text-xs flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        ></path>
                      </svg>
                      Check for new posts
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md shadow-sm text-gray-700 bg-gray-100 hover:bg-gray-200"
                    >
                      Back to Feeds
                    </button>
                    {feedFollowId && (
                      <button
                        onClick={handleUnfollow}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                      >
                        Unfollow Feed
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {" "}
                {posts.length === 0 ? (
                  <div className="bg-white shadow rounded-lg p-6 text-center">
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
                      No posts found for this feed.
                    </p>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg mx-auto max-w-md">
                      <h4 className="text-sm font-medium text-blue-800">
                        Where are the posts?
                      </h4>
                      <p className="mt-1 text-xs text-blue-700">
                        This feed has been added, but the server may still be
                        fetching content. RSS content is fetched periodically by
                        the backend scraper. Check back soon, or refresh the
                        page to see if new posts have been collected.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {posts.map((post) => (
                      <EnhancedPostCard
                        key={post.id}
                        post={post}
                        formatDate={formatDate}
                      />
                    ))}
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
                            currentPage === Math.ceil(totalPosts / postsPerPage)
                          }
                          className={`px-3 py-1 rounded-md ${
                            currentPage === Math.ceil(totalPosts / postsPerPage)
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedDetail;
