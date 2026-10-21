import React from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';

export default function Header({ user, onLogout }) {
  return (
    <header className="app-header" style={{
      background: 'rgba(10, 15, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
      padding: '10px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.2))',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          padding: '7px',
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)'
        }}>
          <ShieldAlert size={20} color="#38bdf8" />
        </div>
        <div className="brand-copy">
          <h1 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Sentinel Desk
          </h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Tool-using incident response workspace
          </p>
        </div>
      </div>

      <button
        className="header-signout"
        type="button"
        onClick={onLogout}
        aria-label={`Sign out ${user?.username || ''}`.trim()}
      >
        <span>{user?.username}</span>
        <LogOut size={15} />
      </button>
    </header>
  );
}
