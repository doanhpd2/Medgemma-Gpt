// src/App.js
import { useState, useCallback } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toast from "./components/Toast";

import Main from "./pages/Main";
import Chat from "./pages/Chat";
import View from "./pages/View";
import Realtime from "./pages/Realtime";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MedGemmaTest from "./pages/MedGemmaTest";

import { SettingsProvider } from "./contexts/SettingsContext";
import { ConversationsProvider } from "./contexts/ConversationsContext";

function App() {
  // Hardcode models cho MedGemma
  const modelsData = {
    models: [
      {
        model_name: "MedGemma-4b-it",
        endpoint: "/generate",
        capabilities: { stream: true },
        in_billing: 0,
        out_billing: 0,
      },
    ],
  };

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const location = useLocation();

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

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
            <Route path="/medgemma-test" element={<MedGemmaTest />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <Toast message={toastMessage} show={showToast} setShow={setShowToast} />
    </div>
  );
}

export default App;
