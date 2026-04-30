import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import FileUpload from '../components/FileUpload';

function Verify() {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  // Auto-fill documentId from URL query param
  useEffect(() => {
    const docId = searchParams.get('docId');
    if (docId) {
      setDocumentId(docId);
    }
  }, [searchParams]);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    if (selectedFile) setError('');
  };

  const handleFileError = (msg) => {
    setError(msg);
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

      const res = await api.post('/verify', formData, {
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
    <div className="card form-card">
      <h2>Verify Document</h2>
      <form onSubmit={handleSubmit}>
        <FileUpload
          onFileSelect={handleFileSelect}
          onError={handleFileError}
          label="Document File"
          placeholderText="Click or drag file here"
          hintText="Upload the original document"
        />
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
          {loading ? (
            <>
              <Spinner size={16} /> Verifying...
            </>
          ) : (
            'Verify Document'
          )}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <div className={`result fade-in ${result.status === 'tampered' ? 'tampered' : ''}`}>
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
                          href={`https://testnet.xdcscan.com/tx/${result.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          View on Explorer ↗
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