// Login.js
import axios from "../utils/axiosConfig";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Toast from "../components/Toast";
import "../styles/Auth.css";
import logo from "../logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('expired') === 'true') {
      setToastMessage("Please log in again.");
      setShowToast(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  async function handleLogin() {
    if (!email || !password) {
      setToastMessage("Please fill in all fields.");
      setShowToast(true);
      return;
    }

    if (!validateEmail(email)) {
      setToastMessage("Please enter a valid email address.");
      setShowToast(true);
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_FASTAPI_URL}/login`,
        { email, password },
        { withCredentials: true }
      );
      window.location.reload();
    } catch (error) {
      const detail = error.response?.data?.detail;
      setToastMessage(
        Array.isArray(detail)
          ? "Invalid input."
          : detail || "An unknown error has occurred."
      );
      setShowToast(true);
    }
  }

  return (
    <motion.div
      className="auth-container"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="auth-logo">
        <img src={logo} alt="DEVOCHAT" className="logo-image" />
      </div>
      <form className="auth-input-container" onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}>
        <input
          className="id field"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => {
            const value = e.target.value;
            if (/^[a-zA-Z0-9@._-]*$/.test(value)) {
              setEmail(value);
            }
          }}
          autoComplete="username"
        />
        <input
          className="password field"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => {
            const value = e.target.value;
            if (/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/.test(value)) {
              setPassword(value);
            }
          }}
          autoComplete="current-password"
        />
        <button className="continue field" type="submit">
          로그인
        </button>
      </form>
      <div className="footer">
        <p>Don't have an account?</p>
        <button className="route" onClick={() => navigate("/register")}>
          가입하기
        </button>
      </div>

      <Toast
        type="error"
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </motion.div>
  );
}

export default Login;