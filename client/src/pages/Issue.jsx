import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import FileUpload from '../components/FileUpload';

function Issue() {
  const [file, setFile] = useState(null);
  const [issuer, setIssuer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    if (selectedFile) setError('');
  };

  const handleFileError = (msg) => {
    setError(msg);
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

      const res = await api.post('/issue', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(res.data.data);
      toast.success('Document issued successfully!', { id: toastId });
      
      // Reset form
      setFile(null);
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

  const getVerifyUrl = (docId) => {
    const base = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${base}/verify?docId=${encodeURIComponent(docId)}`;
  };

  const downloadQR = () => {
    if (!result?.documentId) return;
    const canvas = document.getElementById('issue-qr-code');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `trustchain-${result.documentId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('QR code downloaded');
  };

  const qrUrl = result ? getVerifyUrl(result.documentId) : '';

  return (
    <div className="card form-card">
      <h2>Issue Document</h2>
      <form onSubmit={handleSubmit}>
        <FileUpload
          onFileSelect={handleFileSelect}
          onError={handleFileError}
          label="Document File"
          placeholderText="Click or drag file here"
          hintText="PDF, JPG, or PNG up to 10MB"
        />
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
          {loading ? (
            <>
              <Spinner size={16} /> Processing...
            </>
          ) : (
            'Issue Document'
          )}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <div className="result fade-in">
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
            <a
              href={`https://testnet.xdcscan.com/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
              style={{ marginLeft: '8px' }}
            >
              View ↗
            </a>
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

          <div className="qr-section">
            <h4>Scan to Verify</h4>
            <div className="qr-wrapper">
              <QRCodeCanvas
                id="issue-qr-code"
                value={qrUrl}
                size={180}
                level="M"
                includeMargin={true}
                bgColor="#0a0a0a"
                fgColor="#ffffff"
              />
            </div>
            <div className="qr-actions">
              <button className="copy-btn" onClick={() => copyToClipboard(qrUrl, 'Verification URL')}>
                Copy Link
              </button>
              <button className="copy-btn" onClick={downloadQR}>
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Issue;