import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';

function History() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (doc.documentId && doc.documentId.toLowerCase().includes(q)) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
      (doc.issuer && doc.issuer.toLowerCase().includes(q))
    );
  });

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
      <p className="subtitle">View and manage your issued documents</p>

      {documents.length === 0 ? (
        <div className="empty-state enhanced">
          <div className="empty-icon">📄</div>
          <p>No documents issued yet</p>
          <span className="empty-hint">Issue your first document to see it here</span>
        </div>
      ) : (
        <>
          <div className="history-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by ID, filename, or issuer..."
                value={search}
                onChange={handleSearchChange}
                className="search-input"
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')} title="Clear search">
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="table-wrapper">
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
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-results">
                      No documents match your search
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
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
                      <td className="filename-cell" title={doc.fileName}>
                        {doc.fileName}
                      </td>
                      <td>
                        {doc.issuer && doc.issuer.trim() && doc.issuer.trim().toLowerCase() !== 'unknown' ? (
                          <span className="issuer">{doc.issuer}</span>
                        ) : (
                          <span className="issuer unknown">Unknown</span>
                        )}
                      </td>
                      <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="actions">
                          <a
                            href={`https://testnet.xdcscan.com/tx/${doc.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-link"
                            title="View transaction on XDC Testnet Explorer"
                          >
                            View Tx ↗
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
            Showing {filteredDocuments.length} of {pagination.total} documents
            {search && ` (filtered from ${documents.length} on this page)`}
          </div>
        </>
      )}
    </div>
  );
}

export default History;