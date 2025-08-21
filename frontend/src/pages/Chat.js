import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useFileUpload } from "../utils/useFileUpload";
import Message from "../components/Message";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import InputContainer from "../components/InputContainer";
import "../styles/Common.css";

function Chat({ isTouch, chatMessageRef }) {
  const PROXY_BASE = '/proxy/3000/api';
  const { conversation_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrollOnSend, setScrollOnSend] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { uploadedFiles, setUploadedFiles, processFiles, removeFile } = useFileUpload([]);

  const messagesEndRef = useRef(null);

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const updateAssistantMessage = useCallback((message) => {
    setMessages((prev) => [...prev, { role: "assistant", content: message, id: generateMessageId() }]);
  }, []);

  const setErrorMessage = useCallback((message) => {
    setMessages((prev) => [...prev, { role: "error", content: message, id: generateMessageId() }]);
  }, []);

  const deleteMessages = useCallback(
    (startIndex) => setMessages((prev) => prev.slice(0, startIndex)),
    []
  );

  const sendMessage = useCallback(
    async (message, files = uploadedFiles) => {
      if (!message.trim()) {
        setToastMessage("Vui lòng nhập nội dung.");
        setShowToast(true);
        return;
      }

      const contentParts = [{ type: "text", text: message }, ...files];
      const userMessage = { role: "user", content: contentParts, id: generateMessageId() };
      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setUploadedFiles([]);
      setIsLoading(true);
      setScrollOnSend(true);

      try {
        const result = await fetch(`${PROXY_BASE}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: message }),
        });

        if (!result.ok) throw new Error(`Server error: ${result.status}`);
        const data = await result.json();

        const assistantText = data.response || data.generated_text;
        updateAssistantMessage(assistantText);

      } catch (err) {
        setErrorMessage("Lỗi gửi tin nhắn: " + (err.message || "Không thể gửi yêu cầu"));
      } finally {
        setIsLoading(false);
      }
    },
    [uploadedFiles, setUploadedFiles, updateAssistantMessage, setErrorMessage]
  );

  const handleDelete = useCallback((idx) => {
    setDeleteIndex(idx);
    setConfirmModal(true);
  }, []);

  useEffect(() => {
    if (scrollOnSend) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
      setScrollOnSend(false);
    }
  }, [messages, scrollOnSend]);

  return (
    <div className="container">
      <div className="chat-messages" ref={chatMessageRef}>
        {useMemo(
          () =>
            messages.map((msg, idx) => (
              <Message
                key={msg.id}
                messageIndex={idx}
                role={msg.role}
                content={msg.content}
                onDelete={handleDelete}
                isTouch={isTouch}
                isLoading={isLoading}
              />
            )),
          [messages, handleDelete, isTouch, isLoading]
        )}

        <AnimatePresence>
          {confirmModal && (
            <Modal
              message="Bạn có chắc chắn muốn xóa tin nhắn không?"
              onConfirm={() => {
                deleteMessages(deleteIndex);
                setDeleteIndex(null);
                setConfirmModal(false);
              }}
              onCancel={() => {
                setDeleteIndex(null);
                setConfirmModal(false);
              }}
            />
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <InputContainer
        isTouch={isTouch}
        placeholder="Nhập trả lời"
        inputText={inputText}
        setInputText={setInputText}
        isLoading={isLoading}
        onSend={sendMessage}
        uploadedFiles={uploadedFiles}
        processFiles={processFiles}
        removeFile={removeFile}
        uploadingFiles={uploadedFiles.some((f) => !f.content)}
      />

      <Toast type="error" message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}

export default Chat;
