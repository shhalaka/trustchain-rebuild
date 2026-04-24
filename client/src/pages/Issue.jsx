import React, { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function Issue() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Only PDF, JPG, PNG allowed');
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(droppedFile.type)) {
        setError('Invalid file type. Only PDF, JPG, PNG allowed');
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB');
        return;
      }
      
      setFile(droppedFile);
      setFileName(droppedFile.name);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!issuer.trim()) {
      setError('Please enter issuer name');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const toastId = toast.loading('Issuing document...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('issuer', issuer.trim());

      const res = await axios.post(`${API}/issue`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(res.data.data);
      toast.success('Document issued successfully!', { id: toastId });
      
      // Reset form
      setFile(null);
      setFileName('');
      setIssuer('');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to issue document';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="card">
      <h2>Issue Document</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Document File</label>
          <div 
            className="drop-zone" 
            onClick={handleDropZoneClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
            />
            <div className="drop-zone-content">
              {fileName ? (
                <span className="file-name">{fileName}</span>
              ) : (
                <>
                  <span className="drop-zone-text">Click or drag file here</span>
                  <span className="drop-zone-hint">PDF, JPG, or PNG up to 10MB</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Issuer Name *</label>
          <input 
            type="text" 
            placeholder="Enter issuer name"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            maxLength={100}
            required
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Processing...' : 'Issue Document'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <div className="result">
          <h3>Document Issued Successfully</h3>
          <div className="result-item">
            <strong>Document ID:</strong> 
            <span>{result.documentId}</span>
            <button 
              className="copy-btn"
              onClick={() => copyToClipboard(result.documentId, 'Document ID')}
            >
              Copy
            </button>
          </div>
          <div className="result-item">
            <strong>Transaction:</strong> 
            <span className="tx-hash">{result.txHash}</span>
            <button 
              className="copy-btn"
              onClick={() => copyToClipboard(result.txHash, 'Transaction hash')}
            >
              Copy
            </button>
          </div>
          <div className="result-item">
            <strong>Issuer:</strong> <span>{result.issuer}</span>
          </div>
          <span className="badge badge-success">Verified on Blockchain</span>
        </div>
      )}
    </div>
  );
}

export default Issue;