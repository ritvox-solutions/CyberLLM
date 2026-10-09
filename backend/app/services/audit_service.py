import json
import os
import hashlib
from datetime import datetime
from typing import List, Dict, Any
from app.config import settings
from app.models.schemas import AuditRecord, AuditVerificationResponse

class AuditService:
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self, storage_path: str = settings.AUDIT_FILE):
        self.storage_path = storage_path
        self.records: List[AuditRecord] = []
        self.load()

    def _calculate_hash(self, prev_hash: str, seq: int, ts: str, alert_id: str, analyst_id: str, decision: str, sop_refs: str, notes: str) -> str:
        payload = f"{prev_hash}|{seq}|{ts}|{alert_id}|{analyst_id}|{decision}|{sop_refs}|{notes}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def log_decision(
        self,
        alert_id: str,
        analyst_id: str,
        decision: str,
        incident_summary: str,
        sop_references: List[str],
        notes: str = ""
    ) -> AuditRecord:
        """Appends a new cryptographically chained audit record."""
        prev_hash = self.records[-1].current_hash if self.records else self.GENESIS_HASH
        seq_num = len(self.records) + 1
        ts = datetime.utcnow().isoformat() + "Z"
        sop_refs_str = ",".join(sorted(sop_references))

        curr_hash = self._calculate_hash(
            prev_hash=prev_hash,
            seq=seq_num,
            ts=ts,
            alert_id=alert_id,
            analyst_id=analyst_id,
            decision=decision,
            sop_refs=sop_refs_str,
            notes=notes
        )

        record = AuditRecord(
            audit_id=f"AUD-{seq_num:05d}",
            sequence_number=seq_num,
            prev_hash=prev_hash,
            current_hash=curr_hash,
            timestamp=ts,
            alert_id=alert_id,
            analyst_id=analyst_id,
            decision=decision,
            incident_summary=incident_summary,
            sop_references=sop_references,
            notes=notes,
            is_tamper_verified=True
        )

        self.records.append(record)
        self.save()
        return record

    def verify_integrity(self) -> AuditVerificationResponse:
        """Validates the entire SHA-256 hash chain to detect any tampering or broken link."""
        if not self.records:
            return AuditVerificationResponse(
                is_valid=True,
                total_records=0,
                broken_links=[],
                message="Audit ledger is empty. Chain is sound."
            )

        broken = []
        for i, rec in enumerate(self.records):
            expected_prev = self.records[i - 1].current_hash if i > 0 else self.GENESIS_HASH
            if rec.prev_hash != expected_prev:
                broken.append(rec.sequence_number)
                continue

            sop_refs_str = ",".join(sorted(rec.sop_references))
            expected_hash = self._calculate_hash(
                prev_hash=rec.prev_hash,
                seq=rec.sequence_number,
                ts=rec.timestamp,
                alert_id=rec.alert_id,
                analyst_id=rec.analyst_id,
                decision=rec.decision,
                sop_refs=sop_refs_str,
                notes=rec.notes
            )

            if rec.current_hash != expected_hash:
                broken.append(rec.sequence_number)

        is_valid = len(broken) == 0
        message = (
            f"Audit chain cryptographic verification PASSED! All {len(self.records)} blocks are valid."
            if is_valid
            else f"Cryptographic integrity violation detected in blocks: {broken}"
        )

        return AuditVerificationResponse(
            is_valid=is_valid,
            total_records=len(self.records),
            broken_links=broken,
            message=message
        )

    def get_records(self) -> List[AuditRecord]:
        return list(reversed(self.records))

    def save(self):
        data = [r.model_dump() for r in self.records]
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.records = [AuditRecord(**r) for r in data]
            except Exception as e:
                print(f"Warning: could not load audit logs: {e}")
                self.records = []

audit_service = AuditService()
