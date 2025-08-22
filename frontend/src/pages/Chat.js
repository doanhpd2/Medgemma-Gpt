import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFileUpload } from "../utils/useFileUpload";
import Message from "../components/Message";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import InputContainer from "../components/InputContainer";
import "../styles/Common.css";
import { useParams, useLocation } from "react-router-dom";

function Chat({ isTouch, chatMessageRef }) {
  const PROXY_BASE = '/proxy/3000/api';
  const { conversation_id } = useParams();
  
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrollOnSend, setScrollOnSend] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { uploadedFiles, setUploadedFiles, processFiles, removeFile } = useFileUpload([]);
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const initialMessage = location.state?.initialMessage;
  const initialFiles = location.state?.initialFiles || [];

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // --- State messages ---
  const [messages, setMessages] = useState([]);

  // --- Load messages khi mount và khi conversation_id thay đổi ---
  useEffect(() => {
    const saved = localStorage.getItem(`chat_${conversation_id}`);
    setMessages(saved ? JSON.parse(saved) : []);
  }, [conversation_id]);

  // --- Đồng bộ messages lên localStorage ---
  useEffect(() => {
    localStorage.setItem(`chat_${conversation_id}`, JSON.stringify(messages));
  }, [messages, conversation_id]);

  const updateAssistantMessage = useCallback((message) => {
    setMessages((prev) => [...prev, { role: "assistant", content: message, id: generateMessageId() }]);
  }, []);

  const setErrorMessage = useCallback((message) => {
    setMessages((prev) => [...prev, { role: "error", content: message, id: generateMessageId() }]);
  }, []);

  const deleteMessages = useCallback(
    (startIndex) => {
      setMessages((prev) => {
        const newMessages = prev.slice(0, startIndex);
        if (newMessages.length === 0) {
          localStorage.removeItem(`chat_${conversation_id}`);
        }
        return newMessages;
      });
    },
    [conversation_id]
  );

  const sendMessage = useCallback(
    async (message, files = uploadedFiles) => {
      if (!message.trim() && files.length === 0) {
        setToastMessage("Vui lòng nhập nội dung hoặc chọn ảnh.");
        setShowToast(true);
        return;
      }

      setInputText("");
      setUploadedFiles([]);
      setIsLoading(true);
      setScrollOnSend(true);

      try {
        // Upload images
        const imagePaths = [];
        for (const fileObj of files) {
          if (fileObj.file instanceof File) {
            const formData = new FormData();
            formData.append("image", fileObj.file);
            const uploadRes = await fetch(`${PROXY_BASE}/upload`, {
              method: "POST",
              body: formData,
            });
            if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
            const { path } = await uploadRes.json();
            imagePaths.push(path);
          }
        }

        const imageParts = files.map((fileObj) => ({
          type: "image",
          content: fileObj.content || URL.createObjectURL(fileObj.file),
        }));

        const userMessage = {
          role: "user",
          content: [{ type: "text", text: message }, ...imageParts],
          id: generateMessageId(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Gửi prompt + image_paths tới server
        const result = await fetch(`${PROXY_BASE}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: message,
            image_paths: imagePaths,
          }),
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

  // Gửi tin nhắn đầu tiên nếu có
  useEffect(() => {
    if (initialMessage) {
      const sendInitialMessage = async () => {
        const files = initialFiles || [];
        setIsLoading(true);

        try {
          const imageParts = files.map((fileObj) => ({
            type: "image",
            content: fileObj.content || URL.createObjectURL(fileObj.file),
          }));
          const userMessage = {
            role: "user",
            content: [{ type: "text", text: initialMessage }, ...imageParts],
            id: `msg_${Date.now()}_init`,
          };
          setMessages((prev) => [...prev, userMessage]);

          const imagePaths = [];
          for (const fileObj of files) {
            if (fileObj.file instanceof File) {
              const formData = new FormData();
              formData.append("image", fileObj.file);
              const uploadRes = await fetch(`${PROXY_BASE}/upload`, { method: "POST", body: formData });
              const { path } = await uploadRes.json();
              imagePaths.push(path);
            }
          }

          const result = await fetch(`${PROXY_BASE}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: initialMessage, image_paths: imagePaths }),
          });
          const data = await result.json();
          const assistantText = data.response || data.generated_text;
          updateAssistantMessage(assistantText);

        } catch (err) {
          setErrorMessage("Lỗi gửi tin nhắn: " + (err.message || "Không thể gửi yêu cầu"));
        } finally {
          setIsLoading(false);
        }
      };

      sendInitialMessage();
    }
  }, [initialMessage, initialFiles, updateAssistantMessage, setErrorMessage]);

  // Scroll tự động
  useEffect(() => {
    if (scrollOnSend) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
      setScrollOnSend(false);
    }
  }, [messages, scrollOnSend]);

  const handleRemovePreview = useCallback((index) => {
    removeFile(index);
  }, [removeFile]);

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
