from sqlalchemy import text
from database import engine
from models import Base

with engine.connect() as conn:
    print("Dropping all tables with CASCADE...")
    # Get all table names
    res = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
    tables = [row[0] for row in res]
    for table in tables:
        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
    conn.commit()

print("Creating fresh tables...")
Base.metadata.create_all(bind=engine)
print("Database reset complete.")
