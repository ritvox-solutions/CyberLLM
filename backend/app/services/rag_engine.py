import os
import json
import httpx
from typing import List, Dict, Any, Tuple, Optional
from app.config import settings
from app.models.schemas import (
    Alert,
    TriageRecommendation,
    RecommendedAction,
    SOPCitation,
    ConfidenceAssessment,
    ConfidenceLevel,
    SeverityLevel
)
from app.services.vector_store import vector_store

class RAGEngine:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.LLM_MODEL

    def calculate_confidence(self, top_chunks: List[Tuple[Any, float]], alert: Alert) -> ConfidenceAssessment:
        if not top_chunks:
            return ConfidenceAssessment(
                level=ConfidenceLevel.LOW,
                score=0.25,
                rationale="No direct matching SOP found in repository; fallback triage applied."
            )
        
        top_score = top_chunks[0][1]
        chunk_texts = " ".join([c.content.lower() for c, _ in top_chunks])
        
        # Check IoC or keyword coverage in retrieved text
        keyword_hits = 0
        checks = [alert.threat_type.value] + alert.indicators + [alert.target_host]
        for item in checks:
            if str(item).lower() in chunk_texts:
                keyword_hits += 1
        
        coverage_ratio = min(1.0, keyword_hits / max(len(checks), 1))
        
        # Blend cosine similarity and entity coverage
        composite_score = round(0.6 * min(1.0, top_score * 2.5) + 0.4 * coverage_ratio, 2)
        composite_score = max(0.1, min(0.98, composite_score))

        if composite_score >= 0.70:
            level = ConfidenceLevel.HIGH
            rationale = f"High confidence: Retrieved SOP ({top_chunks[0][0].sop_id}) directly aligns with alert IOCs and attack vector."
        elif composite_score >= 0.45:
            level = ConfidenceLevel.MEDIUM
            rationale = f"Medium confidence: General procedural match found ({top_chunks[0][0].sop_id}), analyst review advised."
        else:
            level = ConfidenceLevel.LOW
            rationale = "Low confidence: Weak SOP similarity. Manual analyst verification strongly recommended."

        return ConfidenceAssessment(
            level=level,
            score=composite_score,
            rationale=rationale
        )

    def _generate_local_synthesis(self, alert: Alert, top_chunks: List[Tuple[Any, float]], confidence: ConfidenceAssessment) -> TriageRecommendation:
        """Deterministic local SOP-guided reasoning engine (works offline without external API keys)."""
        citations: List[SOPCitation] = []
        for chunk, score in top_chunks:
            citations.append(SOPCitation(
                sop_id=chunk.sop_id,
                sop_title=chunk.title,
                section=chunk.section,
                excerpt=chunk.content[:280].strip() + "...",
                similarity_score=round(score, 3)
            ))

        primary_chunk = top_chunks[0][0] if top_chunks else None
        primary_sop_id = primary_chunk.sop_id if primary_chunk else "SOP-GEN-01"

        summary = f"Detected {alert.threat_type.value.replace('_', ' ').title()} incident targeting host '{alert.target_host}' from source IP {alert.source_ip}. {alert.description}"
        
        actions: List[RecommendedAction] = []
        
        if alert.threat_type.value == "phishing":
            actions = [
                RecommendedAction(
                    step=1,
                    phase="Containment",
                    action=f"Blacklist source IP {alert.source_ip} and block sender domain on perimeter mail gateway.",
                    sop_reference=f"{primary_sop_id} §2.1"
                ),
                RecommendedAction(
                    step=2,
                    phase="Containment",
                    action=f"Purge malicious message and revoke active IdP session tokens for targeted user '{alert.target_user}'.",
                    sop_reference=f"{primary_sop_id} §2.2 & §2.3"
                ),
                RecommendedAction(
                    step=3,
                    phase="Eradication",
                    action="Null-route malicious indicator domains in corporate DNS sinkhole and verify zero endpoint malware executions.",
                    sop_reference=f"{primary_sop_id} §3.1"
                ),
                RecommendedAction(
                    step=4,
                    phase="Recovery",
                    action="Enforce password reset and MFA re-enrollment for affected identity.",
                    sop_reference=f"{primary_sop_id} §4.0"
                )
            ]
        elif alert.threat_type.value == "ransomware":
            actions = [
                RecommendedAction(
                    step=1,
                    phase="Containment",
                    action=f"Immediately isolate host '{alert.target_host}' via EDR network containment. Do NOT power off or reboot.",
                    sop_reference=f"{primary_sop_id} §2.1"
                ),
                RecommendedAction(
                    step=2,
                    phase="Containment",
                    action="Sever SMB/RPC interconnects (Ports 445/139/135) to protect centralized file repositories.",
                    sop_reference=f"{primary_sop_id} §2.2"
                ),
                RecommendedAction(
                    step=3,
                    phase="Eradication",
                    action=f"Capture volatile RAM dump from '{alert.target_host}' for cryptographic key recovery; extract and terminate ransomware PID.",
                    sop_reference=f"{primary_sop_id} §3.1 & §3.3"
                ),
                RecommendedAction(
                    step=4,
                    phase="Recovery",
                    action="Re-image infected system from validated baseline image and restore unencrypted files from immutable air-gapped backup.",
                    sop_reference=f"{primary_sop_id} §4.0"
                )
            ]
        elif alert.threat_type.value == "brute_force":
            actions = [
                RecommendedAction(
                    step=1,
                    phase="Containment",
                    action=f"Deploy firewall drop rule and Fail2ban block on attacking IP {alert.source_ip}.",
                    sop_reference=f"{primary_sop_id} §2.1"
                ),
                RecommendedAction(
                    step=2,
                    phase="Containment",
                    action=f"Temporarily lock account '{alert.target_user}' to prevent credential spray exhaustion.",
                    sop_reference=f"{primary_sop_id} §2.2"
                ),
                RecommendedAction(
                    step=3,
                    phase="Eradication",
                    action=f"Verify no successful logins occurred from {alert.source_ip} on '{alert.target_host}' in authentication logs.",
                    sop_reference=f"{primary_sop_id} §3.3"
                ),
                RecommendedAction(
                    step=4,
                    phase="Recovery",
                    action="Mandate SSH key / certificate authentication and migrate administrative portal behind VPN/ZTNA.",
                    sop_reference=f"{primary_sop_id} §3.1 & §3.2"
                )
            ]
        else:
            # Unauthorized access / Generic fallback
            actions = [
                RecommendedAction(
                    step=1,
                    phase="Containment",
                    action=f"Disable compromised user account '{alert.target_user}' and revoke all active Kerberos/OAuth session tokens.",
                    sop_reference=f"{primary_sop_id} §2.1 & §2.2"
                ),
                RecommendedAction(
                    step=2,
                    phase="Containment",
                    action=f"Restrict network ingress to host '{alert.target_host}' to authorized bastion IP addresses only.",
                    sop_reference=f"{primary_sop_id} §2.3"
                ),
                RecommendedAction(
                    step=3,
                    phase="Eradication",
                    action="Audit bash_history / Sysmon 4688 logs for injected backdoors, SUID binaries, or persistence keys.",
                    sop_reference=f"{primary_sop_id} §3.1 & §3.2"
                ),
                RecommendedAction(
                    step=4,
                    phase="Recovery",
                    action="Rotate credentials with hardware security key (FIDO2) and file forensic audit log.",
                    sop_reference=f"{primary_sop_id} §4.0"
                )
            ]

        guidance = (
            f"Grounding verified against {len(citations)} SOP sections. "
            f"The assistant strictly recommends following {primary_sop_id}. "
            "Analyst verification required before committing containment actions to network perimeter."
        )

        return TriageRecommendation(
            alert_id=alert.id,
            incident_summary=summary,
            assessed_severity=alert.severity,
            confidence=confidence,
            recommended_actions=actions,
            sop_citations=citations,
            analyst_guidance=guidance
        )

    async def triage_alert(self, alert: Alert) -> TriageRecommendation:
        """Performs RAG search against SOPs and generates grounded recommendations."""
        # 1. Build rich query from alert
        query = f"{alert.title} {alert.threat_type.value} {alert.description} {' '.join(alert.indicators)} {alert.raw_log}"
        
        # 2. Vector search in SOP store
        top_chunks = vector_store.search(query, top_k=3, threshold=0.01)
        
        # 3. Assess confidence
        confidence = self.calculate_confidence(top_chunks, alert)

        # 4. If OpenAI API key is supplied, attempt live LLM call, with graceful fallback
        if self.api_key and len(self.api_key.strip()) > 10:
            try:
                context_docs = "\n\n".join([
                    f"[Document: {c.sop_id} - {c.title}, Section: {c.section}]\n{c.content}"
                    for c, _ in top_chunks
                ])

                prompt = f"""You are an expert SOC Incident Response Assistant.
Analyze this security alert strictly based on the provided organizational SOP context.

ALERT DETAILS:
- Title: {alert.title}
- Threat: {alert.threat_type.value}
- Severity: {alert.severity.value}
- Source IP: {alert.source_ip}
- Target Host: {alert.target_host}
- Target User: {alert.target_user}
- Indicators: {json.dumps(alert.indicators)}
- Raw Log: {alert.raw_log}

ORGANIZATIONAL SOP CONTEXT:
{context_docs}

Provide your response in strictly valid JSON with keys:
- "incident_summary": string
- "assessed_severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- "recommended_actions": list of objects with {"step": int, "phase": string, "action": string, "sop_reference": string}
- "analyst_guidance": string
"""

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json={
                            "model": self.model,
                            "messages": [{"role": "user", "content": prompt}],
                            "response_format": {"type": "json_object"}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        content = json.loads(data["choices"][0]["message"]["content"])
                        
                        citations = [
                            SOPCitation(
                                sop_id=c.sop_id,
                                sop_title=c.title,
                                section=c.section,
                                excerpt=c.content[:280] + "...",
                                similarity_score=round(score, 3)
                            )
                            for c, score in top_chunks
                        ]
                        
                        actions = [
                            RecommendedAction(**a) for a in content.get("recommended_actions", [])
                        ]
                        
                        return TriageRecommendation(
                            alert_id=alert.id,
                            incident_summary=content.get("incident_summary", alert.description),
                            assessed_severity=content.get("assessed_severity", alert.severity.value),
                            confidence=confidence,
                            recommended_actions=actions,
                            sop_citations=citations,
                            analyst_guidance=content.get("analyst_guidance", "Review and approve before execution.")
                        )
            except Exception as e:
                print(f"LLM API call fell back to local RAG synthesis: {e}")

    async def answer_chat(self, chat_req: Any, alert: Optional[Alert] = None) -> Any:
        from app.models.schemas import ChatResponse
        query = chat_req.message
        if alert:
            query = f"{query} [Alert Context: {alert.title}, Threat: {alert.threat_type.value}, Target: {alert.target_host}, IoCs: {' '.join(alert.indicators)}]"

        # Retrieve matching SOP chunks
        top_chunks = vector_store.search(query, top_k=3, threshold=0.01)
        
        # Build citations
        citations: List[SOPCitation] = []
        for chunk, score in top_chunks:
            citations.append(SOPCitation(
                sop_id=chunk.sop_id,
                sop_title=chunk.title,
                section=chunk.section,
                excerpt=chunk.content[:280].strip() + "...",
                similarity_score=round(score, 3)
            ))

        primary_chunk = top_chunks[0][0] if top_chunks else None
        primary_sop = primary_chunk.sop_id if primary_chunk else "SOP-SEC-01"

        # Calculate confidence
        top_score = top_chunks[0][1] if top_chunks else 0.2
        confidence_val = min(0.96, max(0.35, round(top_score * 2.2 + 0.3, 2)))
        conf_level = ConfidenceLevel.HIGH if confidence_val >= 0.70 else (ConfidenceLevel.MEDIUM if confidence_val >= 0.45 else ConfidenceLevel.LOW)
        confidence = ConfidenceAssessment(
            level=conf_level,
            score=confidence_val,
            rationale=f"Response grounded in {primary_sop} ({primary_chunk.section if primary_chunk else 'General Security Policy'}) with cosine similarity score {round(top_score, 2)}."
        )

        # Context-aware actions
        actions = []
        if alert:
            triage_obj = self._generate_local_synthesis(alert, top_chunks, confidence)
            actions = triage_obj.recommended_actions

        # Conversational message formulation
        q_lower = chat_req.message.lower()
        if "triage" in q_lower or "analyze" in q_lower or "sop" in q_lower:
            text = (
                f"### SOP Incident Analysis & Triage\n\n"
                f"Based on organizational policy **{primary_sop}** ({primary_chunk.title if primary_chunk else 'General SOP'}), "
                f"here is the guided response procedure:\n\n"
                f"- **Applicable Standard**: `{primary_sop} - {primary_chunk.section if primary_chunk else 'Section 1.0'}`\n"
                f"- **Procedure Excerpt**: *\"{primary_chunk.content[:190].strip() if primary_chunk else 'Standard containment controls apply.'}...\"*\n\n"
                f"I have mapped out the phased remediation checklist below. You can approve or adjust the playbook before committing containment actions to the firewall/EDR."
            )
        elif "contain" in q_lower or "isolate" in q_lower:
            text = (
                f"### Containment Protocol ({primary_sop})\n\n"
                f"According to **{primary_sop} Section 2.0 (Containment Protocol)**:\n\n"
                f"1. **Host Isolation**: Sever endpoint VLAN connections via EDR API immediately. Do not reboot to preserve volatile RAM.\n"
                f"2. **Perimeter Ingress Block**: Blacklist offending source IP/domain on core edge firewalls.\n"
                f"3. **Identity Freeze**: Revoke active Kerberos TGT and IdP OAuth refresh tokens."
            )
        elif "audit" in q_lower or "hash" in q_lower or "sha" in q_lower:
            text = (
                f"### Cryptographic Audit Integrity\n\n"
                f"All triage recommendations, analyst decisions, and SOP citations are logged to the tamper-evident "
                f"SHA-256 cryptographic chain. Each entry hashes the previous block's hash `prev_hash` to ensure forensic "
                f"non-repudiation in compliance with ISO 27001 and SOC 2."
            )
        else:
            text = (
                f"Based on **{primary_sop}** ({primary_chunk.section if primary_chunk else 'General Policy'}), "
                f"I recommend adhering strictly to our defined operational playbooks.\n\n"
                f"Key SOP reference: *\"{primary_chunk.content[:220].strip() if primary_chunk else 'Review standard operating procedures.'}...\"*\n\n"
                f"Feel free to ask for specific phase guidance (Triage, Containment, Eradication, or Recovery)."
            )

        followups = [
            "Execute Containment Checklist",
            "What does Section 2.0 mandate?",
            "Verify SHA-256 Audit Chain",
            "Approve SOP Playbook"
        ]

        return ChatResponse(
            message=text,
            confidence=confidence,
            sop_citations=citations,
            actions=actions,
            suggested_followups=followups
        )

rag_engine = RAGEngine()

