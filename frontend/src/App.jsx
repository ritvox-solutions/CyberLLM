import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AlertsPanel from './components/AlertsPanel';
import TriageWorkspace from './components/TriageWorkspace';
import AuditLedgerModal from './components/AuditLedgerModal';
import SOPManagerModal from './components/SOPManagerModal';
import { 
  fetchAlerts, 
  simulateAlert, 
  runTriage, 
  submitDecision, 
  fetchAuditTrail, 
  fetchSOPs 
} from './api';

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [sops, setSops] = useState([]);
  const [auditRecords, setAuditRecords] = useState([]);
  
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isSOPsOpen, setIsSOPsOpen] = useState(false);
  
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);

  // Load initial data
  const loadAllData = async () => {
    setIsLoadingAlerts(true);
    try {
      const [fetchedAlerts, fetchedSops, fetchedAudit] = await Promise.all([
        fetchAlerts(),
        fetchSOPs(),
        fetchAuditTrail()
      ]);
      setAlerts(fetchedAlerts);
      setSops(fetchedSops);
      setAuditRecords(fetchedAudit);

      // Auto-select first alert if none selected
      if (!selectedAlert && fetchedAlerts.length > 0) {
        setSelectedAlert(fetchedAlerts[0]);
      } else if (selectedAlert) {
        // Keep selected alert up-to-date
        const updated = fetchedAlerts.find(a => a.id === selectedAlert.id);
        if (updated) setSelectedAlert(updated);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSimulateThreat = async (scenarioType) => {
    try {
      const newAlert = await simulateAlert(scenarioType);
      await loadAllData();
      setSelectedAlert(newAlert);
    } catch (err) {
      alert("Failed to inject threat: " + err.message);
    }
  };

  const handleRunTriage = async (alertId) => {
    setIsTriaging(true);
    try {
      const recommendation = await runTriage(alertId);
      // Refresh alerts to get updated status
      const updatedAlerts = await fetchAlerts();
      setAlerts(updatedAlerts);
      const updatedCurrent = updatedAlerts.find(a => a.id === alertId);
      if (updatedCurrent) {
        setSelectedAlert(updatedCurrent);
      }
    } catch (err) {
      alert("Triage error: " + err.message);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleSubmitDecision = async (payload) => {
    try {
      const record = await submitDecision(payload);
      // Refresh both alerts and audit trail
      const [updatedAlerts, updatedAudit] = await Promise.all([
        fetchAlerts(),
        fetchAuditTrail()
      ]);
      setAlerts(updatedAlerts);
      setAuditRecords(updatedAudit);
      const updatedCurrent = updatedAlerts.find(a => a.id === payload.alert_id);
      if (updatedCurrent) {
        setSelectedAlert(updatedCurrent);
      }
    } catch (err) {
      alert("Decision submission failed: " + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation & Status Bar */}
      <Header
        alerts={alerts}
        sops={sops}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenSOPs={() => setIsSOPsOpen(true)}
        onSimulateThreat={handleSimulateThreat}
      />

      {/* Main SOC Dashboard Grid */}
      <main style={{
        flex: 1,
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto',
        padding: '20px 28px',
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Left Column: Live Alerts Stream */}
        <section style={{ height: 'calc(100vh - 120px)' }}>
          <AlertsPanel
            alerts={alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={(a) => setSelectedAlert(a)}
            onRefresh={loadAllData}
            isLoading={isLoadingAlerts}
          />
        </section>

        {/* Right Column: Active Incident & Triage Workspace */}
        <section style={{ height: 'calc(100vh - 120px)' }}>
          <TriageWorkspace
            alert={selectedAlert}
            onRunTriage={handleRunTriage}
            onSubmitDecision={handleSubmitDecision}
            isTriaging={isTriaging}
          />
        </section>
      </main>

      {/* Audit Ledger Modal */}
      <AuditLedgerModal
        records={auditRecords}
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        onRefresh={async () => {
          const recs = await fetchAuditTrail();
          setAuditRecords(recs);
        }}
      />

      {/* SOP Knowledge Base Modal */}
      <SOPManagerModal
        sops={sops}
        isOpen={isSOPsOpen}
        onClose={() => setIsSOPsOpen(false)}
        onSOPUploaded={async () => {
          const updatedSOPs = await fetchSOPs();
          setSops(updatedSOPs);
        }}
      />
    </div>
  );
}
