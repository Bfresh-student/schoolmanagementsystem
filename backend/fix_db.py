"""
fix_db.py - Fix missing inscriptions table and seed demo data.
Run with: python fix_db.py
"""
import os
import sqlite3
import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# ── 1. Create inscriptions table ─────────────────────────────────────────────
cur.execute("""
CREATE TABLE IF NOT EXISTS inscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_uuid TEXT NOT NULL UNIQUE,
    student_id INTEGER NOT NULL REFERENCES students_student(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses_course(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active',
    rejection_reason TEXT,
    requested_at TEXT NOT NULL,
    approved_by_id INTEGER REFERENCES users_user(id) ON DELETE SET NULL,
    approved_at TEXT,
    activated_at TEXT,
    validated_at TEXT,
    synced INTEGER NOT NULL DEFAULT 1,
    created_offline INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
""")
print("✅ Table 'inscriptions' created (or already exists).")

# ── 2. Fake the enrollments migration record ──────────────────────────────────
cur.execute("""
INSERT OR IGNORE INTO django_migrations (app, name, applied)
VALUES ('enrollments', '0001_initial', ?)
""", (datetime.datetime.now().isoformat(),))
print("✅ Migration 'enrollments.0001_initial' recorded.")

# ── 3. Seed students ──────────────────────────────────────────────────────────
import uuid as uuid_lib

# Get specialization id
cur.execute("SELECT id FROM students_specialization LIMIT 1")
row = cur.fetchone()
if not row:
    print("⚠️  No specialization found – run seed_phase3.py first.")
    conn.commit()
    conn.close()
    exit(1)
spec_id = row[0]

students_data = [
    ('Jean', 'Pierre', 'jeanpierre@cejec.edu.ht'),
    ('Marie', 'Claire', 'maireclaire@cejec.edu.ht'),
    ('Paul', 'Andre', 'paulandre@cejec.edu.ht'),
    ('Rose', 'Marie', 'rosemarie@cejec.edu.ht'),
    ('Jacques', 'Michel', 'jacquesmichel@cejec.edu.ht'),
    ('Claudette', 'Joseph', 'claudettejoseph@cejec.edu.ht'),
    ('Pierre', 'Louis', 'pierrelouis@cejec.edu.ht'),
    ('Anne', 'Sophie', 'annesophie@cejec.edu.ht'),
    ('Marc', 'Antoine', 'marcantoine@cejec.edu.ht'),
    ('Isabelle', 'Bernard', 'isabelle@cejec.edu.ht'),
    ('Edner', 'Charles', 'edner@cejec.edu.ht'),
    ('Nadine', 'Fleuriot', 'nadine@cejec.edu.ht'),
    ('Danel', 'Augustin', 'danel@cejec.edu.ht'),
    ('Guerline', 'Baptiste', 'guerline@cejec.edu.ht'),
    ('Wendell', 'Victor', 'wendell@cejec.edu.ht'),
    ('Sophia', 'Lavallee', 'sophia@cejec.edu.ht'),
    ('Reginald', 'Bazile', 'reginald@cejec.edu.ht'),
    ('Fabiola', 'Derose', 'fabiola@cejec.edu.ht'),
    ('Samuel', 'Geffrard', 'samuel@cejec.edu.ht'),
    ('Louna', 'Hyppolite', 'louna@cejec.edu.ht'),
]

now_str = datetime.datetime.now().isoformat()
student_ids = []
for i, (first, last, email) in enumerate(students_data, 1):
    # Insert user if not exists
    cur.execute("SELECT id FROM users_user WHERE email = ?", (email,))
    user_row = cur.fetchone()
    if not user_row:
        # Use a bcrypt-like placeholder hash (not real auth, just seeding)
        cur.execute("""
            INSERT INTO users_user
                (password, last_login, is_superuser, first_name, last_name, is_staff,
                 is_active, is_verified, date_joined, email, role, status, phone,
                 bio, locale, created_at, updated_at)
            VALUES
                ('pbkdf2_sha256$dummy', NULL, 0, ?, ?, 0, 1, 0, ?, ?, 'STUDENT', 'active', '',
                 '', 'fr', ?, ?)
        """, (first, last, now_str, email, now_str, now_str))
        user_id = cur.lastrowid
    else:
        user_id = user_row[0]
        cur.execute("UPDATE users_user SET role='STUDENT' WHERE id=?", (user_id,))

    # Insert student profile if not exists
    cur.execute("SELECT id FROM students_student WHERE user_id = ?", (user_id,))
    st_row = cur.fetchone()
    if not st_row:
        reg_num = f'STU{i:04d}'
        enroll_date = datetime.date.today().isoformat()
        cur.execute("""
            INSERT INTO students_student
                (user_id, registration_number, status, specialization_id, address,
                 emergency_contacts, enrollment_date, is_active, synced, created_at, updated_at)
            VALUES (?, ?, 'ACTIVE', ?, '', '[]', ?, 1, 1, ?, ?)
        """, (user_id, reg_num, spec_id, enroll_date, now_str, now_str))
        student_ids.append(cur.lastrowid)
    else:
        student_ids.append(st_row[0])

print(f"✅ {len(student_ids)} student profiles ready.")

# ── 4. Seed paid invoices ─────────────────────────────────────────────────────
invoice_amounts = [5000, 7500, 5000, 7500, 5000, 10000, 5000, 7500, 5000, 10000,
                   8000, 6000, 9000, 7000, 5500, 8500, 6500, 9500, 7500, 5000]

due_date = '2025-12-31'
created_count = 0
for i, amount in enumerate(invoice_amounts, 1):
    inv_num = f'INV-2025-{i:03d}'
    cur.execute("SELECT id FROM finance_invoice WHERE invoice_number = ?", (inv_num,))
    if not cur.fetchone():
        st_id = student_ids[i % len(student_ids)]
        inv_id = str(uuid_lib.uuid4())
        cur.execute("""
            INSERT INTO finance_invoice
                (id, invoice_number, inscription_id, student_id, amount, amount_paid,
                 currency, status, due_date, issued_at, notes, created_at, updated_at)
            VALUES (?, ?, NULL, ?, ?, ?, 'HTG', 'paid', ?, ?, '', ?, ?)
        """, (inv_id, inv_num, st_id, amount, amount, due_date, now_str, now_str, now_str))
        created_count += 1

total_revenue = sum(invoice_amounts)
print(f"✅ {created_count} invoices seeded. Total revenue: {total_revenue:,} HTG")

conn.commit()
conn.close()
print("\n✅ All done. Restart your Django server and test /api/v1/dashboard/stats/")
