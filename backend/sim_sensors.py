import os, time, random, datetime as dt, psycopg2

DB_DSN = f"dbname={os.getenv('POSTGRES_DB','mine')} user={os.getenv('POSTGRES_USER','postgres')} password={os.getenv('POSTGRES_PASSWORD','postgres')} host={os.getenv('POSTGRES_HOST','db')}"

def connect_with_retry():
    for i in range(30):
        try:
            return psycopg2.connect(DB_DSN)
        except Exception as e:
            print(f"[sim] DB not ready, retry {i+1}/30...", e)
            time.sleep(2)
    raise RuntimeError("DB never became ready")

def main():
    conn = connect_with_retry()
    cur  = conn.cursor()
    while True:
        ts = dt.datetime.utcnow()
        # simple synthetic values
        u = max(0.0, random.gauss(3, 1))           # displacement mm
        v = max(0.0, random.gauss(0.8, 0.2))       # velocity mm/h
        p = max(0.0, random.gauss(18, 5))          # pore pressure kPa
        cur.execute(
            "INSERT INTO sensor_readings (t, u, v, p) VALUES (%s,%s,%s,%s)",
            (ts, u, v, p)
        )
        conn.commit()
        print(f"[sim] wrote u={u:.2f} v={v:.2f} p={p:.2f}")
        time.sleep(5)  # every 5s

if __name__ == "__main__":
    main()
