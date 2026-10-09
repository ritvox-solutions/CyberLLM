import os
import re
from datetime import datetime
from typing import List, Optional
from pypdf import PdfReader
from app.config import settings
from app.models.schemas import SOPChunk, SOPDocument
from app.services.vector_store import vector_store

class SOPManager:
    def __init__(self):
        self.sops_metadata_file = os.path.join(settings.DATA_DIR, "sops_metadata.json")
        self.initialize_default_sops()

    def parse_file(self, filepath: str) -> str:
        """Extract raw text from PDF or TXT."""
        ext = os.path.splitext(filepath)[1].lower()
        if ext == ".pdf":
            reader = PdfReader(filepath)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
        else:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

    def chunk_sop_text(self, sop_id: str, title: str, full_text: str) -> List[SOPChunk]:
        """Split SOP into structured sections based on headings (e.g. 1.0, 2.0, Section, Phase)."""
        chunks: List[SOPChunk] = []
        
        # Regex to split on numbered sections or headers like "Phase 1:", "Section 2:"
        section_pattern = re.compile(r'(?m)^(?:(?:Section\s+\d+|Phase\s+\d+|\d+\.\d+|\d+\.)\s*[\:\-\.]?\s*.*)$')
        matches = list(section_pattern.finditer(full_text))
        
        if not matches:
            # Fallback: chunk by 600-word blocks
            words = full_text.split()
            chunk_size = 350
            for i in range(0, len(words), chunk_size):
                chunk_text = " ".join(words[i:i+chunk_size])
                chunks.append(SOPChunk(
                    chunk_id=f"{sop_id}-chunk-{i//chunk_size + 1}",
                    sop_id=sop_id,
                    title=title,
                    section=f"General Guidance Part {i//chunk_size + 1}",
                    content=chunk_text,
                    keywords=list(set(re.findall(r'[a-zA-Z]{4,}', chunk_text.lower())))[:12]
                ))
            return chunks

        for i, match in enumerate(matches):
            section_title = match.group(0).strip()
            start_pos = match.end()
            end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
            section_body = full_text[start_pos:end_pos].strip()
            
            if len(section_body) < 20 and i + 1 < len(matches):
                continue
            
            keywords = list(set(re.findall(r'[a-zA-Z0-9_\-\.]{4,}', (section_title + " " + section_body).lower())))[:15]
            chunks.append(SOPChunk(
                chunk_id=f"{sop_id}-sec-{i+1}",
                sop_id=sop_id,
                title=title,
                section=section_title,
                content=section_body,
                keywords=keywords
            ))
            
        return chunks

    def register_sop(self, sop_id: str, title: str, filename: str, category: str, content: str) -> SOPDocument:
        # Save raw content
        filepath = os.path.join(settings.SOPS_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        chunks = self.chunk_sop_text(sop_id, title, content)
        vector_store.add_chunks(chunks)

        doc = SOPDocument(
            id=sop_id,
            title=title,
            filename=filename,
            threat_category=category,
            uploaded_at=datetime.utcnow().isoformat(),
            chunks_count=len(chunks),
            content_summary=content[:250].replace("\n", " ") + "..."
        )
        return doc

    def get_all_sops(self) -> List[dict]:
        # Return distinct SOP summaries from chunks
        sops_dict = {}
        for chunk in vector_store.chunks:
            if chunk.sop_id not in sops_dict:
                sops_dict[chunk.sop_id] = {
                    "id": chunk.sop_id,
                    "title": chunk.title,
                    "chunks_count": 0,
                    "sample_section": chunk.section
                }
            sops_dict[chunk.sop_id]["chunks_count"] += 1
        return list(sops_dict.values())

    def get_sop_chunks(self, sop_id: str) -> List[SOPChunk]:
        return [c for c in vector_store.chunks if c.sop_id == sop_id]

    def initialize_default_sops(self):
        """Pre-populate standardized SOPs if vector store is currently empty."""
        if len(vector_store.chunks) > 0:
            return

        default_sops = [
            {
                "id": "SOP-SEC-01",
                "title": "Phishing & Social Engineering Incident Response Procedure",
                "filename": "SOP-SEC-01-Phishing.txt",
                "category": "phishing",
                "content": """
STANDARD OPERATING PROCEDURE: PHISHING & SOCIAL ENGINEERING HANDLING
Document ID: SOP-SEC-01 | Classification: Internal Operational | Version: 2.4

1.0 Initial Identification & Triage
- Extract full RFC 822 internet headers, recipient list, sending MTA IP, SPF/DKIM/DMARC authentication results.
- Identify all Indicators of Compromise (IoCs): malicious URLs, embedded tracking pixels, attachment hashes (SHA-256).
- If the email contains a credential harvesting hyperlink, query SIEM proxy/DNS telemetry to check for active clicks by internal users.

2.0 Containment Protocol
- Step 2.1: Submit sender domain and source IP to corporate perimeter firewall and mail gateway blocklists (block SMTP/TLS inbound).
- Step 2.2: Purge the malicious email from all recipient inboxes using M365 Security & Compliance / Google Workspace Admin quarantine API.
- Step 2.3: For any user who clicked the hyperlink or submitted credentials:
    a) Force immediate active session revocation across all IdP tokens (Okta / Azure AD / PingFederate).
    b) Reset active Active Directory / LDAP account passwords.
    c) Enforce MFA re-enrollment and review registered MFA devices for rogue FIDO2/TOTP tokens.

3.0 Eradication & Remediation
- Step 3.1: Null-route malicious domains at corporate DNS Sinkhole resolvers (0.0.0.0).
- Step 3.2: If attachment execution occurred, isolate affected endpoints from VLAN immediately via EDR host isolation.
- Step 3.3: Run deep memory and persistence inspection (Registry Run keys, Scheduled Tasks, WMI event subscriptions).

4.0 Recovery & Post-Incident Review
- Confirm zero active persistence on endpoint before removing network quarantine.
- Send targeted notification to affected users and submit IoC package to threat intelligence platform (MISP / OpenCTI).
"""
            },
            {
                "id": "SOP-SEC-02",
                "title": "Ransomware & Destructive Malware Containment Procedure",
                "filename": "SOP-SEC-02-Ransomware.txt",
                "category": "ransomware",
                "content": """
STANDARD OPERATING PROCEDURE: RANSOMWARE & ADVANCED MALWARE CONTAINMENT
Document ID: SOP-SEC-02 | Classification: Critical Priority | Version: 3.1

1.0 Immediate Triage & Scoping
- Identify initial patient-zero workstation or server from SIEM alerts (high-volume file renames, .locked extensions, shadow copy deletions via vssadmin).
- Determine propagation vectors: SMB (Port 445 / EternalBlue), RDP (Port 3389), PsExec, or compromised service accounts.
- Assess whether enterprise hypervisor or centralized backup repositories are threatened.

2.0 Urgent Containment Protocol
- Step 2.1: Immediately isolate host via EDR network containment. Do NOT power down or reboot the machine to preserve volatile RAM memory for forensic acquisition.
- Step 2.2: Sever SMB/RPC interconnects at core switches between affected subnet and central file servers (port 445 / 139 / 135 block).
- Step 2.3: Freeze administrative service accounts exhibiting anomalous lateral movement in Active Directory.
- Step 2.4: Verify offline immutability of volume shadow backups and enterprise storage snapshots; disable cloud backup sync agents to prevent encrypted file sync.

3.0 Eradication & Decryption Analysis
- Step 3.1: Capture RAM dump with WinPmem / LiME for cryptographic key extraction before malware process termination.
- Step 3.2: Identify ransomware binary hash and check against NoMoreRansom and MITRE ATT&CK databases.
- Step 3.3: Terminate malicious parent and child processes; delete persistence artifacts, scheduled tasks, and rogue services.

4.0 Clean Restoration & Validation
- Re-image infected hosts from validated baseline golden images. Never attempt in-place repair for ransomware infections.
- Restore files from known-good verified air-gapped snapshots prior to infection timestamp.
- Perform continuous 72-hour endpoint telemetry monitoring post-restoration.
"""
            },
            {
                "id": "SOP-SEC-03",
                "title": "Unauthorized Access & Privilege Escalation Response Procedure",
                "filename": "SOP-SEC-03-PrivEsc.txt",
                "category": "unauthorized_access",
                "content": """
STANDARD OPERATING PROCEDURE: UNAUTHORIZED ACCESS & PRIVILEGE ESCALATION
Document ID: SOP-SEC-03 | Classification: Restricted | Version: 2.0

1.0 Incident Identification
- Detect abnormal privilege transitions: additions to 'Domain Admins', 'Enterprise Admins', sudoers modifications, or unexpected token impersonation (SeDebugPrivilege / SeImpersonatePrivilege).
- Detect impossible travel or anomalous location authentications on privileged accounts.

2.0 Containment Actions
- Step 2.1: Immediately disable the compromised identity account in Identity Provider (Active Directory / IAM).
- Step 2.2: Terminate all active Kerberos TGT tickets, OAuth refresh tokens, and interactive terminal/SSH sessions associated with the identity.
- Step 2.3: Restrict inbound access to target server: enforce strict jump-box / bastion host IP allowlisting.

3.0 Forensics & Eradication
- Step 3.1: Audit all commands executed during the unauthorized session via bash_history, auditd, or Windows Event Log 4688 / Sysmon Event ID 1.
- Step 3.2: Check for planted backdoors: authorized_keys modifications, SUID binary creations, hidden local administrative accounts, web shells.
- Step 3.3: Roll the Kerberos krbtgt account password twice if Domain Controller compromise is suspected.

4.0 Recovery & Compliance
- Re-issue cryptographically strong credentials with mandatory hardware-bound security keys (FIDO2 WebAuthn).
- File forensic audit log report within 24 hours in compliance with regulatory notification mandates.
"""
            },
            {
                "id": "SOP-SEC-04",
                "title": "Brute-Force & Credential Stuffing Mitigation Procedure",
                "filename": "SOP-SEC-04-BruteForce.txt",
                "category": "brute_force",
                "content": """
STANDARD OPERATING PROCEDURE: BRUTE FORCE & CREDENTIAL STUFFING ATTACKS
Document ID: SOP-SEC-04 | Classification: Operational | Version: 1.9

1.0 Triage & Attack Pattern Analysis
- Identify attack vector: SSH (port 22), RDP (port 3389), HTTP/REST auth endpoints, VPN gateways.
- Review failure thresholds: >10 failed authentication attempts within 60 seconds against single or multiple accounts.
- Distinguish between distributed credential stuffing (botnet/Tor exit nodes) vs. targeted single-source brute force.

2.0 Rapid Perimeter Containment
- Step 2.1: Trigger automated or manual IP rate-limiting and temporary IP ban (Fail2ban / WAF IP drop rule) for offending CIDR / IP.
- Step 2.2: Invalidate compromised or locked user accounts temporarily to stop password spraying exhaustion.
- Step 2.3: Enforce CAPTCHA / Proof-of-Work challenge on exposed authentication endpoints.

3.0 Eradication & Hardening
- Step 3.1: Disable password authentication on external management ports; mandate certificate/SSH-key based authentication only.
- Step 3.2: Move exposed administrative management ports behind zero-trust network access (ZTNA) or corporate VPN.
- Step 3.3: Inspect successful logins immediately preceding or following the spike to ensure zero breached sessions.

4.0 Log Archival
- Export Netflow, firewall logs, and authentication failure logs into immutable tamper-proof audit storage with SHA-256 validation.
"""
            }
        ]

        for item in default_sops:
            self.register_sop(
                sop_id=item["id"],
                title=item["title"],
                filename=item["filename"],
                category=item["category"],
                content=item["content"].strip()
            )

sop_manager = SOPManager()
