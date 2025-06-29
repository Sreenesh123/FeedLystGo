import React from "react";
import { format, formatDistanceToNow } from "date-fns";

function FeedStatus({ feed }) {
  if (!feed || !feed.updated_at) {
    return null;
  }

  const lastUpdated = new Date(feed.updated_at);
  const lastFetched = feed.last_fetched_at
    ? new Date(feed.last_fetched_at)
    : null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-2">
      <h4 className="text-sm font-medium text-gray-700">Feed Information</h4>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Created:</span>{" "}
          {format(new Date(feed.created_at), "PPP")}
        </p>
        <p className="text-xs text-gray-600">
          <span className="font-medium">Last updated:</span>{" "}
          {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </p>
        {lastFetched && (
          <p className="text-xs text-gray-600">
            <span className="font-medium">Last fetched:</span>{" "}
            {formatDistanceToNow(lastFetched, { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
}

export default FeedStatus;
