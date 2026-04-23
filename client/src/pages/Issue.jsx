import React, { useState, useRef } from 'react';
import axios from 'axios';

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
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('issuer', issuer || 'Unknown');

      const res = await axios.post(`${API}/issue`, formData);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to issue document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Issue Document</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Document File</label>
          <div className="drop-zone" onClick={handleDropZoneClick}>
            <input 
              ref={fileInputRef}
              type="file" 
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div className="drop-zone-content">
              {fileName ? (
                <span className="file-name">{fileName}</span>
              ) : (
                <>
                  <span className="drop-zone-text">Click to select file</span>
                  <span className="drop-zone-hint">PDF, JPG, or PNG up to 10MB</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Issuer Name</label>
          <input 
            type="text" 
            placeholder="Enter issuer name"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
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
          <p><strong>Document ID:</strong> {result.documentId}</p>
          <p><strong>Transaction:</strong> {result.txHash}</p>
          <span className="badge badge-success">Verified on Blockchain</span>
        </div>
      )}
    </div>
  );
}

export default Issue;