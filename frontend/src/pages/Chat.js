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
        const imageParts = files.map((fileObj) => ({
          type: "image",
          content: fileObj.content,
        }));

        const userMessage = {
          role: "user",
          content: [{ type: "text", text: message }, ...imageParts],
          id: generateMessageId(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Thêm assistant rỗng trước
        const assistantId = generateMessageId();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "", id: assistantId },
        ]);

        const result = await fetch(`${PROXY_BASE}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: message,
            images: files.map((f) => f.content),
          }),
        });

        if (!result.body) throw new Error("Không nhận được stream từ server");

        const reader = result.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        const assistantTextRef = { current: "" };

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunk = decoder.decode(value);
          console.log("Frontend chunk:", chunk); // Log chunk nhận từ proxy
          chunk.split("\n").forEach((line) => {
            if (line.startsWith("data: ")) {
              const data = line.replace("data: ", "");
              if (data === "[DONE]") {
                setIsLoading(false);
                console.log("Frontend stream done");
              } else {
                try {
                  const obj = JSON.parse(data);
                  if (obj.token) {
                    assistantTextRef.current += obj.token;
                    console.log("Frontend token:", obj.token); // Log từng token
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantId
                          ? { ...msg, content: assistantTextRef.current }
                          : msg
                      )
                    );
                  }
                } catch (e) {
                  console.log("Frontend parse error:", e);
                }
              }
            }
          });
        }
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

          // Thêm message user
          const userMessage = {
            role: "user",
            content: [{ type: "text", text: initialMessage }, ...files.map((fileObj, idx) => ({
              type: "image",
              content: fileObj.content || imagePaths[idx],
            }))],
            id: `msg_${Date.now()}_init`,
          };
          setMessages((prev) => [...prev, userMessage]);

          // Thêm assistant rỗng để stream
          const assistantId = generateMessageId();
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "", id: assistantId },
          ]);

          const result = await fetch(`${PROXY_BASE}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: initialMessage, image_paths: imagePaths }),
          });

          if (!result.body) throw new Error("Không nhận được stream từ server");

          const reader = result.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let done = false;
          let assistantText = "";

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunk = decoder.decode(value);
            chunk.split("\n").forEach((line) => {
              if (line.startsWith("data: ")) {
                const data = line.replace("data: ", "");
                if (data === "[DONE]") {
                  setIsLoading(false);
                } else {
                  try {
                    const obj = JSON.parse(data);
                    if (obj.token) {
                      assistantText += obj.token;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantId
                            ? { ...msg, content: assistantText }
                            : msg
                        )
                      );
                    }
                  } catch {}
                }
              }
            });
          }
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
