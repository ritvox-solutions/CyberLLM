import json
import os
import random
from datetime import datetime
from typing import List, Optional
from app.config import settings
from app.models.schemas import Alert, AlertCreate, SeverityLevel, ThreatType, IncidentStatus

class AlertService:
    def __init__(self, storage_path: str = settings.ALERTS_FILE):
        self.storage_path = storage_path
        self.alerts: List[Alert] = []
        self.load()
        if not self.alerts:
            self.seed_initial_alerts()

    def get_all(self, status: Optional[str] = None) -> List[Alert]:
        if status:
            return [a for a in self.alerts if a.status.value == status]
        return list(reversed(self.alerts))

    def get_by_id(self, alert_id: str) -> Optional[Alert]:
        for a in self.alerts:
            if a.id == alert_id:
                return a
        return None

    def create_alert(self, alert_in: AlertCreate) -> Alert:
        alert_id = f"ALT-{random.randint(1000, 9999)}"
        alert = Alert(
            id=alert_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            status=IncidentStatus.NEW,
            **alert_in.model_dump()
        )
        self.alerts.append(alert)
        self.save()
        return alert

    def update_alert(self, alert: Alert):
        for i, a in enumerate(self.alerts):
            if a.id == alert.id:
                self.alerts[i] = alert
                self.save()
                return

    def generate_simulation_scenario(self, scenario_type: str) -> Alert:
        scenarios = {
            "phishing": AlertCreate(
                title="Credential Harvester Targeting Finance Group",
                threat_type=ThreatType.PHISHING,
                severity=SeverityLevel.HIGH,
                source_ip="185.220.101.45",
                target_host="ws-fin-09.corp.internal",
                target_user="cfo_assistant@enterprise.com",
                indicators=[
                    "hxxps://sso-secure-portal.update-payroll-login.net",
                    "mail-from: urgent-payroll@acc0unt-update.net",
                    "SHA256: 4b227777d4da1fc910b80989f64e10e7b767d40228383a15"
                ],
                raw_log="Oct 05 11:32:01 mailgateway filter[4921]: SPF PASS, DKIM FAIL, link extraction flagged high entropy domain target ws-fin-09",
                description="User reported an urgent email claiming payroll banking details need re-verification. Proxy logs indicate an outbound POST to a known credential harvesting domain."
            ),
            "ransomware": AlertCreate(
                title="Anomalous File Encryption & Shadow Copy Deletion",
                threat_type=ThreatType.RANSOMWARE,
                severity=SeverityLevel.CRITICAL,
                source_ip="10.4.18.99",
                target_host="srv-file-archive01.prod.internal",
                target_user="backup_svc",
                indicators=[
                    "Process: vssadmin.exe delete shadows /all /quiet",
                    "Extension: .cryptLock",
                    "Outbound Beacon: 91.240.118.17:443"
                ],
                raw_log="Oct 05 11:40:12 srv-file-archive01 Sysmon[1]: EventID 1: Image=C:\\Windows\\System32\\vssadmin.exe ParentImage=C:\\Users\\backup_svc\\AppData\\Local\\Temp\\update.exe CommandLine=vssadmin delete shadows /all /quiet",
                description="EDR alert triggered: rapid bulk modification of files in network share with known ransomware extension. Process attempting to purge volume shadow copies."
            ),
            "brute_force": AlertCreate(
                title="High-Frequency SSH Authentication Failures",
                threat_type=ThreatType.BRUTE_FORCE,
                severity=SeverityLevel.MEDIUM,
                source_ip="203.0.113.195",
                target_host="bastion-gw-ext.cloud.internal",
                target_user="root",
                indicators=[
                    "Failed attempts: 247 in 60s",
                    "Port: 22 (SSH)",
                    "Usernames: root, admin, ubuntu, deploy"
                ],
                raw_log="Oct 05 11:42:00 bastion-gw sshd[8814]: Failed password for invalid user admin from 203.0.113.195 port 54122 ssh2 [repeated 247 times in 60s]",
                description="Perimeter authentication firewall logged rapid-fire dictionary attack against SSH bastion port 22 from an untrusted public external IP."
            ),
            "unauthorized_access": AlertCreate(
                title="Privilege Escalation via Sudoers Token Impersonation",
                threat_type=ThreatType.UNAUTHORIZED_ACCESS,
                severity=SeverityLevel.HIGH,
                source_ip="10.2.14.50",
                target_host="core-db-replica01.internal",
                target_user="guest_app_user",
                indicators=[
                    "Auditd: /etc/sudoers write event",
                    "New UID: 0 (root)",
                    "Binary: /tmp/pwn_priv"
                ],
                raw_log="Oct 05 11:44:33 core-db-replica01 auditd[1022]: type=EXECVE msg=audit(1728128673.111:401): argc=3 a0=\"sudo\" a1=\"-u\" a2=\"root\" a3=\"/tmp/pwn_priv\"",
                description="Low-privilege application account successfully escalated execution privileges to root by exploiting an unauthorized sudo privilege transition."
            )
        }

        template = scenarios.get(scenario_type, scenarios["phishing"])
        return self.create_alert(template)

    def seed_initial_alerts(self):
        self.generate_simulation_scenario("phishing")
        self.generate_simulation_scenario("ransomware")
        self.generate_simulation_scenario("brute_force")
        self.generate_simulation_scenario("unauthorized_access")

    def save(self):
        data = [a.model_dump() for a in self.alerts]
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.alerts = [Alert(**a) for a in data]
            except Exception as e:
                print(f"Warning: could not load alerts: {e}")
                self.alerts = []

alert_service = AlertService()
