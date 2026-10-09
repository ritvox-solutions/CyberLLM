import React from 'react';
import { ShieldAlert, BookOpen, Link, PlusCircle, Activity, UserCheck } from 'lucide-react';

export default function Header({ 
  alerts = [], 
  sops = [], 
  onOpenAudit, 
  onOpenSOPs, 
  onSimulateThreat 
}) {
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const pendingCount = alerts.filter(a => a.status === 'NEW' || a.status === 'TRIAGED').length;

  return (
    <header style={{
      background: 'rgba(10, 15, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
      padding: '16px 28px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand / Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)'
          }}>
            <ShieldAlert size={28} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Smart Threat Response Assistant
              </h1>
              <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                SOP + RAG AI
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Explainable Decision Support with Cryptographic Audit Integrity • Dept. of CS (IoT & Cybersecurity)
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Activity size={16} color="#38bdf8" className="pulse-indicator" />
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Queue: </span>
              <strong style={{ color: '#f8fafc' }}>{pendingCount}</strong>
              <span style={{ color: 'var(--text-dim)', marginLeft: '8px' }}>Critical: </span>
              <strong style={{ color: criticalCount > 0 ? '#fb7185' : '#34d399' }}>{criticalCount}</strong>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <UserCheck size={16} color="#10b981" />
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Analyst: </span>
              <strong style={{ color: '#f8fafc' }}>Alex Mercer (L2)</strong>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Simulate Threat Select */}
            <div style={{ position: 'relative' }}>
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    onSimulateThreat(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none'
                }}
              >
                <option value="" disabled>+ Inject Threat Scenario</option>
                <option value="phishing">Phishing Attempt</option>
                <option value="ransomware">Ransomware Infiltration</option>
                <option value="brute_force">SSH Brute-Force</option>
                <option value="unauthorized_access">Privilege Escalation</option>
              </select>
            </div>

            <button 
              onClick={onOpenSOPs}
              className="btn btn-secondary" 
              style={{ fontSize: '0.82rem', padding: '7px 14px' }}
              title="View & Upload SOP Knowledge Base"
            >
              <BookOpen size={16} />
              SOP Library ({sops.length})
            </button>

            <button 
              onClick={onOpenAudit}
              className="btn btn-outline" 
              style={{ fontSize: '0.82rem', padding: '7px 14px' }}
              title="Inspect Cryptographic SHA-256 Hash Chain"
            >
              <Link size={16} />
              Audit Ledger (SHA-256)
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
