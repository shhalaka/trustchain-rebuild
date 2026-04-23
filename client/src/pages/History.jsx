import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function History() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/documents`);
      setDocuments(res.data.data.documents);
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="card">Loading...</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="card">
      <h2>Issued Documents</h2>
      {documents.length === 0 ? (
        <p>No documents yet</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Document ID</th>
              <th>File Name</th>
              <th>Issuer</th>
              <th>Date</th>
              <th>Transaction</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.documentId}>
                <td>{doc.documentId}</td>
                <td>{doc.fileName}</td>
                <td>{doc.issuer}</td>
                <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                <td>
                  <a 
                    href={`https://explorer.apothem.network/txs/${doc.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default History;