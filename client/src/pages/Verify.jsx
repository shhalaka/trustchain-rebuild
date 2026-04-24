import React, { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB');
        return;
      }
      
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
    if (!file || !documentId.trim()) {
      setError('Please provide both file and document ID');
      return;
    }

    // Validate document ID format
    if (!/^TC-\d{13}$/.test(documentId.trim())) {
      setError('Invalid document ID format. Expected: TC- followed by 13 digits');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const toastId = toast.loading('Verifying document...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', documentId.trim());

      const res = await axios.post(`${API}/verify`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(res.data.data);
      
      if (res.data.data.status === 'valid') {
        toast.success('Document verified successfully!', { id: toastId });
      } else {
        toast.error('Document verification failed!', { id: toastId });
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to verify document';
      setError(message);
      toast.error(message, { id: toastId });
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
            placeholder="TC-1234567890123"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            maxLength={16}
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
          
          <div className="result-details">
            <div className="result-item">
              <strong>Status:</strong>
              <span className={`badge ${result.status === 'valid' ? 'badge-success' : 'badge-error'}`}>
                {result.status === 'valid' ? 'Authentic' : 'Tampered'}
              </span>
            </div>
            
            <div className="result-item">
              <strong>Document ID:</strong> <span>{result.documentId}</span>
            </div>
            
            <div className="result-item">
              <strong>Issuer:</strong> <span>{result.issuer}</span>
            </div>
            
            <div className="result-item">
              <strong>ZK Proof:</strong>
              <span className={`badge ${result.zkValid ? 'badge-success' : 'badge-error'}`}>
                {result.zkValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            
            {result.blockchainStatus && (
              <div className="result-item">
                <strong>Blockchain:</strong>
                <span className="badge badge-info">{result.blockchainStatus}</span>
              </div>
            )}
            
            {result.txHash && (
              <div className="result-item">
                <strong>Transaction:</strong>
                <a 
                  href={`https://explorer.apothem.network/txs/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  View on Explorer
                </a>
              </div>
            )}
            
            {result.verifiedAt && (
              <div className="result-item">
                <strong>Verified At:</strong>
                <span>{new Date(result.verifiedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Verify;