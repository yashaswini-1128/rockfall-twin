import os, time, datetime as dt, psycopg2
from twin_filter import TwinKF, fs_proxy
from scorer import score
from alerts import send_email, send_sms

DB_DSN = f"dbname={os.getenv('POSTGRES_DB','mine')} user={os.getenv('POSTGRES_USER','postgres')} password={os.getenv('POSTGRES_PASSWORD','postgres')} host={os.getenv('POSTGRES_HOST','db')}"
conn = psycopg2.connect(DB_DSN)
cur  = conn.cursor()
kf   = TwinKF()

def latest_rain():
    cur.execute("SELECT rainfall_mm FROM weather_obs ORDER BY ts DESC LIMIT 1")
    row = cur.fetchone()
    return row[0] if row else 0.0

def latest_meas():
    # If there are sensor rows, use them; else None
    cur.execute("""
      WITH x AS (
        SELECT DISTINCT ON (type) type, value FROM sensor_readings ORDER BY type, ts DESC
      )
      SELECT
        (SELECT value FROM x WHERE type='displacement'),
        (SELECT value FROM x WHERE type='velocity'),
        (SELECT value FROM x WHERE type='pore_pressure')
    """)
    row = cur.fetchone()
    return row if row else (None, None, None)

while True:
    rain = latest_rain()
    kf.predict(rain)
    u_m, v_m, p_m = latest_meas()
    kf.update(u_m, v_m, p_m)

    u,v,p = kf.x.flatten()
    Fs = fs_proxy(u,v,p,55)
    prob,label = score(u,v,p,rain)

    cur.execute("""INSERT INTO twin_state(ts,u_mm,v_mmph,p_kpa,R_mm,Fs_hat,risk_prob,risk_class)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (dt.datetime.utcnow(), float(u), float(v), float(p), float(rain), float(Fs), float(prob), label))
    conn.commit()
    time.sleep(5)

DB_DSN = os.getenv("DB_DSN", "postgresql://postgres:postgres@db:5432/mine")

def notify_if_needed(score, level):
    if level in ("medium","high"):
        conn=psycopg2.connect(DB_DSN); cur=conn.cursor()
        cur.execute("SELECT email, phone FROM alert_subs")
        for em, ph in cur.fetchall():
            msg=f"[Rockfall Alert] Risk={level.upper()} ({round(score*100)}%). Take safety measures."
            if em: 
                try: send_email(em, "Rockfall Alert", msg)
                except Exception: pass
            if ph:
                try: send_sms(ph, msg)
                except Exception: pass
        cur.close(); conn.close()
