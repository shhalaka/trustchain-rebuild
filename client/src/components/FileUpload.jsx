import React, { useState, useRef, useCallback } from 'react';

const DEFAULT_ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const DEFAULT_ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png';
const DEFAULT_MAX_SIZE_MB = 10;

function FileUpload({
  onFileSelect,
  onError,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  acceptAttr = DEFAULT_ACCEPT_ATTR,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  label = 'Document File',
  placeholderText = 'Click or drag file here',
  hintText = 'PDF, JPG, or PNG up to 10MB',
  className = '',
}) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback(
    (selectedFile) => {
      if (selectedFile.size > maxSizeBytes) {
        const msg = `File too large. Maximum size is ${maxSizeMB}MB`;
        onError?.(msg);
        return false;
      }
      if (!acceptedTypes.includes(selectedFile.type)) {
        const msg = 'Invalid file type. Only PDF, JPG, PNG allowed';
        onError?.(msg);
        return false;
      }
      return true;
    },
    [acceptedTypes, maxSizeBytes, maxSizeMB, onError]
  );

  const handleFile = useCallback(
    (selectedFile) => {
      if (!selectedFile) return;
      if (!validateFile(selectedFile)) {
        setFile(null);
        setFileName('');
        onFileSelect(null);
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      onFileSelect(selectedFile);
    },
    [validateFile, onFileSelect]
  );

  const handleInputChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDropZoneClick = () => {
    inputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const dropZoneClass = `drop-zone ${isDragging ? 'dragging' : ''} ${className}`.trim();

  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <div
        className={dropZoneClass}
        onClick={handleDropZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleDropZoneClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleInputChange}
          accept={acceptAttr}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        <div className="drop-zone-content">
          {fileName ? (
            <span className="file-name">{fileName}</span>
          ) : (
            <>
              <span className="drop-zone-text">{placeholderText}</span>
              <span className="drop-zone-hint">{hintText}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
