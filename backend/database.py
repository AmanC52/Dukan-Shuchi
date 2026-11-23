import sqlite3
import shutil
from datetime import datetime
from backend.config import DB_PATH, BACKUP_DIR

def get_connection() -> sqlite3.Connection:
    """Create a connection to the SQLite database with row factory and WAL mode enabled."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")  # High reliability & concurrency
    return conn

def create_backup() -> str:
    """Create an automatic timestamped backup of the database."""
    if not DB_PATH.exists():
        return ""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"dukan_backup_{timestamp}.db"
    shutil.copy2(DB_PATH, backup_file)
    return str(backup_file)

def init_database():
    """Ensure all required tables and schema indexes are created."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Products Table (इन्वेंटरी)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'किराना / सामान्य',
        unit TEXT DEFAULT 'पेटी / Pcs',
        sub_quantity REAL DEFAULT 1.0,
        sub_unit TEXT DEFAULT 'पीस',
        purchase_price REAL NOT NULL DEFAULT 0.0,
        retail_selling_price REAL NOT NULL DEFAULT 0.0,
        selling_price REAL NOT NULL DEFAULT 0.0,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Purchase Trips Table (तारीख वार खरीदारी का इतिहास)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS purchase_trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_date TEXT NOT NULL,
        title TEXT DEFAULT 'बाजार खरीदारी',
        total_items INTEGER DEFAULT 0,
        total_purchase_cost REAL DEFAULT 0.0,
        total_selling_value REAL DEFAULT 0.0,
        total_profit REAL DEFAULT 0.0,
        margin_percent REAL DEFAULT 0.0,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Trip Items Table (हर खरीदारी ट्रिप का आइटम वार विवरण)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trip_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        category TEXT DEFAULT '',
        unit TEXT DEFAULT 'पीस',
        quantity REAL NOT NULL DEFAULT 1.0,
        purchase_price REAL NOT NULL DEFAULT 0.0,
        selling_price REAL NOT NULL DEFAULT 0.0,
        subtotal_purchase REAL NOT NULL DEFAULT 0.0,
        subtotal_selling REAL NOT NULL DEFAULT 0.0,
        profit REAL NOT NULL DEFAULT 0.0,
        FOREIGN KEY (trip_id) REFERENCES purchase_trips (id) ON DELETE CASCADE
    );
    """)

    # Performance Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trips_date ON purchase_trips(trip_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trip_items_trip_id ON trip_items(trip_id);")

    # Safe Schema Migrations
    cursor.execute("PRAGMA table_info(products);")
    prod_cols = [c[1] for c in cursor.fetchall()]
    if "updated_at" not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN updated_at TIMESTAMP;")

    conn.commit()
    conn.close()
