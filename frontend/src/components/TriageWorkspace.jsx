import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal, 
  FileText, 
  Cpu, 
  Lock, 
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

export default function TriageWorkspace({ 
  alert, 
  onRunTriage, 
  onSubmitDecision, 
  isTriaging, 
  onViewSOPChunk 
}) {
  const [analystNotes, setAnalystNotes] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [customActionText, setCustomActionText] = useState('');
  const [checkedSteps, setCheckedSteps] = useState({});

  if (!alert) {
    return (
      <div className="cyber-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            <Cpu size={32} color="#38bdf8" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Select an Incident Alert</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Choose an incoming threat from the left stream to inspect raw telemetry, trigger SOP-grounded RAG reasoning, and execute human-in-the-loop remediation.
          </p>
        </div>
      </div>
    );
  }

  const triageData = alert.triage_result;

  const toggleStep = (stepIdx) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepIdx]: !prev[stepIdx]
    }));
  };

  const handleDecision = (decisionType) => {
    const payload = {
      alert_id: alert.id,
      decision: decisionType,
      analyst_id: "analyst_mercer",
      notes: analystNotes + (showOverrideInput && customActionText ? ` [Override: ${customActionText}]` : ""),
      custom_actions: showOverrideInput && customActionText ? [customActionText] : null
    };
    onSubmitDecision(payload);
    setAnalystNotes('');
    setShowOverrideInput(false);
    setCustomActionText('');
  };

  return (
    <div className="cyber-card" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner: Incident Identification */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(13, 18, 29, 0.7)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {alert.id}
              </span>
              <span className={`badge ${
                alert.severity === 'CRITICAL' ? 'badge-critical' :
                alert.severity === 'HIGH' ? 'badge-high' :
                alert.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'
              }`}>
                {alert.severity}
              </span>
              <span className="badge badge-status">
                Threat: {alert.threat_type.replace('_', ' ').toUpperCase()}
              </span>
              <span className="badge" style={{
                background: alert.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 
                            alert.status === 'REJECTED' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                color: alert.status === 'APPROVED' ? '#34d399' :
                       alert.status === 'REJECTED' ? '#fda4af' : '#38bdf8'
              }}>
                Status: {alert.status}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>
              {alert.title}
            </h2>
          </div>

          {!triageData && (
            <button
              onClick={() => onRunTriage(alert.id)}
              disabled={isTriaging}
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <Sparkles size={18} className={isTriaging ? 'pulse-indicator' : ''} />
              {isTriaging ? 'RAG Reasoning in Progress...' : 'Run SOP-Grounded RAG Triage'}
            </button>
          )}
        </div>

        {/* Target Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          background: 'rgba(8, 12, 22, 0.6)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>SOURCE IP</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{alert.source_ip}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>TARGET HOST</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{alert.target_host}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>TARGET USER</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{alert.target_user || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>INGESTION TIMESTAMP</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{alert.timestamp}</span>
          </div>
        </div>

        {/* Indicators of Compromise */}
        {alert.indicators && alert.indicators.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>IoCs:</span>
            {alert.indicators.map((ioc, idx) => (
              <span key={idx} style={{
                background: 'rgba(23, 37, 84, 0.5)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#7dd3fc',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {ioc}
              </span>
            ))}
          </div>
        )}

        {/* Raw Log Excerpt */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Terminal size={12} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Raw Telemetry Log</span>
          </div>
          <div className="code-block" style={{ fontSize: '0.75rem', padding: '8px 12px' }}>
            {alert.raw_log}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {!triageData ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px dashed rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center'
          }}>
            <ShieldCheck size={40} color="#38bdf8" style={{ marginBottom: '12px', opacity: 0.8 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Ready for RAG Knowledge-Assisted Triage</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 16px' }}>
              The system will extract IoCs from this alert, perform vector similarity retrieval against organizational SOPs, compute a confidence score, and generate verified response steps.
            </p>
            <button
              onClick={() => onRunTriage(alert.id)}
              disabled={isTriaging}
              className="btn btn-primary"
            >
              <Sparkles size={16} />
              {isTriaging ? 'Generating SOP Recommendations...' : 'Execute Triage Now'}
            </button>
          </div>
        ) : (
          <>
            {/* Confidence & Explainability Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 38, 0.9), rgba(15, 27, 48, 0.9))',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                    RAG Grounding & Confidence
                  </span>
                  <span className={`badge ${
                    triageData.confidence.level === 'HIGH' ? 'badge-confidence-high' :
                    triageData.confidence.level === 'MEDIUM' ? 'badge-confidence-medium' : 'badge-confidence-low'
                  }`}>
                    {triageData.confidence.level} CONFIDENCE
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                  {Math.round(triageData.confidence.score * 100)}% MATCH
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(triageData.confidence.score * 100)}%`,
                  background: triageData.confidence.level === 'HIGH' ? 'linear-gradient(90deg, #10b981, #34d399)' :
                              triageData.confidence.level === 'MEDIUM' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                              'linear-gradient(90deg, #f43f5e, #fb7185)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {triageData.confidence.rationale}
              </p>
            </div>

            {/* AI Incident Summary */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px 20px'
            }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Incident Summary & Context
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                {triageData.incident_summary}
              </p>
            </div>

            {/* Step-by-Step Response Guidance Checklist */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#10b981" />
                  SOP-Guided Remediation Playbook
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Check steps as you execute
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {triageData.recommended_actions.map((act, idx) => {
                  const isDone = checkedSteps[act.step];
                  return (
                    <div
                      key={idx}
                      style={{
                        background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(18, 26, 43, 0.7)',
                        border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.15)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <button
                        onClick={() => toggleStep(act.step)}
                        style={{
                          background: isDone ? '#10b981' : 'transparent',
                          border: isDone ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.3)',
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          marginTop: '2px',
                          flexShrink: 0
                        }}
                      >
                        {isDone && <CheckCircle2 size={16} color="#052e16" />}
                      </button>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            STEP {act.step} • {act.phase.toUpperCase()}
                          </span>

                          <span style={{
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                            color: '#a855f7',
                            background: 'rgba(168, 85, 247, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            Ref: {act.sop_reference}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '0.85rem',
                          color: isDone ? '#94a3b8' : '#f1f5f9',
                          textDecoration: isDone ? 'line-through' : 'none',
                          lineHeight: 1.45
                        }}>
                          {act.action}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retrieved SOP References (Explainability) */}
            {triageData.sop_citations && triageData.sop_citations.length > 0 && (
              <div style={{
                background: 'rgba(12, 17, 28, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px 20px'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#38bdf8" />
                  Retrieved SOP Grounding Evidence ({triageData.sop_citations.length} sections)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {triageData.sop_citations.map((cite, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(7, 10, 18, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                          {cite.sop_id}: {cite.section}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#10b981' }}>
                          Sim: {cite.similarity_score}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-dim)', fontSize: '0.76rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{cite.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human-in-the-Loop Decision Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 38, 0.95), rgba(12, 18, 30, 0.95))',
              border: '1px solid var(--border-glow)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Lock size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                  Human-in-the-Loop Analyst Verification
                </h3>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                In accordance with SOC governance and ISO 27001 policies, automated AI execution is gated. The analyst must sign off. Your decision will be written to the tamper-evident SHA-256 cryptographic audit chain.
              </p>

              {/* Analyst Notes Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  Analyst Decision Justification & Forensic Notes:
                </label>
                <textarea
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  placeholder="e.g. Verified IOC IP 185.220... host isolated via EDR. Committing SOP containment protocol."
                  rows={2}
                  style={{
                    width: '100%',
                    background: '#070a12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Override options toggle */}
              {showOverrideInput && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', display: 'block', marginBottom: '6px' }}>
                    Custom Analyst Override Action:
                  </label>
                  <input
                    type="text"
                    value={customActionText}
                    onChange={(e) => setCustomActionText(e.target.value)}
                    placeholder="Specify non-standard remediation instructions..."
                    style={{
                      width: '100%',
                      background: '#070a12',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              {/* Decision Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleDecision('APPROVE')}
                  className="btn btn-success"
                  style={{ flex: 1, minWidth: '160px' }}
                >
                  <CheckCircle2 size={16} />
                  Approve SOP Playbook
                </button>

                <button
                  onClick={() => {
                    if (!showOverrideInput) setShowOverrideInput(true);
                    else handleDecision('OVERRIDE');
                  }}
                  className="btn btn-secondary"
                  style={{
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24'
                  }}
                >
                  <AlertTriangle size={16} />
                  {showOverrideInput ? 'Commit Override' : 'Modify / Override'}
                </button>

                <button
                  onClick={() => handleDecision('REJECT')}
                  className="btn btn-danger"
                >
                  <XCircle size={16} />
                  Reject (False Positive)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
