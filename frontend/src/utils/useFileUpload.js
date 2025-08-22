import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useFileUpload = (initialFiles = []) => {
  const [uploadedFiles, setUploadedFiles] = useState(initialFiles);
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const processFiles = useCallback((files, onError) => {
    const maxAllowed = 10;
    const remaining = maxAllowed - uploadedFiles.length;

    if (files.length > remaining) {
      onError?.("Vượt quá số lượng file tối đa.");
      files = files.slice(0, remaining);
    }

    const fileObjs = files.map((file) => ({
      id: uuidv4(),
      file,
      name: file.name,
      content: URL.createObjectURL(file), // preview cục bộ
    }));

    setUploadedFiles((prev) => [...prev, ...fileObjs]);
  }, [uploadedFiles]);

  const removeFile = useCallback((fileId) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  return { uploadedFiles, setUploadedFiles, processFiles, removeFile, maxFileSize };
};
