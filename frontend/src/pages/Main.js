// src/pages/Main.js
import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { IoImageOutline } from "react-icons/io5";
import { SettingsContext } from "../contexts/SettingsContext";
import { ConversationsContext } from "../contexts/ConversationsContext";
import { motion, AnimatePresence } from "framer-motion";
import { useFileUpload } from "../utils/useFileUpload";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import InputContainer from "../components/InputContainer";
import "../styles/Common.css";

function Main({ isTouch }) {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);

  const abortControllerRef = useRef(null);

  const { uploadedFiles, processFiles, removeFile } = useFileUpload([]);

  const {
    modelsData,
    defaultModel,
    model,
    updateModel,
    setIsImage,
    canReadImage,
  } = useContext(SettingsContext);

  const { addConversation } = useContext(ConversationsContext);

  const models = modelsData.models || [];
  const uploadingFiles = uploadedFiles.some((file) => !file.content);

  // Khởi tạo model mặc định
  useEffect(() => {
    updateModel(defaultModel || models[0]);
    setIsImage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý gửi message -> tạo conversation trực tiếp đến MedGemma
  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim() || uploadingFiles) {
        setToastMessage("Vui lòng nhập nội dung hoặc đang upload file.");
        setShowToast(true);
        return;
      }

      try {
        setIsLoading(true);

        const selectedModel = models.find((m) => m.model_name === model) || models[0];
        if (!selectedModel) throw new Error("Model không hợp lệ.");

        // Tạo conversation ID local
        const conversation_id = `conv_${Date.now()}`;

        // Thêm conversation vào context (dùng local)
        const newConversation = {
          conversation_id,
          alias: "Cuộc trò chuyện mới",
          starred: false,
          starred_at: null,
          created_at: Date.now(),
          isLoading: true,
        };
        addConversation(newConversation);

        // Chuyển sang Chat.js với conversation_id và initialMessage
        navigate(`/chat/${conversation_id}`, {
          state: {
            initialMessage: message,
            initialFiles: uploadedFiles,
          },
          replace: false,
        });
      } catch (error) {
        setToastMessage("Không thể bắt đầu cuộc trò chuyện mới.");
        setShowToast(true);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [models, model, navigate, uploadedFiles, uploadingFiles, addConversation]
  );

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const hasUploadedImage = uploadedFiles.some((file) => {
      return (
        (file.type && (file.type === "image" || file.type.startsWith("image/"))) ||
        /\.(jpe?g|png|gif|bmp|webp)$/i.test(file.name)
      );
    });
    setIsImage(hasUploadedImage);
  }, [setIsImage, uploadedFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      setIsDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files, (errorMessage) => {
        setToastMessage(errorMessage);
        setShowToast(true);
      }, canReadImage);
    },
    [processFiles, canReadImage]
  );

  return (
    <div
      className="container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="welcome-container">
        <motion.div
          className="welcome-message"
          initial={{ y: 5 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Tôi có thể giúp gì cho bạn?
        </motion.div>
      </div>

      <InputContainer
        isTouch={isTouch}
        placeholder="Nhập nội dung"
        inputText={inputText}
        setInputText={setInputText}
        isLoading={isLoading}
        onSend={sendMessage}
        onCancel={cancelRequest}
        uploadedFiles={uploadedFiles}
        processFiles={processFiles}
        removeFile={removeFile}
        uploadingFiles={uploadingFiles}
      />

      <AnimatePresence>
        {isDragActive && (
          <motion.div
            key="drag-overlay"
            className="drag-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <div className="drag-container">
              <IoImageOutline style={{ fontSize: "40px" }} />
              <div className="drag-text">Thêm tệp tại đây</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast
        type="error"
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <AnimatePresence>
        {confirmModal && (
          <Modal
            message="Thông báo quan trọng"
            onConfirm={() => setConfirmModal(false)}
            showCancelButton={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Main;
