from flask import Flask, request, jsonify, g
from flask_cors import CORS
import joblib
import json
import os
import pandas as pd
import pymysql
from pymysql.cursors import DictCursor
import secrets
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

# Membuat aplikasi Flask dan mengizinkan frontend mengakses backend.
app = Flask(__name__)
CORS(app)

MYSQL_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE", "malariacheck"),
    "charset": "utf8mb4",
    "cursorclass": DictCursor,
    "autocommit": True,
}
SESSION_DAYS = 7

# Load model
model = joblib.load("best_model_catboost.pkl")

# Daftar kolom input yang dipakai model.
FEATURES = [
    "Sex", "Age", "Hemoglobin(Hb%)", "Total WBC count(/cumm)",
    "Neutrophils", "Lymphocytes", "Total Cir.Eosinophils",
    "HTC/PCV(%)", "MCH(pg)", "MCHC(g/dl)", "RDW-CV(%)", "Platelet Count"
]

def get_db():
    return pymysql.connect(**MYSQL_CONFIG)

def ensure_database():
    server_config = MYSQL_CONFIG.copy()
    database = server_config.pop("database")
    with pymysql.connect(**server_config) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )

def init_db():
    ensure_database()
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    full_name VARCHAR(120) NOT NULL,
                    username VARCHAR(80) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(40) NOT NULL DEFAULT 'tenaga_medis',
                    created_at DATETIME NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    token VARCHAR(128) PRIMARY KEY,
                    user_id INT NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME NOT NULL,
                    INDEX idx_sessions_user_id (user_id),
                    INDEX idx_sessions_expires_at (expires_at),
                    CONSTRAINT fk_sessions_user
                        FOREIGN KEY (user_id) REFERENCES users (id)
                        ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS screenings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    patient_name VARCHAR(160) NOT NULL,
                    sex VARCHAR(20) NOT NULL,
                    age VARCHAR(20) NOT NULL,
                    hemoglobin VARCHAR(40) NOT NULL,
                    wbc VARCHAR(40) NOT NULL,
                    neutrophils VARCHAR(40) NOT NULL,
                    lymphocytes VARCHAR(40) NOT NULL,
                    eosinophils VARCHAR(40) NOT NULL,
                    htc VARCHAR(40) NOT NULL,
                    mch VARCHAR(40) NOT NULL,
                    mchc VARCHAR(40) NOT NULL,
                    rdwcv VARCHAR(40) NOT NULL,
                    platelet VARCHAR(40) NOT NULL,
                    symptoms JSON NULL,
                    result VARCHAR(20) NOT NULL,
                    confidence DECIMAL(6,2) NOT NULL,
                    proba_pos DECIMAL(6,2) NOT NULL,
                    proba_neg DECIMAL(6,2) NOT NULL,
                    screening_date VARCHAR(80) NOT NULL,
                    created_at DATETIME NOT NULL,
                    INDEX idx_screenings_user_id (user_id),
                    INDEX idx_screenings_created_at (created_at),
                    CONSTRAINT fk_screenings_user
                        FOREIGN KEY (user_id) REFERENCES users (id)
                        ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

def public_user(row):
    return {
        "id": row["id"],
        "full_name": row["full_name"],
        "username": row["username"],
        "role": row["role"],
    }

def serialize_screening_row(row):
    symptoms = row.get("symptoms")
    if isinstance(symptoms, str):
        try:
            symptoms = json.loads(symptoms)
        except json.JSONDecodeError:
            symptoms = []

    return {
        "id": row["id"],
        "patientName": row["patient_name"],
        "sex": row["sex"],
        "age": row["age"],
        "hemoglobin": row["hemoglobin"],
        "wbc": row["wbc"],
        "neutrophils": row["neutrophils"],
        "lymphocytes": row["lymphocytes"],
        "eosinophils": row["eosinophils"],
        "htc": row["htc"],
        "mch": row["mch"],
        "mchc": row["mchc"],
        "rdwcv": row["rdwcv"],
        "platelet": row["platelet"],
        "symptoms": symptoms or [],
        "result": row["result"],
        "confidence": float(row["confidence"]),
        "proba_pos": float(row["proba_pos"]),
        "proba_neg": float(row["proba_neg"]),
        "date": row["screening_date"],
    }

def insert_screening(cursor, user_id, item):
    cursor.execute("""
        INSERT INTO screenings (
            user_id, patient_name, sex, age, hemoglobin, wbc, neutrophils, lymphocytes,
            eosinophils, htc, mch, mchc, rdwcv, platelet, symptoms, result,
            confidence, proba_pos, proba_neg, screening_date, created_at
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """, (
        user_id,
        item.get("patientName") or "Pasien Anonim",
        item.get("sex") or "",
        str(item.get("age") or ""),
        str(item.get("hemoglobin") or ""),
        str(item.get("wbc") or ""),
        str(item.get("neutrophils") or ""),
        str(item.get("lymphocytes") or ""),
        str(item.get("eosinophils") or ""),
        str(item.get("htc") or ""),
        str(item.get("mch") or ""),
        str(item.get("mchc") or ""),
        str(item.get("rdwcv") or ""),
        str(item.get("platelet") or ""),
        json.dumps(item.get("symptoms") or []),
        item.get("result") or "",
        float(item.get("confidence") or 0),
        float(item.get("proba_pos") or 0),
        float(item.get("proba_neg") or 0),
        item.get("date") or "",
        datetime.utcnow(),
    ))

def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "", 1).strip()
    now = datetime.utcnow()
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT users.id, users.full_name, users.username, users.role
                FROM sessions
                JOIN users ON users.id = sessions.user_id
                WHERE sessions.token = %s AND sessions.expires_at > %s
            """, (token, now))
            return cursor.fetchone()

def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return jsonify({"error": "Sesi login tidak valid. Silakan login kembali."}), 401
        g.current_user = user
        return view(*args, **kwargs)
    return wrapped

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    full_name = (data.get("full_name") or "").strip()
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "tenaga_medis").strip() or "tenaga_medis"

    if not full_name or not username or not password:
        return jsonify({"error": "Nama, username, dan password wajib diisi."}), 400
    if len(username) < 4:
        return jsonify({"error": "Username minimal 4 karakter."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password minimal 6 karakter."}), 400

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                INSERT INTO users (full_name, username, password_hash, role, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                    full_name,
                    username,
                    generate_password_hash(password),
                    role,
                    datetime.utcnow(),
                ))
        return jsonify({"message": "Registrasi berhasil. Silakan login."}), 201
    except pymysql.err.IntegrityError:
        return jsonify({"error": "Username sudah terdaftar."}), 409

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username dan password wajib diisi."}), 400

    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
        if user is None or not check_password_hash(user["password_hash"], password):
            return jsonify({"error": "Username atau password salah."}), 401

        token = secrets.token_urlsafe(32)
        now = datetime.utcnow()
        expires_at = now + timedelta(days=SESSION_DAYS)
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO sessions (token, user_id, expires_at, created_at)
                VALUES (%s, %s, %s, %s)
            """, (token, user["id"], expires_at, now))

    return jsonify({
        "token": token,
        "user": public_user(user),
        "expires_at": expires_at.isoformat(),
    })

@app.route("/me", methods=["GET"])
@require_auth
def me():
    return jsonify({"user": public_user(g.current_user)})

@app.route("/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "", 1).strip() if auth_header.startswith("Bearer ") else ""
    if token:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM sessions WHERE token = %s", (token,))
    return jsonify({"message": "Logout berhasil."})

@app.route("/screenings", methods=["GET"])
@require_auth
def get_screenings():
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT *
                FROM screenings
                WHERE user_id = %s
                ORDER BY created_at DESC, id DESC
            """, (g.current_user["id"],))
            rows = cursor.fetchall()
    return jsonify({"items": [serialize_screening_row(row) for row in rows]})

@app.route("/screenings", methods=["POST"])
@require_auth
def create_screening():
    item = request.get_json() or {}
    with get_db() as conn:
        with conn.cursor() as cursor:
            insert_screening(cursor, g.current_user["id"], item)
            inserted_id = cursor.lastrowid
            cursor.execute("SELECT * FROM screenings WHERE id = %s", (inserted_id,))
            row = cursor.fetchone()
    return jsonify({"item": serialize_screening_row(row)}), 201

@app.route("/screenings/replace", methods=["POST"])
@require_auth
def replace_screenings():
    payload = request.get_json() or {}
    items = payload.get("items") or []
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM screenings WHERE user_id = %s", (g.current_user["id"],))
            for item in reversed(items):
                insert_screening(cursor, g.current_user["id"], item)
            cursor.execute("""
                SELECT *
                FROM screenings
                WHERE user_id = %s
                ORDER BY created_at DESC, id DESC
            """, (g.current_user["id"],))
            rows = cursor.fetchall()
    return jsonify({"items": [serialize_screening_row(row) for row in rows]})

@app.route("/screenings", methods=["DELETE"])
@require_auth
def delete_all_screenings():
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM screenings WHERE user_id = %s", (g.current_user["id"],))
    return jsonify({"message": "Riwayat skrining berhasil dihapus."})

@app.route("/predict", methods=["POST"])
@require_auth
def predict():
    try:
        # Mengambil data dari frontend lalu menyusunnya ke format yang dibutuhkan model.
        data = request.get_json()
        input_df = pd.DataFrame([{
            "Sex":                      data.get("sex"),
            "Age":                      float(data.get("age")),
            "Hemoglobin(Hb%)":          float(data.get("hemoglobin")),
            "Total WBC count(/cumm)":   float(data.get("wbc")),
            "Neutrophils":              float(data.get("neutrophils")),
            "Lymphocytes":              float(data.get("lymphocytes")),
            "Total Cir.Eosinophils":    float(data.get("eosinophils")),
            "HTC/PCV(%)":               float(data.get("htc")),
            "MCH(pg)":                  float(data.get("mch")),
            "MCHC(g/dl)":               float(data.get("mchc")),
            "RDW-CV(%)":                float(data.get("rdwcv")),
            "Platelet Count":           float(data.get("platelet")),
        }])

        # Model menghitung hasil prediksi dan tingkat keyakinannya.
        pred       = model.predict(input_df)[0]
        proba      = model.predict_proba(input_df)[0]
        confidence = round(float(max(proba)) * 100, 2)
        label      = "Positive" if pred == 1 else "Negative"

        # Hasil prediksi dikirim kembali ke aplikasi.
        return jsonify({
            "result":     label,
            "confidence": confidence,
            "proba_neg":  round(float(proba[0]) * 100, 2),
            "proba_pos":  round(float(proba[1]) * 100, 2),
        })

    except Exception as e:
        # Kalau ada error, backend mengirim pesan error.
        return jsonify({"error": str(e)}), 400

@app.route("/health", methods=["GET"])
def health():
    # dipakai untuk mengecek apakah backend aktif.
    return jsonify({"status": "ok"})

init_db()

if __name__ == "__main__":
    # Menjalankan backend di port 5000.
    app.run(host="0.0.0.0", port=5000, debug=True)
