import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { GoPlus, GoServer } from "react-icons/go";
import { ImSpinner8 } from "react-icons/im";
import { BiX } from "react-icons/bi";
import { FiPaperclip } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import { FaPaperPlane } from "react-icons/fa";
import { SettingsContext } from "../contexts/SettingsContext";
import MCPModal from "./MCPModal";
import Toast from "./Toast";

function InputContainer({
  isTouch,
  placeholder,
  extraClassName = "",
  inputText,
  setInputText,
  isLoading,
  onSend,
  onCancel,
  uploadedFiles,
  processFiles,
  removeFile,
  uploadingFiles,
}) {
  const [isComposing, setIsComposing] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const optionsRef = useRef(null);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 250);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  const {
    mcpList,
    canToggleMCP,
    setMCPList,
  } = useContext(SettingsContext);

  useEffect(() => { adjustTextareaHeight(); }, [inputText, adjustTextareaHeight]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowMediaOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const notifyError = useCallback((message) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  const handlePaste = useCallback(
    async (e) => {
      const items = e.clipboardData.items;
      const filesToUpload = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) filesToUpload.push(file);
        }
      }
      if (filesToUpload.length > 0) {
        e.preventDefault();
        await processFiles(filesToUpload, notifyError);
      }
    },
    [processFiles, notifyError]
  );

  const handlePlusButtonClick = useCallback((e) => {
    e.stopPropagation();
    setShowMediaOptions(!showMediaOptions);
  }, [showMediaOptions]);

  const handleFileClick = useCallback((e) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.click();
    setShowMediaOptions(false);
  }, []);

  const handleFileDelete = useCallback((file) => {
    removeFile(file.id);
  }, [removeFile]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === "Enter" && !event.shiftKey && !isComposing && !isTouch && !uploadingFiles) {
      event.preventDefault();
      onSend(inputText);
    }
  }, [inputText, isComposing, isTouch, uploadingFiles, onSend]);

  const handleSendButtonClick = useCallback(() => {
    if (isLoading) { onCancel?.(); return; }
    if (inputText.trim()) onSend(inputText);
    else { setToastMessage("Vui lòng nhập nội dung."); setShowToast(true); }
  }, [isLoading, inputText, onSend, onCancel]);

  const handleMCPClick = useCallback(() => { setIsMCPModalOpen(true); setShowMediaOptions(false); }, []);
  const handleMCPModalClose = useCallback(() => setIsMCPModalOpen(false), []);
  const handleMCPModalConfirm = useCallback((selectedServers) => setMCPList(selectedServers), [setMCPList]);

  return (
    <motion.div className={`input-container ${extraClassName}`.trim()} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="content-container">
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div className="file-area" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
              <AnimatePresence>
                {uploadedFiles.map((file) => (
                  <motion.div key={file.id} className="file-wrap" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 5, opacity: 0 }} transition={{ duration: 0.3 }} style={{ position: "relative" }}>
                    <div className="file-object">
                      {file.file && file.file.type.startsWith("image/") ? (
                        <img
                            src={file.content}
                            alt={file.name}
                            className="file-preview"
                            style={{
                              maxWidth: "120px",
                              maxHeight: "120px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                      ) : (
                        <span className="file-name">{file.name}</span>
                      )}
                      {!file.content && <div className="file-upload-overlay"><ClipLoader size={20} /></div>}
                    </div>
                    <BiX className="file-delete" onClick={() => handleFileDelete(file)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="input-area">
          <textarea ref={textAreaRef} className="message-input" placeholder={placeholder} value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
          />
        </div>

        <div className="button-area">
          <div className="function-button-container" ref={optionsRef}>
            <motion.div className="function-button plus-button" onClick={handlePlusButtonClick} transition={{ type: "physics", velocity: 200, stiffness: 100, damping: 15 }} layout>
              <GoPlus style={{ strokeWidth: 0.5 }} />
            </motion.div>
            <AnimatePresence>
              {showMediaOptions && (
                <motion.div className="media-options-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                  <div className="media-option" onClick={handleFileClick}><FiPaperclip />Tải file lên</div>
                  {canToggleMCP && <div className="media-option" onClick={handleMCPClick}><GoServer style={{ paddingLeft: "0.5px", color: "#5e5bff", strokeWidth: 2.5 }} /><span className="mcp-text">MCP Server</span></div>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <button className="send-button" onClick={handleSendButtonClick} disabled={uploadingFiles} aria-label={isLoading ? "Đang gửi..." : "Gửi tin nhắn"}>
        {isLoading ? <div className="loading-container"><ImSpinner8 className="spinner" /></div> : <FaPaperPlane />}
      </button>

      <input type="file" accept="*/*" multiple ref={fileInputRef} style={{ display: "none" }}
        onChange={async (e) => {
          const files = Array.from(e.target.files);
          await processFiles(files, (msg) => { setToastMessage(msg); setShowToast(true); });
          e.target.value = "";
        }}
      />

      <MCPModal isOpen={isMCPModalOpen} onClose={handleMCPModalClose} onConfirm={handleMCPModalConfirm} currentMCPList={mcpList} />
      <Toast type="error" message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </motion.div>
  );
}

export default InputContainer;
