import sqlite3

conn = sqlite3.connect("your_database.db")
cursor = conn.cursor()

user_id = 1

cursor.execute("""
    UPDATE users
    SET role = 'admin'
    WHERE email = ?
""", (user_id,))

conn.commit()
conn.close()

print("User promoted to admin")