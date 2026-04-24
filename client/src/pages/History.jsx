import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function History() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchDocuments(pagination.page);
  }, []);

  const fetchDocuments = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view history');
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API}/documents?page=${page}&limit=${pagination.limit}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setDocuments(res.data.data.documents);
      setPagination(res.data.data.pagination);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch documents');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchDocuments(newPage);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading && documents.length === 0) {
    return (
      <div className="card loading">
        <div className="skeleton-loader">
          <div className="skeleton-header"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card error">
        <p>{error}</p>
        {error.includes('login') && (
          <a href="/login" className="btn-secondary">Go to Login</a>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Issued Documents</h2>
      
      {documents.length === 0 ? (
        <div className="empty-state">
          <p>No documents issued yet</p>
        </div>
      ) : (
        <>
          <table className="history-table">
            <thead>
              <tr>
                <th>Document ID</th>
                <th>File Name</th>
                <th>Issuer</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.documentId}>
                  <td>
                    <span className="doc-id">{doc.documentId}</span>
                    <button 
                      className="icon-btn"
                      onClick={() => copyToClipboard(doc.documentId, 'Document ID')}
                      title="Copy ID"
                    >
                      📋
                    </button>
                  </td>
                  <td>{doc.fileName}</td>
                  <td>{doc.issuer}</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="actions">
                      <a 
                        href={`https://explorer.apothem.network/txs/${doc.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-link"
                      >
                        View Tx
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
              >
                ← Previous
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button 
                className="page-btn"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
              >
                Next →
              </button>
            </div>
          )}

          <div className="results-info">
            Showing {documents.length} of {pagination.total} documents
          </div>
        </>
      )}
    </div>
  );
}

export default History;