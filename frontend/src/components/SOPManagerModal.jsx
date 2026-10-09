import React, { useState } from 'react';
import { X, BookOpen, Upload, FileText, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { uploadSOP, fetchSOPChunks } from '../api';

export default function SOPManagerModal({ 
  sops = [], 
  isOpen, 
  onClose, 
  onSOPUploaded 
}) {
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'upload'
  const [selectedSOP, setSelectedSOP] = useState(null);
  const [sopChunks, setSopChunks] = useState([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  // Upload state
  const [sopId, setSopId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('phishing');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  if (!isOpen) return null;

  const handleSelectSOP = async (sop) => {
    setSelectedSOP(sop);
    setIsLoadingChunks(true);
    try {
      const chunks = await fetchSOPChunks(sop.id);
      setSopChunks(chunks);
    } catch (err) {
      alert("Error loading SOP chunks: " + err.message);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !sopId || !title) {
      alert("Please fill all fields and select a file.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sop_id', sopId);
    formData.append('title', title);
    formData.append('category', category);

    setIsUploading(true);
    setUploadSuccess('');
    try {
      const res = await uploadSOP(formData);
      setUploadSuccess(`Successfully ingested & indexed ${res.id} into ${res.chunks_count} vector chunks!`);
      onSOPUploaded();
      setSopId('');
      setTitle('');
      setFile(null);
      setTimeout(() => {
        setActiveTab('library');
        setUploadSuccess('');
      }, 1500);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(10, 15, 26, 0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <BookOpen size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                SOP Knowledge Base & Vector Index
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                RAG repository used to ground AI recommendations with procedural authority
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '12px 24px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => { setActiveTab('library'); setSelectedSOP(null); }}
            className={`btn ${activeTab === 'library' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Layers size={15} />
            Indexed SOP Library ({sops.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Upload size={15} />
            Ingest New SOP Document
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {activeTab === 'library' && (
            <div>
              {!selectedSOP ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '14px' }}>
                  {sops.map((sop) => (
                    <div
                      key={sop.id}
                      onClick={() => handleSelectSOP(sop)}
                      style={{
                        background: 'rgba(14, 20, 35, 0.8)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '10px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-cyan)',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {sop.id}
                          </span>
                          <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>
                            {sop.chunks_count} Chunks
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600, marginBottom: '6px', lineHeight: 1.3 }}>
                          {sop.title}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Primary Section: {sop.sample_section}
                        </p>
                      </div>

                      <div style={{
                        marginTop: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: 'var(--accent-cyan)',
                        fontWeight: 600
                      }}>
                        Inspect Chunks <ChevronRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedSOP(null)}
                    className="btn btn-secondary"
                    style={{ marginBottom: '16px', fontSize: '0.78rem', padding: '5px 10px' }}
                  >
                    ← Back to SOP List
                  </button>

                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
                      {selectedSOP.id}: {selectedSOP.title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Total vectorized chunks: {sopChunks.length}
                    </p>
                  </div>

                  {isLoadingChunks ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading chunks...</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {sopChunks.map((chunk) => (
                        <div
                          key={chunk.chunk_id}
                          style={{
                            background: 'rgba(9, 13, 23, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            padding: '14px 18px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                              {chunk.section}
                            </strong>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {chunk.chunk_id}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {chunk.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <form onSubmit={handleUploadSubmit} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploadSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  color: '#34d399',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={18} />
                  {uploadSuccess}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  SOP Document ID (e.g., SOP-SEC-05)
                </label>
                <input
                  type="text"
                  required
                  placeholder="SOP-SEC-05"
                  value={sopId}
                  onChange={(e) => setSopId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="DDoS Mitigation & BGP Anycast Procedure"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Threat Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                >
                  <option value="phishing">Phishing & Social Engineering</option>
                  <option value="ransomware">Ransomware & Malware</option>
                  <option value="brute_force">Brute Force & Auth Attacks</option>
                  <option value="unauthorized_access">Unauthorized Access & PrivEsc</option>
                  <option value="ddos">DDoS / Network Flooding</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Upload SOP Document (PDF, TXT, MD)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px dashed rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#f8fafc',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="btn btn-primary"
                style={{ marginTop: '10px' }}
              >
                <Upload size={16} />
                {isUploading ? 'Chunking & Vector Indexing...' : 'Upload & Index into Vector Store'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
