import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';

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
      const res = await api.get(`/documents?page=${page}&limit=${pagination.limit}`);

      setDocuments(res.data.data.documents);
      setPagination(res.data.data.pagination);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
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
      <div className="card">
        <h2>Issued Documents</h2>
        <table className="skeleton-table">
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
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td><div className="skeleton-cell medium"></div></td>
                <td><div className="skeleton-cell long"></div></td>
                <td><div className="skeleton-cell short"></div></td>
                <td><div className="skeleton-cell short"></div></td>
                <td><div className="skeleton-cell short"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
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