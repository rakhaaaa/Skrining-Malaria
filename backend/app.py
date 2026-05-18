# Mengimpor Flask dan beberapa fungsi bawaan utk buat server, menerima request, mengirim response JSON, dan menyimpan data sementara per request.
from flask import Flask, request, jsonify, g
# Mengimpor CORS supaya backend bisa diakses dari aplikasi frontend yang berbeda origin.
from flask_cors import CORS
# Mengimpor joblib utk memuat file model machine learning yg sudah dilatih.
import joblib
# Mengimpor os utk kebutuhan akses path atau konfigurasi dari sistem operasi.
import os
# Mengimpor pandas utk membaca, mengolah, dan menyusun data sebelum diproses model.
import pandas as pd
# Mengimpor pymysql utk hubungin backend Flask ke database MySQL.
import pymysql
# Mengimpor DictCursor supaya hasil query database dikembalikan dalam bentuk dictionary.
from pymysql.cursors import DictCursor
# Mengimpor secrets utk buat token acak yang aman.
import secrets
# Mengimpor datetime dan timedelta utk mengatur waktu pembuatan dan masa berlaku token atau data tertentu.
from datetime import datetime, timedelta
# Mengimpor wraps utk buat decorator tanpa menghilangkan informasi fungsi aslinya.
from functools import wraps
# Mengimpor fungsi utk buat hash password dan mengecek password saat login.
from werkzeug.security import generate_password_hash, check_password_hash

# Membuat aplikasi Flask dan mengizinkan frontend mengakses backend.
app = Flask(__name__)
CORS(app)

MYSQL_CONFIG = {
    # Nilai koneksi database diambil dari environment variable agar mudah dipindah antar perangkat.
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
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "best_model_catboost.pkl"))

# Load model
model = joblib.load(MODEL_PATH)

# Daftar kolom input. Jika model menyimpan feature_names_in_, backend akan
# mengikuti urutan fitur dari model agar aman saat file .pkl diganti.
DEFAULT_FEATURES = [
    "Sex", "Age", "Hemoglobin(Hb%)", "Total WBC count(/cumm)",
    "Neutrophils", "Lymphocytes", "Total Cir.Eosinophils",
    "HTC/PCV(%)", "MCH(pg)", "MCHC(g/dl)", "RDW-CV(%)", "Platelet Count"
]
FEATURES = list(getattr(model, "feature_names_in_", DEFAULT_FEATURES))

FIELD_MAP = {
    # Mapping ini menjembatani nama field dari model dengan nama payload dari frontend.
    "Sex": ("sex", str),
    "sex": ("sex", str),
    "Age": ("age", float),
    "age": ("age", float),
    "Hemoglobin(Hb%)": ("hemoglobin", float),
    "Total WBC count(/cumm)": ("wbc", float),
    "Neutrophils": ("neutrophils", float),
    "Lymphocytes": ("lymphocytes", float),
    "Total Cir.Eosinophils": ("eosinophils", float),
    "HTC/PCV(%)": ("htc", float),
    "MCH(pg)": ("mch", float),
    "MCHC(g/dl)": ("mchc", float),
    "RDW-CV(%)": ("rdwcv", float),
    "Platelet Count": ("platelet", float),
}

def build_model_input(data):
    # Fungsi ini menerjemahkan payload dari frontend ke DataFrame satu baris
    # sesuai urutan fitur yang diminta model machine learning.
    row = {}
    for feature in FEATURES:
        if feature not in FIELD_MAP:
            raise ValueError(f"Fitur model tidak dikenali oleh backend: {feature}")

        payload_key, converter = FIELD_MAP[feature]
        value = data.get(payload_key)
        if value is None or value == "":
            raise ValueError(f"Field wajib belum diisi: {payload_key}")

        row[feature] = converter(value)

    return pd.DataFrame([row], columns=FEATURES)

def prediction_label(pred):
    # Model bisa mengembalikan angka atau string, jadi hasilnya dinormalisasi
    # supaya frontend selalu menerima label Positive atau Negative.
    if isinstance(pred, str):
        normalized = pred.strip().lower()
        if normalized in {"positive", "positif", "1", "malaria"}:
            return "Positive"
        if normalized in {"negative", "negatif", "0", "non-malaria", "non malaria"}:
            return "Negative"
    return "Positive" if int(pred) == 1 else "Negative"

def class_probabilities(proba):
    # Probabilitas kelas dipetakan ulang agar frontend selalu menerima
    # pasangan nilai proba_neg dan proba_pos secara konsisten.
    classes = getattr(model, "classes_", None)
    if classes is None and hasattr(model, "named_steps"):
        final_model = list(model.named_steps.values())[-1]
        classes = getattr(final_model, "classes_", None)

    if classes is None:
        return round(float(proba[0]) * 100, 2), round(float(proba[1]) * 100, 2)

    values = {prediction_label(cls): round(float(prob) * 100, 2) for cls, prob in zip(classes, proba)}
    return values.get("Negative", 0.0), values.get("Positive", 0.0)

def get_db():
    # Setiap operasi database memakai koneksi baru agar lebih aman dan sederhana dikelola.
    return pymysql.connect(**MYSQL_CONFIG)

def ensure_database():
    # Membuat database utama jika belum ada.
    server_config = MYSQL_CONFIG.copy()
    database = server_config.pop("database")
    with pymysql.connect(**server_config) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )

def init_db():
    # Saat backend pertama kali aktif, fungsi ini memastikan semua tabel penting sudah tersedia.
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
    # Hanya field aman yang dikirim ke frontend; password hash sengaja tidak pernah ikut keluar.
    return {
        "id": row["id"],
        "full_name": row["full_name"],
        "username": row["username"],
        "role": row["role"],
    }

def serialize_screening_row(row):
    # Nama kolom database diubah ke format object yang dipakai frontend React Native.
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
        "result": row["result"],
        "confidence": float(row["confidence"]),
        "proba_pos": float(row["proba_pos"]),
        "proba_neg": float(row["proba_neg"]),
        "date": row["screening_date"],
    }

def insert_screening(cursor, user_id, item):
    # Setiap hasil skrining disimpan sebagai satu baris baru yang terhubung ke user pemilik akun.
    cursor.execute("""
        INSERT INTO screenings (
            user_id, patient_name, sex, age, hemoglobin, wbc, neutrophils, lymphocytes,
            eosinophils, htc, mch, mchc, rdwcv, platelet, result,
            confidence, proba_pos, proba_neg, screening_date, created_at
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
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
        item.get("result") or "",
        float(item.get("confidence") or 0),
        float(item.get("proba_pos") or 0),
        float(item.get("proba_neg") or 0),
        item.get("date") or "",
        datetime.utcnow(),
    ))

def get_current_user():
    # Header Authorization berisi token Bearer yang dipakai untuk mencari sesi login yang masih berlaku.
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
    # Decorator ini melindungi endpoint privat agar hanya bisa diakses setelah login berhasil.
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
    # Endpoint ini menerima data registrasi dari frontend, memvalidasi isinya,
    # lalu menyimpan akun baru ke tabel users.
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
    # Endpoint login mengecek kecocokan username dan password,
    # lalu membuat token sesi baru jika akun valid.
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
    # Endpoint ini dipakai frontend untuk mengambil identitas user aktif dari token yang tersimpan.
    return jsonify({"user": public_user(g.current_user)})

@app.route("/logout", methods=["POST"])
def logout():
    # Logout dilakukan dengan menghapus token dari tabel sessions sehingga sesi langsung tidak berlaku.
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
    # Endpoint ini mengambil seluruh riwayat skrining milik user aktif
    # dan mengurutkannya dari data paling baru ke paling lama.
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
    # Endpoint ini dipakai setelah prediksi selesai untuk menambahkan satu hasil skrining baru.
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
    # Endpoint ini mengganti seluruh daftar riwayat user aktif.
    # Biasanya dipakai saat frontend menyimpan ulang daftar setelah ada item tertentu yang dihapus.
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
    # Endpoint ini menghapus seluruh riwayat skrining milik akun yang sedang login.
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM screenings WHERE user_id = %s", (g.current_user["id"],))
    return jsonify({"message": "Riwayat skrining berhasil dihapus."})

@app.route("/predict", methods=["POST"])
@require_auth
def predict():
    try:
        # Data dari frontend disusun dulu ke format DataFrame agar sesuai dengan kebutuhan model.
        data = request.get_json()
        input_df = build_model_input(data)

        # Model menghasilkan label prediksi dan probabilitas tiap kelas.
        pred       = model.predict(input_df)[0]
        proba      = model.predict_proba(input_df)[0]
        confidence = round(float(max(proba)) * 100, 2)
        label      = prediction_label(pred)
        proba_neg, proba_pos = class_probabilities(proba)

        # Backend hanya mengirim ringkasan hasil yang memang dibutuhkan UI.
        return jsonify({
            "result":     label,
            "confidence": confidence,
            "proba_neg":  proba_neg,
            "proba_pos":  proba_pos,
        })

    except Exception as e:
        # Semua error validasi/prediksi dikembalikan ke frontend agar bisa ditampilkan ke pengguna.
        return jsonify({"error": str(e)}), 400

@app.route("/health", methods=["GET"])
def health():
    # Endpoint sederhana untuk mengecek apakah backend sedang hidup dan bisa dihubungi.
    return jsonify({"status": "ok"})

init_db()

if __name__ == "__main__":
    # Saat file dijalankan langsung, Flask backend dibuka di port 5000 untuk kebutuhan pengembangan.
    app.run(host="0.0.0.0", port=5000, debug=True)
