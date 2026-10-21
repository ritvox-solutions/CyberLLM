from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models.db_models import Base


def _build_engine():
    url = settings.effective_database_url
    kwargs = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(url, **kwargs)


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_ticket_status_nullable()


def _migrate_ticket_status_nullable(bind=engine) -> None:
    if bind.dialect.name != "sqlite":
        return
    with bind.begin() as connection:
        columns = connection.exec_driver_sql("PRAGMA table_info(tickets)").mappings().all()
        status = next((column for column in columns if column["name"] == "status"), None)
        if not status or not status["notnull"]:
            return

        # shortcut: SQLite has no ALTER COLUMN; replace with Alembic before adding another database migration.
        connection.exec_driver_sql("DROP TABLE IF EXISTS tickets_migrating")
        connection.exec_driver_sql("""
            CREATE TABLE tickets_migrating (
                id VARCHAR NOT NULL PRIMARY KEY,
                title VARCHAR NOT NULL,
                threat_type VARCHAR NOT NULL,
                severity VARCHAR NOT NULL,
                status VARCHAR,
                source_ip VARCHAR,
                target_host VARCHAR,
                description TEXT NOT NULL,
                created_at DATETIME NOT NULL
            )
        """)
        connection.exec_driver_sql("""
            INSERT INTO tickets_migrating
                (id, title, threat_type, severity, status, source_ip, target_host, description, created_at)
            SELECT id, title, threat_type, severity, NULL, source_ip, target_host, description, created_at
            FROM tickets
        """)
        connection.exec_driver_sql("DROP TABLE tickets")
        connection.exec_driver_sql("ALTER TABLE tickets_migrating RENAME TO tickets")
