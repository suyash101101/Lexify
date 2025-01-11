import os
import json
from typing import List, Optional, Dict
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

class PostgresClient:
    def __init__(self):
        self.conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST"),
            database=os.getenv("POSTGRES_DATABASE"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            sslmode="require"
        )
        self._create_tables()

    def _create_tables(self):
        """Create necessary tables if they don't exist"""
        with self.conn.cursor() as cur:
            # Cases table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS cases (
                    case_id TEXT PRIMARY KEY,
                    data JSONB NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Chat messages table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id SERIAL PRIMARY KEY,
                    room_id TEXT NOT NULL,
                    message JSONB NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Credits table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_credits (
                    user_id TEXT PRIMARY KEY,
                    credits INTEGER NOT NULL DEFAULT 0,
                    last_reset TIMESTAMP WITH TIME ZONE
                )
            """)

            # Transaction history table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS transaction_history (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    transaction_type TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    description TEXT,
                    reference_id TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # User activity logs table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_activity_logs (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    activity_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    metadata JSONB,
                    ip_address TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            self.conn.commit()

    # Existing case management methods
    def get_case(self, case_id: str) -> Optional[dict]:
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT data FROM cases WHERE case_id = %s", (case_id,))
            result = cur.fetchone()
            return result['data'] if result else None

    def create_case(self, case_id: str, case_data: dict) -> dict:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO cases (case_id, data) VALUES (%s, %s)",
                (case_id, json.dumps(case_data))
            )
            self.conn.commit()
            return case_data

    def update_case(self, case_id: str, case_data: dict) -> dict:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE cases SET data = %s WHERE case_id = %s",
                (json.dumps(case_data), case_id)
            )
            self.conn.commit()
            return case_data

    def delete_case(self, case_id: str) -> bool:
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM cases WHERE case_id = %s", (case_id,))
            self.conn.commit()
            return True

    def list_cases(self) -> List[dict]:
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT data FROM cases")
            return [row['data'] for row in cur.fetchall()]

    # Chat methods
    def append_chat_message(self, room_id: str, message: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chat_messages (room_id, message) VALUES (%s, %s)",
                (room_id, json.dumps(message))
            )
            self.conn.commit()

    def get_chat_messages(self, room_id: str) -> List[dict]:
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT message FROM chat_messages WHERE room_id = %s ORDER BY created_at",
                (room_id,)
            )
            return [row['message'] for row in cur.fetchall()]

    # Credits methods
    def get_user_credits(self, user_id: str) -> Optional[int]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT credits FROM user_credits WHERE user_id = %s",
                (user_id,)
            )
            result = cur.fetchone()
            return result[0] if result else None

    def update_user_credits(self, user_id: str, credits: int) -> None:
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO user_credits (user_id, credits)
                VALUES (%s, %s)
                ON CONFLICT (user_id)
                DO UPDATE SET credits = %s
            """, (user_id, credits, credits))
            self.conn.commit()

    def update_credits_last_reset(self, user_id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute("""
                UPDATE user_credits
                SET last_reset = CURRENT_TIMESTAMP
                WHERE user_id = %s
            """, (user_id,))
            self.conn.commit()

    # Transaction history methods
    def add_transaction(self, user_id: str, transaction_type: str, amount: int, description: str, reference_id: Optional[str] = None) -> None:
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO transaction_history 
                (user_id, transaction_type, amount, description, reference_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, transaction_type, amount, description, reference_id))
            self.conn.commit()

    def get_user_transactions(self, user_id: str, limit: int = 50) -> List[Dict]:
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM transaction_history 
                WHERE user_id = %s 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (user_id, limit))
            return cur.fetchall()

    # User activity logging methods
    def log_activity(self, user_id: str, activity_type: str, description: str, metadata: Optional[Dict] = None, ip_address: Optional[str] = None) -> None:
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO user_activity_logs 
                (user_id, activity_type, description, metadata, ip_address)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, activity_type, description, json.dumps(metadata) if metadata else None, ip_address))
            self.conn.commit()

    def get_user_activity_logs(self, user_id: str, limit: int = 50) -> List[Dict]:
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM user_activity_logs 
                WHERE user_id = %s 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (user_id, limit))
            return cur.fetchall()

postgres_client = PostgresClient() 