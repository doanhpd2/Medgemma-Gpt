// src/App.js
import axios from "./utils/axiosConfig";
import { useEffect, useState, useCallback, useRef, useContext, useMemo } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Main from "./pages/Main";
import Chat from "./pages/Chat";
import View from "./pages/View";
import Realtime from "./pages/Realtime";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Toast from "./components/Toast";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ConversationsProvider, ConversationsContext } from "./contexts/ConversationsContext";
import logo from "./logo.png";

function App() {
  const [modelsData, setModelsData] = useState(null);
  const API_BASE = process.env.REACT_APP_FASTAPI_URL || "";

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setModelsData({ models: [] });
    }, 5000);

    const fetchModels = async () => {
      try {
        const modelsResponse = await axios.get(
          `${API_BASE}/models`,
          { withCredentials: true }
        );
        setModelsData(modelsResponse.data);
      } catch (error) {
        console.error("Failed to fetch models:", error);
        setModelsData({ models: [] });
      } finally {
        clearTimeout(timeoutId);
      }
    };
    fetchModels();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [API_BASE]);

  if (modelsData === null) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <Router>
      <SettingsProvider modelsData={modelsData}>
        <ConversationsProvider>
          <AppContent />
        </ConversationsProvider>
      </SettingsProvider>
    </Router>
  );
}

function AppContent() {
  // Force login bypass for development
  const [isLoggedIn] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const location = useLocation();

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="app">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isAboutOpen={isAboutOpen}
        setIsAboutOpen={setIsAboutOpen}
        isUploading={isUploading}
      />
      <div className="main">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Main isTouch={false} />} />
            <Route path="/chat/:conversation_id" element={<Chat isTouch={false} chatMessageRef={{ current: null }} />} />
            <Route path="/view/:conversation_id" element={<View />} />
            <Route path="/realtime" element={<Realtime />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <Toast message={toastMessage} show={showToast} setShow={setShowToast} />
    </div>
  );
}

export default App;