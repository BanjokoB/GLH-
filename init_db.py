import sqlite3
from werkzeug.security import generate_password_hash

DB_NAME = "new_database.db"

def get_db():
    conn = sqlite3.connect(DB_NAME)
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        address TEXT,
        loyalty INTEGER DEFAULT 0,
        role TEXT DEFAULT 'user'
    )
    """)

    # Categories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        image TEXT
    )
    """)

    # Products
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category TEXT,
        description TEXT,
        producer TEXT,
        image TEXT
        stock INTEGER DEFAULT 100
    )
    """)

    # Orders
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        order_date TEXT,
        status TEXT,
        total REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_date TEXT")
    except:
     pass

    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN collection_time TEXT")
    except:
        pass

    try:
        cursor.execute("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0")
    except:
        pass

    try:
        cursor.execute("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 100")
    except:
        pass


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    name TEXT,
    price REAL,
    quantity INTEGER
)
    """)

    # Saved Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        item_id INTEGER,
        name TEXT,
        price REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Addresses
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        line1 TEXT,
        line2 TEXT,
        city TEXT,
        zip TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    conn.commit()
    conn.close()

def seed_data():
    conn = get_db()
    cursor = conn.cursor()

    # Categories
    if cursor.execute("SELECT COUNT(*) FROM categories").fetchone()[0] == 0:
        cursor.executemany("""
        INSERT INTO categories (name, image) VALUES (?, ?)
        """, [
            ("Fruits", "/static/images/julia-zolotova-M_xIaxQE3Ms-unsplash.jpg"),
            ("Vegetables", "/static/images/randy-fath-5aJVJvJ9rG8-unsplash.jpg"),
            ("Dairy", "/static/images/mehrshad-rajabi-P7MkoYvSnLI-unsplash.jpg"),
            ("Bakery","/static/images/yeh-xintong-go3DT3PpIw4-unsplash.jpg" )
        ])

    # Products
    if cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        cursor.executemany("""
        INSERT INTO products (name, price, category, description, producer, image)
        VALUES (?, ?, ?, ?, ?, ?)
        """, [
            ("Organic Apples", 4.99, "Fruits", "Crisp and sweet variety. 1kg pack.", "Shooter's hill farm", "/static/images/image.png"),
            ("Fresh Milk", 3.49, "Dairy", "Whole milk. 2 litres.", "Shooter's hill farm", "/static/images/milk.jpg")
        ])

    # Admin User
    if cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO users (
            first_name, last_name, email, password, address, loyalty, role
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "Bassit",
            "Banjoko",
            "bassitbanjoko@gmail.com",
            generate_password_hash("admin123"),  # hashed now
            "London",
            1,
            "admin"
        ))

    # Orders
    if cursor.execute("SELECT COUNT(*) FROM orders").fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO orders (user_id, order_date, status, total)
        VALUES (?, ?, ?, ?)
        """, (
            1,
            "2026-04-17",
            "Delivered",
            28.99
        ))

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,            -- 'earn' or 'redeem'
        points INTEGER,
        description TEXT,
        date TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Saved Items
    if cursor.execute("SELECT COUNT(*) FROM saved_items").fetchone()[0] == 0:
        cursor.executemany("""
        INSERT INTO saved_items (user_id, item_id, name, price)
        VALUES (?, ?, ?, ?)
        """, [
            (1, 1, "Bananas", 2.99),
            (1, 2, "Chicken", 9.99)
        ])

    # Addresses
    if cursor.execute("SELECT COUNT(*) FROM addresses").fetchone()[0] == 0:
        cursor.executemany("""
        INSERT INTO addresses (user_id, type, line1, line2, city, zip)
        VALUES (?, ?, ?, ?, ?, ?)
        """, [
            (1, "Billing", "123 Main St", "Apt 101", "London", "SW1A 1AA"),
            (1, "Shipping", "456 Oak Rd", "Building B", "London", "SW2B 2BB")
        ])

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_data()
    print("Database created and seeded successfully!")