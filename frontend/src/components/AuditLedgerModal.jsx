import React, { useState } from 'react';
import { X, ShieldCheck, Link, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { verifyAuditChain } from '../api';

export default function AuditLedgerModal({ 
  records = [], 
  isOpen, 
  onClose, 
  onRefresh 
}) {
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyAuditChain();
      setVerificationResult(res);
    } catch (err) {
      alert("Failed to verify chain: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '950px' }}
      >
        {/* Modal Header */}
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
              <Link size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                Cryptographic Audit Ledger (SHA-256 Hash Chaining)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Immutable blockchain-style sequential hash links ensuring forensic non-repudiation
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

        {/* Verification Banner */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            {verificationResult ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {verificationResult.is_valid ? (
                  <CheckCircle size={18} color="#10b981" />
                ) : (
                  <AlertTriangle size={18} color="#f43f5e" />
                )}
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: verificationResult.is_valid ? '#34d399' : '#fb7185'
                }}>
                  {verificationResult.message}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Total recorded blocks: <strong style={{ color: '#f8fafc' }}>{records.length}</strong>. Click verify to mathematically recalculate SHA-256 hashes.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onRefresh}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <RefreshCw size={14} />
              Sync Ledger
            </button>
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <ShieldCheck size={16} />
              {isVerifying ? 'Recalculating...' : 'Verify Chain Integrity'}
            </button>
          </div>
        </div>

        {/* Blocks Timeline */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              <p>No analyst decisions logged yet.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '6px' }}>
                Run triage on an alert and click "Approve" or "Reject" to generate the first block.
              </p>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.audit_id}
                style={{
                  background: 'rgba(13, 19, 33, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  position: 'relative'
                }}
              >
                {/* Block Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      BLOCK #{rec.sequence_number} • {rec.audit_id}
                    </span>
                    <span className="badge" style={{
                      background: rec.decision === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' :
                                  rec.decision === 'REJECTED' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: rec.decision === 'APPROVED' ? '#34d399' :
                             rec.decision === 'REJECTED' ? '#fb7185' : '#fbbf24'
                    }}>
                      {rec.decision}
                    </span>
                  </div>

                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {rec.timestamp}
                  </span>
                </div>

                {/* Details */}
                <div style={{ fontSize: '0.82rem', marginBottom: '10px', color: '#cbd5e1' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Alert ID: </strong> {rec.alert_id} |{' '}
                  <strong style={{ color: 'var(--text-muted)' }}>Analyst: </strong> {rec.analyst_id}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <strong>Summary: </strong> {rec.incident_summary}
                </div>

                {rec.notes && (
                  <div style={{ fontSize: '0.78rem', color: '#93c5fd', marginBottom: '10px', background: 'rgba(30, 58, 138, 0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                    <strong>Analyst Notes: </strong> {rec.notes}
                  </div>
                )}

                {/* Hashes: Prev Hash & Current Hash */}
                <div style={{
                  background: '#060911',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--text-dim)', minWidth: '85px' }}>PREV HASH:</span>
                    <span style={{ color: '#64748b', wordBreak: 'break-all' }}>{rec.prev_hash}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--accent-cyan)', minWidth: '85px', fontWeight: 600 }}>BLOCK HASH:</span>
                    <span style={{ color: '#38bdf8', wordBreak: 'break-all', fontWeight: 600 }}>{rec.current_hash}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
