// Register.js
import axios from "../utils/axiosConfig";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import "../styles/Auth.css";
import logo from "../logo.png";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  async function handleRegister() {
    if (!name || !email || !password) {
      setToastMessage("Please fill in all fields.");
      setShowToast(true);
      return;
    }

    if (!validateEmail(email)) {
      setToastMessage("Please enter a valid email address.");
      setShowToast(true);
      return;
    }

    if (password.length < 8 || password.length > 20) {
      setToastMessage("Password must be between 8 and 20 characters.");
      setShowToast(true);
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_FASTAPI_URL}/register`, { name, email, password });
      setConfirmModal(true);
    } catch (error) {
      const detail = error.response?.data?.detail;
      setToastMessage(
        Array.isArray(detail)
          ? "Invalid input."
          : detail || "An unknown error occurred."
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
        handleRegister();
      }}>
        <input 
          className="name field" 
          type="text" 
          placeholder="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <input 
          className="id field" 
          type="email" 
          placeholder="Email" 
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
          placeholder="Password" 
          value={password} 
          onChange={(e) => {
            const value = e.target.value;
            if (/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/.test(value)) {
              setPassword(value);
            }
          }}
          autoComplete="new-password"
        />
        <p className="info">*Password must be at least 8 characters long.</p>
        <button className="continue field" type="submit">Register</button>
      </form>
      <div className="footer">
        <p>Already have an account?</p>
        <button className="route" onClick={() => navigate("/login")}>Login</button>
      </div>

      <AnimatePresence>
        {confirmModal && (
          <Modal
            message="Registration successful! Redirecting to login page."
            onConfirm={() => {
              setConfirmModal(null);
              navigate("/login");
            }}
            showCancelButton={false}
          />
        )}
      </AnimatePresence>

      <Toast
        type="error"
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </motion.div>
  );
}

export default Register;
