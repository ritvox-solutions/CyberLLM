const API_BASE = "http://127.0.0.1:8000/api/v1";

export async function fetchAlerts(status = "") {
  const url = status ? `${API_BASE}/alerts?status=${status}` : `${API_BASE}/alerts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load alerts");
  return res.json();
}

export async function simulateAlert(scenarioType) {
  const res = await fetch(`${API_BASE}/alerts/simulate/${scenarioType}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to simulate alert");
  return res.json();
}

export async function runTriage(alertId) {
  const res = await fetch(`${API_BASE}/triage/${alertId}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Triage failed");
  return res.json();
}

export async function submitDecision(payload) {
  const res = await fetch(`${API_BASE}/triage/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to submit decision");
  return res.json();
}

export async function fetchAuditTrail() {
  const res = await fetch(`${API_BASE}/audit`);
  if (!res.ok) throw new Error("Failed to load audit trail");
  return res.json();
}

export async function verifyAuditChain() {
  const res = await fetch(`${API_BASE}/audit/verify`);
  if (!res.ok) throw new Error("Audit verification failed");
  return res.json();
}

export async function fetchSOPs() {
  const res = await fetch(`${API_BASE}/sops`);
  if (!res.ok) throw new Error("Failed to load SOPs");
  return res.json();
}

export async function fetchSOPChunks(sopId) {
  const res = await fetch(`${API_BASE}/sops/${sopId}/chunks`);
  if (!res.ok) throw new Error("Failed to load SOP details");
  return res.json();
}

export async function uploadSOP(formData) {
  const res = await fetch(`${API_BASE}/sops/upload`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload SOP");
  }
  return res.json();
}
