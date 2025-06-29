import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import AddFeed from "./pages/AddFeed";
import LandingPage from "./pages/LandingPage";
import FeedDetail from "./pages/FeedDetail";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return element;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<Dashboard />} />}
        />
        <Route
          path="/add-feed"
          element={<ProtectedRoute element={<AddFeed />} />}
        />
        <Route
          path="/feed/:feedId"
          element={<ProtectedRoute element={<FeedDetail />} />}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute element={<UserProfile />} />}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute element={<Settings />} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
