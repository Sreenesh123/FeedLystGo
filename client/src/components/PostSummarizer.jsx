import React, { useState } from "react";
import api from "../utils/api";

function PostSummarizer({
  postId,
  postContent,
  setExpandedSummary,
  summaryLength = "medium",
}) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);

    const getSummaryLengthParams = (length) => {
      switch (length) {
        case "short":
          return { maxLength: 100, minLength: 30 };
        case "long":
          return { maxLength: 250, minLength: 100 };
        case "medium":
        default:
          return { maxLength: 150, minLength: 50 };
      }
    };

    const lengthParams = getSummaryLengthParams(summaryLength);

    try {
      const response = await api.post("/summarize", {
        post_id: postId,
        content: postContent,
        max_length: lengthParams.maxLength,
        min_length: lengthParams.minLength,
      });

      setSummary(response.data.summary);
      setExpandedSummary(response.data.summary);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {!summary && !isLoading && (
        <button
          onClick={handleSummarize}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          AI Summarize
        </button>
      )}

      {isLoading && (
        <div className="flex items-center text-sm text-gray-500">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500"
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
          Generating summary...
        </div>
      )}

      {error && <div className="text-sm text-red-500 mt-1">{error}</div>}

      {summary && (
        <div className="mt-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            AI Summary:
          </h4>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}

export default PostSummarizer;
