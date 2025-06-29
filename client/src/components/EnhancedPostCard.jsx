import React, { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import PostSummarizer from "./PostSummarizer";

function EnhancedPostCard({ post, formatDate }) {
  const [showSummary, setShowSummary] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(null);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(true);
  const [summaryLength, setSummaryLength] = useState("medium");

  useEffect(() => {
    const storedSettings = localStorage.getItem("userSettings");
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setAiSummaryEnabled(parsedSettings.enableAISummary !== false);
        if (parsedSettings.summaryLength) {
          setSummaryLength(parsedSettings.summaryLength);
        }
      } catch (e) {
        console.error("Failed to parse stored settings", e);
      }
    }
  }, []);

  const formatPostDate =
    formatDate ||
    ((dateString) => {
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
    });

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="px-6 py-5">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {post.title}
        </h3>

        {post.published_at && (
          <p className="text-sm text-gray-500 mb-3">
            Published: {formatPostDate(post.published_at)}
          </p>
        )}

        {post.description && (
          <div className="prose max-w-none text-gray-700 mb-4">
            <p>{post.description}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex space-x-2">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Read Full Post
              <svg
                className="ml-2 -mr-1 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            {aiSummaryEnabled && (
              <button
                onClick={() => setShowSummary(!showSummary)}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${
                  showSummary
                    ? "bg-gray-100 border-gray-300 text-gray-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {showSummary ? "Hide Summary" : "AI Summary"}
              </button>
            )}
          </div>
        </div>

        {showSummary && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            {expandedSummary ? (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  AI Summary:
                </h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {expandedSummary}
                </div>
              </div>
            ) : (
              <PostSummarizer
                postId={post.id}
                postContent={post.description || post.title}
                setExpandedSummary={setExpandedSummary}
                summaryLength={summaryLength}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedPostCard;
