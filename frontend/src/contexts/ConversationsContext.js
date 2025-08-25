// src/contexts/ConversationsContext.js
import React, { createContext, useState, useCallback, useEffect } from "react";

export const ConversationsContext = createContext();

export function ConversationsProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [error, setError] = useState(null);

  // --- util: lưu xuống localStorage ---
  const saveToStorage = (data) => {
    localStorage.setItem("conversations", JSON.stringify(data));
  };

  // --- load từ localStorage khi khởi tạo ---
  useEffect(() => {
    const stored = localStorage.getItem("conversations");
    if (stored) {
      try {
        setConversations(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored conversations", e);
      }
    }
  }, []);

  // --- fetchConversations: thay bằng lấy từ localStorage ---
  const fetchConversations = useCallback(async () => {
    setIsLoadingChat(true);
    try {
      const stored = localStorage.getItem("conversations");
      if (stored) {
        setConversations(JSON.parse(stored));
      } else {
        setConversations([]);
      }
      setError(null);
    } catch (error) {
      console.error("Failed to load conversations.", error);
      setError("대화를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoadingChat(false);
    }
  }, []);

  const addConversation = (newConversation) => {
    setConversations((prev) => {
      const updated = [...prev, newConversation];
      saveToStorage(updated);
      return updated;
    });
  };

  const deleteConversation = (conversation_id) => {
    setConversations((prev) => {
      const updated = prev.filter(
        (conv) => conv.conversation_id !== conversation_id
      );
      saveToStorage(updated);
      return updated;
    });
  };

  const deleteAllConversation = () => {
    setConversations([]);
    saveToStorage([]);
  };

  const updateConversation = (conversation_id, newAlias, isLoading = undefined) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.conversation_id === conversation_id
          ? {
              ...conv,
              alias: newAlias,
              ...(isLoading !== undefined && { isLoading }),
            }
          : conv
      );
      saveToStorage(updated);
      return updated;
    });
  };

  const toggleStarConversation = (conversation_id, starred) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.conversation_id === conversation_id
          ? {
              ...conv,
              starred,
              starred_at: starred ? new Date().toISOString() : null,
            }
          : conv
      );
      saveToStorage(updated);
      return updated;
    });
  };

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        isLoadingChat,
        error,
        fetchConversations,
        addConversation,
        deleteConversation,
        deleteAllConversation,
        updateConversation,
        toggleStarConversation,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}
