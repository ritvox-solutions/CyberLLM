import React, { useState } from 'react';
import { AlertCircle, Flame, ShieldAlert, Cpu, Search, Check, RefreshCw } from 'lucide-react';

export default function AlertsPanel({ 
  alerts = [], 
  selectedAlert, 
  onSelectAlert, 
  onRefresh, 
  isLoading 
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'ALL' || alert.severity === filterSeverity;
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.threat_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.target_host.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  const getThreatIcon = (type) => {
    switch (type) {
      case 'ransomware': return <Flame size={15} color="#fb7185" />;
      case 'phishing': return <AlertCircle size={15} color="#38bdf8" />;
      case 'brute_force': return <Cpu size={15} color="#fbbf24" />;
      default: return <ShieldAlert size={15} color="#a855f7" />;
    }
  };

  return (
    <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(13, 18, 29, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Incoming Threat Stream</h2>
          <span className="badge badge-status">{filteredAlerts.length}</span>
        </div>
        <button 
          onClick={onRefresh} 
          className="btn btn-secondary" 
          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
          disabled={isLoading}
          title="Refresh Alerts"
        >
          <RefreshCw size={13} className={isLoading ? 'pulse-indicator' : ''} />
          Sync
        </button>
      </div>

      {/* Filters & Search */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search IoC, Host, IP, or Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '7px 12px 7px 32px',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>

        {/* Severity pill buttons */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              style={{
                background: filterSeverity === sev ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                color: filterSeverity === sev ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border: filterSeverity === sev ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.06)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Items List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <p style={{ fontSize: '0.85rem' }}>No alerts match your filter criteria.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isSelected = selectedAlert && selectedAlert.id === alert.id;
            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                style={{
                  background: isSelected ? 'rgba(30, 48, 77, 0.55)' : 'rgba(15, 22, 36, 0.65)',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.04)',
                  borderLeft: isSelected ? '4px solid var(--accent-cyan)' : '4px solid transparent',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none'
                }}
              >
                {/* Card Top: ID + Severity + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getThreatIcon(alert.threat_type)}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {alert.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span className={`badge ${getSeverityBadgeClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="badge badge-status" style={{ fontSize: '0.62rem' }}>
                      {alert.status}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px', lineHeight: 1.3 }}>
                  {alert.title}
                </h4>

                {/* Target host & IP */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>Target: {alert.target_host}</span>
                  <span>Src: {alert.source_ip}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
