import React, { useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function Verify() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [documentId, setDocumentId] = useState('');
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
    if (!file || !documentId) {
      setError('Please provide both file and document ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', documentId);

      const res = await axios.post(`${API}/verify`, formData);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Verify Document</h2>
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
                  <span className="drop-zone-hint">Upload the original document</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Document ID</label>
          <input 
            type="text" 
            placeholder="TC-123456789"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Document'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <div className={`result ${result.status === 'tampered' ? 'tampered' : ''}`}>
          <h3>{result.message}</h3>
          <p><strong>Issuer:</strong> {result.issuer}</p>
          <p><strong>Document ID:</strong> {result.documentId}</p>
          <p><strong>ZK Proof:</strong> {result.zkValid ? 'Valid' : 'Invalid'}</p>
          <span className={`badge ${result.status === 'valid' ? 'badge-success' : 'badge-error'}`}>
            {result.status === 'valid' ? 'Authentic' : 'Tampered'}
          </span>
        </div>
      )}
    </div>
  );
}

export default Verify;