from flask import Flask, jsonify, render_template, request, session, redirect, url_for
import sqlite3
import os
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from init_db import init_db, seed_data


app = Flask(__name__)

app.secret_key = "supersecretkey"

# SESSION FIX (prevents login loop)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False

UPLOAD_FOLDER = "static/images"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database connection
def get_db():
    conn = sqlite3.connect("new_database.db")
    conn.row_factory = sqlite3.Row
    return conn

# HTML links/Routes  

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/account")
def account():
    if "user_id" not in session:
        return redirect(url_for("login"))
    
    user_id = session["user_id"]
    conn = get_db()

    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    orders = conn.execute("SELECT * FROM orders WHERE user_id = ?", (user_id,)).fetchall()
    saved_items = conn.execute("SELECT * FROM saved_items WHERE user_id = ?", (user_id,)).fetchall()
    addresses = conn.execute("SELECT * FROM addresses WHERE user_id = ?", (user_id,)).fetchall()

    conn.close()

    return render_template("userAccount.html", user=user, orders=orders, saved_items=saved_items, addresses=addresses)


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/signup")
def signup():
    return render_template("signup.html")


@app.route("/loyalty")
def loyalty():
    return render_template("loyalty.html")


@app.route("/admin")
def admin():
    if "user_id" not in session:
        return redirect(url_for("login"))

    if session.get("role") != "admin":
        return redirect(url_for("home"))

    return render_template("admin.html")

@app.route("/manager")
def admin_page():
    if "user_id" not in session:
        return redirect("/login")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM users WHERE id = ?", (session["user_id"],))
    role = cursor.fetchone()[0]

    conn.close()

    if role != "admin":
        return "Access denied", 403

    return render_template("manager.html")

@app.route("/cart")
def cart():
    return render_template("cart.html")


@app.route('/api/cart/<int:product_id>', methods=["POST"])
def add_to_cart(product_id):
    if "user_id" not in session:
        return jsonify({"message": "You must be logged in to add products to the cart."}), 401
    
    if "cart" not in session:
        session["cart"] = []

    if product_id in session["cart"]:
        return jsonify({"message": "Product already in the cart."}), 400
    
    session["cart"].append(product_id)
    session.modified = True

    return jsonify({"message": "Product added to cart successfully!"})


@app.route('/add-product')
def add_product_page():
    return render_template('addProduct.html')

@app.route("/order-success")
def order_success():
    return render_template("orderSuccess.html")

@app.route("/accessibility")
def accessibility():
    return render_template("accessibility.html")

# API ROUTES

#Api route for categories
@app.route("/api/categories")
def get_categories():
    conn = get_db()
    categories = conn.execute("SELECT * FROM categories").fetchall()
    conn.close()
    return jsonify([dict(row) for row in categories])

#Api route for products 
@app.route("/api/products")
def get_products():
    conn = get_db()
    products = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    return jsonify([dict(row) for row in products])

#Api routes for user
@app.route('/api/user')
def get_user_data():
    if "user_id" not in session:
        return jsonify({'error': 'User not logged in'}), 401

    user_id = session["user_id"]
    conn = get_db()

    user_data = conn.execute(
        'SELECT first_name, last_name, email FROM users WHERE id = ?', 
        (user_id,)
    ).fetchone()

    if user_data:

        orders_raw = conn.execute("""
            SELECT id, order_date, status, total, delivery_date, collection_time
            FROM orders
            WHERE user_id = ?
        """, (user_id,)).fetchall()

        orders = []

        for order in orders_raw:
            items = conn.execute(
                'SELECT quantity FROM order_items WHERE order_id = ?', 
                (order["id"],)
            ).fetchall()

            total_items = sum(item["quantity"] for item in items)

            orders.append({
                "order_id": order["id"],
                "date": order["order_date"],
                "status": order["status"],
                "total": order["total"],
                "items": total_items,
                "delivery_date": order["delivery_date"],
                "collection_time": order["collection_time"]
            })

        saved_items = conn.execute(
            'SELECT item_id, name, price FROM saved_items WHERE user_id = ?', 
            (user_id,)
        ).fetchall()

        addresses = conn.execute(
            'SELECT type, line1, line2, city, zip FROM addresses WHERE user_id = ?', 
            (user_id,)
        ).fetchall()

        conn.close()

        return jsonify({
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'email': user_data['email'],
            'orders': orders,
            'saved_items': [dict(item) for item in saved_items],
            'addresses': [dict(address) for address in addresses]
        })

    else:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
#Api route 
@app.route("/api/users", methods=["GET"])
def get_users():
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, email, role FROM users")
    users = cursor.fetchall()

    conn.close()

    return jsonify([
        {"id": u[0], "email": u[1], "role": u[2]}
        for u in users
    ])


@app.route("/api/users/<int:user_id>/role", methods=["POST"])
def update_role(user_id):
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401

    data = request.json
    new_role = data.get("role")

    # only allow valid roles
    if new_role not in ["user", "admin"]:
        return jsonify({"error": "invalid role"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE users
        SET role = ?
        WHERE id = ?
    """, (new_role, user_id))

    conn.commit()
    conn.close()

    return jsonify({"message": "role updated"})


@app.route("/api/admin/orders")
def admin_get_orders():
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    conn = get_db()

    orders = conn.execute("""
        SELECT orders.id, users.first_name, users.last_name,
               orders.total, orders.status,
               orders.order_date, orders.delivery_date, orders.collection_time
        FROM orders
        JOIN users ON orders.user_id = users.id
        ORDER BY orders.id DESC
    """).fetchall()

    conn.close()

    return jsonify([dict(o) for o in orders])


@app.route("/api/admin/orders/<int:order_id>", methods=["POST"])
def update_order(order_id):
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    status = data.get("status")
    delivery_date = data.get("delivery_date")
    collection_time = data.get("collection_time")

    conn = get_db()

    conn.execute("""
        UPDATE orders
        SET status = ?,
            delivery_date = ?,
            collection_time = ?
        WHERE id = ?
    """, (status, delivery_date, collection_time, order_id))

    conn.commit()
    conn.close()

    return jsonify({"message": "Order updated"})

@app.route("/api/admin/stats")
def admin_stats():
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    conn = get_db()
    cursor = conn.cursor()

    # Orders today
    orders_today = cursor.execute("""
        SELECT COUNT(*) FROM orders
        WHERE DATE(order_date) = DATE('now')
    """).fetchone()[0]

    # Revenue total
    revenue = cursor.execute("""
        SELECT COALESCE(SUM(total), 0) FROM orders
    """).fetchone()[0]

    # Total customers
    customers = cursor.execute("""
        SELECT COUNT(*) FROM users WHERE role = 'user'
    """).fetchone()[0]

    # Total products
    products = cursor.execute("""
        SELECT COUNT(*) FROM products
    """).fetchone()[0]

    conn.close()

    return jsonify({
        "orders_today": orders_today,
        "revenue": revenue,
        "customers": customers,
        "products": products
    })

@app.route("/api/me")
def get_current_user(): 
    if "user_id" not in session:
        return jsonify({"logged_in": False})

    user_id = session["user_id"]
    conn = get_db()
    user = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    return jsonify({"logged_in": True, "role": user["role"]})


# SIGNUP
@app.route("/api/signup", methods=["POST"])
def signup_user():
    data = request.json

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    address = data.get("address", "").strip()
    loyalty = 1 if data.get("loyalty") else 0

    if not first_name or not last_name:
        return jsonify({"message": "Name is required"}), 400

    if not email:
        return jsonify({"message": "Email is required"}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    if password != confirm_password:
        return jsonify({"message": "Passwords do not match"}), 400

    conn = get_db()
    cursor = conn.cursor()

    existing = cursor.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if existing:
        return jsonify({"message": "Email already exists"}), 400

    password_hash = generate_password_hash(password)

    cursor.execute(""" 
        INSERT INTO users (
            first_name,
            last_name,
            email,
            password,
            address,
            loyalty,
            role
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        first_name,
        last_name,
        email,
        password_hash,
        address,
        loyalty,
        "user"
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "User created"})

#Checkout
@app.route("/api/checkout", methods=["POST"])
def checkout():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401

    user_id = session["user_id"]
    data = request.json

    items = data.get("items", [])
    total = data.get("total", 0)
    delivery_option = data.get("deliveryOption", "delivery")

    conn = get_db()
    cursor = conn.cursor()

    # 1. CREATE ORDER FIRST
    cursor.execute("""
        INSERT INTO orders (user_id, order_date, status, total)
        VALUES (?, DATE('now'), 'Paid', ?)
    """, (user_id, total))

    order_id = cursor.lastrowid

    # 2. SAVE ORDER ITEMS + REDUCE STOCK
    for item in items:

        # Save item
        cursor.execute("""
            INSERT INTO order_items (order_id, product_id, name, price, quantity)
            VALUES (?, ?, ?, ?, ?)
        """, (
            order_id,
            item["id"],
            item["name"],
            item["price"],
            item["quantity"]
        ))

        # Reduce stock
        cursor.execute("""
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
        """, (
            item["quantity"],
            item["id"]
        ))

    # 3. LOYALTY POINTS
    points = int(total * 10)

    cursor.execute("""
        INSERT INTO loyalty_transactions (user_id, type, points, description, date)
        VALUES (?, 'earn', ?, ?, DATE('now'))
    """, (
        user_id,
        points,
        f"Order #{order_id}"
    ))

    cursor.execute("""
        UPDATE products
        SET stock = MAX(stock - ?, 0)
        WHERE id = ?
    """, (item["quantity"], item["id"]))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Order placed",
        "order_id": order_id,
        "points_earned": points
    })

#Update stock API route (for admin control)
@app.route("/api/inventory/<int:id>", methods=["POST"])
def update_stock(id):
    if session.get("role") != "admin":
        return jsonify({"error": "unauthorized"}), 403

    data = request.json
    new_stock = data.get("stock")

    conn = get_db()
    conn.execute("""
        UPDATE products
        SET stock = ?
        WHERE id = ?
    """, (new_stock, id))

    conn.commit()
    conn.close()

    return jsonify({"message": "stock updated"})

#Admin inventopry API
@app.route("/api/inventory")
def get_inventory():
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_db()

    products = conn.execute("""
        SELECT id, name, stock, price
        FROM products
        ORDER BY stock ASC
    """).fetchall()

    conn.close()

    return jsonify([dict(row) for row in products])

@app.route("/api/orders")
def get_orders():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401

    conn = get_db()

    orders = conn.execute("""
        SELECT * FROM orders WHERE user_id = ?
    """, (session["user_id"],)).fetchall()

    result = []

    for order in orders:
        items = conn.execute("""
            SELECT * FROM order_items WHERE order_id = ?
        """, (order["id"],)).fetchall()

        result.append({
            "order": dict(order),
            "items": [dict(i) for i in items]
        })

    conn.close()

    return jsonify(result)

# LOGIN
@app.route("/api/login", methods=["POST"])
def login_user():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    ).fetchone()
    conn.close()

    if user and check_password_hash(user["password"], password):
        session["user_id"] = user["id"]
        session["role"] = user["role"]

        return jsonify({
            "message": "Login successful",
            "role": user["role"]
        })

    return jsonify({"message": "Invalid credentials"}), 401


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))


# CREATE PRODUCT 
@app.route("/api/products", methods=["POST"])
def add_product():
    try:
        name = request.form.get("name")
        price = request.form.get("price")
        category = request.form.get("category")
        description = request.form.get("description")
        producer = request.form.get("producer")

        image_file = request.files.get("image")
        image_path = None

        if image_file and image_file.filename != "":
            filename = secure_filename(image_file.filename)

            upload_folder = os.path.join("static", "images")
            os.makedirs(upload_folder, exist_ok=True)

            save_path = os.path.join(upload_folder, filename)
            image_file.save(save_path)

            image_path = f"/static/images/{filename}"

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO products (name, price, category, description, producer, image)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            name,
            price,
            category,
            description,
            producer,
            image_path
        ))

        conn.commit()
        conn.close()

        return jsonify({"message": "Product added successfully"}), 200

    except Exception as e:
        print("ADD PRODUCT ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<int:id>", methods=["DELETE"])
def delete_product(id):
    if "role" not in session or session["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Product deleted"})

# Loyalty
@app.route("/api/loyalty")
def get_loyalty():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401

    user_id = session["user_id"]
    conn = get_db()

    # Get total points from transactions
    transactions = conn.execute("""
        SELECT type, points, description, date
        FROM loyalty_transactions
        WHERE user_id = ?
        ORDER BY date DESC
    """, (user_id,)).fetchall()

    total_points = 0
    activity = []

    for t in transactions:
        if t["type"] == "earn":
            total_points += t["points"]
        else:
            total_points -= t["points"]

        activity.append({
            "action": t["description"],
            "points": t["points"] if t["type"] == "earn" else -t["points"],
            "date": t["date"]
        })

    conn.close()

    return jsonify({
        "totalPoints": total_points,
        "activity": activity
    })

#Redeem loyalty points 
@app.route("/api/redeem", methods=["POST"])
def redeem_reward():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    points_required = data.get("points")
    description = data.get("reward")

    user_id = session["user_id"]
    conn = get_db()

    # Calculate current points
    transactions = conn.execute("""
        SELECT type, points FROM loyalty_transactions WHERE user_id = ?
    """, (user_id,)).fetchall()

    total_points = 0
    for t in transactions:
        total_points += t["points"] if t["type"] == "earn" else -t["points"]

    if total_points < points_required:
        return jsonify({"error": "Not enough points"}), 400

    # Deduct points
    conn.execute("""
        INSERT INTO loyalty_transactions (user_id, type, points, description, date)
        VALUES (?, 'redeem', ?, ?, DATE('now'))
    """, (user_id, points_required, description))

    conn.commit()
    conn.close()

    return jsonify({"message": "Reward redeemed"})

def add_loyalty_points(user_id, total):
    conn = get_db()

    points = int(total * 10)  # 10 points per £1

    conn.execute("""
        INSERT INTO loyalty_transactions (user_id, type, points, description, date)
        VALUES (?, 'earn', ?, 'Order purchase', DATE('now'))
    """, (user_id, points))

    conn.commit()
    conn.close()

# START APP
if __name__ == "__main__":
    #  Only create DB if missing (safe)
    if not os.path.exists("new_database.db"):
        init_db()
        seed_data()

    app.run(debug=True)