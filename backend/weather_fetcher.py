import os, time, requests, psycopg2, datetime as dt

API  = os.getenv("OPENWEATHER_API_KEY")
CITY = os.getenv("CITY", "").strip()
LAT  = os.getenv("LAT", "").strip()
LON  = os.getenv("LON", "").strip()

DB_DSN = (
    f"dbname={os.getenv('POSTGRES_DB','mine')} "
    f"user={os.getenv('POSTGRES_USER','postgres')} "
    f"password={os.getenv('POSTGRES_PASSWORD','postgres')} "
    f"host={os.getenv('POSTGRES_HOST','db')}"
)

def fetch_weather():
    """Returns dict {'temp','hum','rain'} or None."""
    if API is None or API == "":
        print("[weather] Missing OPENWEATHER_API_KEY"); return None

    if LAT and LON:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={LAT}&lon={LON}&appid={API}&units=metric"
    elif CITY:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={API}&units=metric"
    else:
        print("[weather] Provide CITY or LAT/LON in .env"); return None

    try:
        r = requests.get(url, timeout=15)
    except Exception as e:
        print("[weather] HTTP error:", e); return None

    if r.status_code != 200:
        print("[weather] HTTP", r.status_code, r.text[:200]); return None

    try:
        j = r.json()
    except Exception as e:
        print("[weather] JSON error:", e, r.text[:200]); return None

    if "main" not in j:
        # Print the payload so you can see the exact API error (401/404/429 etc.)
        print("[weather] Missing 'main' in payload:", j)
        return None

    temp = float(j["main"].get("temp", 0.0))
    hum  = float(j["main"].get("humidity", 0.0))
    rain = float(j.get("rain", {}).get("1h", 0.0))
    return {"temp": temp, "hum": hum, "rain": rain}

def connect_db_with_retry(max_tries=30, delay=2):
    for i in range(max_tries):
        try:
            return psycopg2.connect(DB_DSN)
        except Exception as e:
            print(f"[weather] DB wait {i+1}/{max_tries}: {e}")
            time.sleep(delay)
    return None

def main():
    while True:
        w = fetch_weather()
        if not w:
            print("[weather] Skipped write due to bad response")
            time.sleep(60)  # try again in 1 minute
            continue

        conn = connect_db_with_retry()
        if not conn:
            print("[weather] DB not ready after retries; will retry later")
            time.sleep(10)
            continue

        try:
            cur  = conn.cursor()
            ts = dt.datetime.utcnow()
            cur.execute(
                "INSERT INTO weather_obs (t, rainfall, temp, humidity) VALUES (%s,%s,%s,%s)",
                (ts, w["rain"], w["temp"], w["hum"])
            )
            conn.commit()
            print(f"[weather] Saved: rain={w['rain']}mm temp={w['temp']}C hum={w['hum']}%")
        except Exception as e:
            print("[weather] DB write error:", e)
        finally:
            try: conn.close()
            except: pass

        time.sleep(600)  # every 10 minutes

if __name__ == "__main__":
    main()
cur.execute(
    "INSERT INTO weather_obs (t, rainfall, temp, humidity) VALUES (now(), %s, %s, %s)",
    (rain, temp, hum)
)
