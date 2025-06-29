# RSS Aggregator

A modern web application for aggregating and managing RSS feeds, built with React, Tailwind CSS, and a RESTful backend API.

## Features

- **User Authentication**: Secure signup and login functionality
- **Feed Management**: Add, organize, and categorize RSS feeds
- **Article Viewing**: Read articles from your favorite sources in one place
- **Responsive Design**: Beautiful UI that works on desktop and mobile devices
- **AI Summarization**: ML-powered content summarization for quick reading
- **Customizable Settings**: Control post display, theme, and AI features

## Tech Stack

- **Frontend**:
  - React
  - React Router for navigation
  - Tailwind CSS for styling
  - Axios for API requests
- **Backend**:
  - RESTful API (running on localhost:8080)
  - JWT Authentication

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The app will be available at http://localhost:5173

## API Endpoints

The application interacts with the following API endpoints:

- **Authentication**

  - `POST /v1/users` - Register a new user
  - `POST /v1/login` - Authenticate and receive JWT token
  - `GET /v1/users` - Get current user information

- **Feeds**

  - `GET /v1/feeds` - Get all available feeds
  - `POST /v1/feeds` - Add a new feed to the system

- **Feed Follows**

  - `GET /v1/feed_follows` - Get all feeds followed by the user
  - `POST /v1/feed_follows` - Follow a feed
  - `DELETE /v1/feed_follows/{feedFollowID}` - Unfollow a feed

- **Posts**
  - `GET /v1/posts` - Get posts for the authenticated user from followed feeds

## Future Enhancements

- LLM-based article summarization
- Content recommendation engine
- Topic categorization using machine learning
- Mobile application
- Offline reading capabilities
