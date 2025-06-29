// src/utils/summarizer.js
import api from "./api";

/**
 * Utility for ML-based text summarization
 */
export const summarizeText = async (text, options = {}) => {
  try {
    if (!text || text.trim().length < 50) {
      return {
        summary: "Text too short for summarization",
        success: false,
      };
    }

    // Call the backend API for summarization
    const response = await api.post("/summarize", {
      content: text,
      max_length: options.maxLength || 150,
      min_length: options.minLength || 50,
    });

    return {
      summary: response.data.summary,
      success: true,
    };
  } catch (error) {
    console.error("Summarization error:", error);
    return {
      summary: null,
      error: error.response?.data?.message || "Failed to generate summary",
      success: false,
    };
  }
};

/**
 * Process the HTML content to extract meaningful text for summarization
 */
export const prepareTextForSummarization = (htmlContent) => {
  // Create a temporary DOM element
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  // Remove script and style elements
  const scripts = tempDiv.querySelectorAll("script, style");
  scripts.forEach((script) => script.remove());

  // Get the text content
  let text = tempDiv.textContent || tempDiv.innerText;

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
};

export default {
  summarizeText,
  prepareTextForSummarization,
};
