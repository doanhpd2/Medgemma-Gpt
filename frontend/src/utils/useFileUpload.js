import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useFileUpload = (initialFiles = []) => {
  const [uploadedFiles, setUploadedFiles] = useState(initialFiles);
  const maxFileSize = 10 * 1024 * 1024;

  const uploadFiles = useCallback(async (fileObj) => {
    const { file, id } = fileObj;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const isImage = file.type.startsWith("image/");
      const url = `${process.env.REACT_APP_FASTAPI_URL}/upload/${isImage ? "image" : "file"}`;

      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      if (res.status === 401) {
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login?expired=true';
        }
        return;
      }

      if (!res.ok) {
        if (res.status === 422) throw new Error(`${file.name}는 업로드할 수 없는 파일입니다.`);
        if (res.status === 413) throw new Error(`${file.name}는 파일 크기 제한을 초과했습니다.`);
        throw new Error(`${file.name} 처리 중 오류가 발생했습니다.`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      return {
        ...fileObj,
        type: data.type,
        name: data.name,
        content: data.content || URL.createObjectURL(file),
        file_path: data.file_path,
      };

    } catch (err) {
      throw err;
    }
  }, []);

  const processFiles = useCallback(async (files, onError, canReadImage) => {
    const maxAllowed = 10;
    const remaining = maxAllowed - uploadedFiles.length;

    if (files.length > remaining) {
      onError?.("최대 업로드 가능한 파일 개수를 초과했습니다.");
      files = files.slice(0, remaining);
    }

    const fileObjs = files.map((file) => ({
      id: uuidv4(),
      file,
      name: file.name,
      content: URL.createObjectURL(file), // preview ngay lập tức
    }));

    setUploadedFiles((prev) => [...prev, ...fileObjs]);

    await Promise.all(
      fileObjs.map(async (fileObj) => {
        try {
          const result = await uploadFiles(fileObj);
          setUploadedFiles((prev) =>
            prev.map((item) => (item.id === fileObj.id ? result : item))
          );
        } catch (err) {
          onError?.(err.message);
          setUploadedFiles((prev) => prev.filter((item) => item.id !== fileObj.id));
        }
      })
    );

  }, [uploadedFiles, uploadFiles]);

  const removeFile = useCallback((fileId) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  return { uploadedFiles, processFiles, removeFile, maxFileSize };
};
