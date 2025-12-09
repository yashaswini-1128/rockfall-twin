import os, json
from typing import Literal, Optional, Dict, List
import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api")

# DSN matches your compose (db service)
DB_DSN = os.getenv("DB_DSN", "postgresql://postgres:postgres@db:5432/mine")

def get_conn():
    return psycopg2.connect(DB_DSN, cursor_factory=psycopg2.extras.RealDictCursor)

# ------------ Models ------------
class WeatherPoint(BaseModel):
    t: str
    rainfall: float | None = None
    temp: float | None = None
    humidity: float | None = None

class TimePoint(BaseModel):
    t: str
    value: float | None = None

class RiskLatest(BaseModel):
    t: str
    score: float
    level: Literal["Low", "Medium", "High"]
    color: Literal["green", "yellow", "red"]

class SubscribeReq(BaseModel):
    email: Optional[str] = None   # keep it simple to avoid extra deps
    phone: Optional[str] = None

# ------------ Utility ------------
def classify_risk(rain: float, hum: float, temp: float):
    # simple heuristic; tune later
    rain_score = min(max(rain / 20.0, 0.0), 1.0)
    hum_score  = min(max((hum - 60) / 40.0, 0.0), 1.0)
    temp_score = min(max((25 - temp) / 10.0, 0.0), 1.0)
    score = 0.6 * rain_score + 0.3 * hum_score + 0.1 * temp_score
    if score >= 0.66:
        return score, "High", "red"
    if score >= 0.33:
        return score, "Medium", "yellow"
    return score, "Low", "green"

# ------------ Roads & Zones (demo) ------------
@router.get("/roads")
def get_roads(country: str, state: str, bbox: str):
    # bbox = "minLon,minLat,maxLon,maxLat" (not parsed here; demo data)
    roads = [
        {"id": 1, "name": "Highway 44", "coords": [[77.5, 12.9], [77.6, 13.0]]},
        {"id": 2, "name": "NH75",       "coords": [[77.55, 12.95], [77.65, 13.05]]},
    ]
    return {"country": country, "state": state, "roads": roads}

@router.get("/risk/zones")
def get_risk_zones(bbox: str):
    zones = [
        {"id": "zone1", "risk": "High",   "color": "red",    "coords": [[77.55, 12.95]]},
        {"id": "zone2", "risk": "Medium", "color": "yellow", "coords": [[77.60, 13.00]]},
        {"id": "zone3", "risk": "Low",    "color": "green",  "coords": [[77.65, 13.05]]},
    ]
    return {"bbox": bbox, "zones": zones}

# ------------ Weather & Risk ------------
@router.get("/weather/latest", response_model=WeatherPoint)
def weather_latest():
    sql = """
      SELECT t, rainfall, temp, humidity
      FROM weather_obs
      ORDER BY t DESC
      LIMIT 1
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No weather data found")
        row["t"] = row["t"].isoformat()
        return row

@router.get("/risk/latest", response_model=RiskLatest)
def risk_latest():
    sql = """
      SELECT t, rainfall, temp, humidity
      FROM weather_obs
      ORDER BY t DESC
      LIMIT 1
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        w = cur.fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="No weather data found")

    score, level, color = classify_risk(float(w["rainfall"] or 0.0),
                                        float(w["humidity"] or 0.0),
                                        float(w["temp"] or 0.0))
    return {
        "t": w["t"].isoformat(),
        "score": round(score, 3),
        "level": level,
        "color": color,
    }

@router.get("/timeseries")
def timeseries(
    metric: Literal["rain", "temp", "humidity", "risk"] = Query(...),
    hours: int = Query(24, ge=1, le=168),
):
    if metric == "rain":
        expr = "rainfall"
    elif metric == "temp":
        expr = "temp"
    elif metric == "humidity":
        expr = "humidity"
    else:
        expr = """
            (LEAST(rainfall/20.0,1.0)*0.6
           + LEAST(GREATEST((humidity-60)/40.0,0),1.0)*0.3
           + LEAST(GREATEST((25-temp)/10.0,0),1.0)*0.1)
        """

    sql = f"""
      SELECT t, {expr} AS value
      FROM weather_obs
      WHERE t >= NOW() - INTERVAL %s
      ORDER BY t ASC
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (f"{hours} hours",))
        rows = cur.fetchall()

    points = [{"t": r["t"].isoformat(), "value": (float(r["value"]) if r["value"] is not None else None)} for r in rows]
    return {"metric": metric, "points": points}

# ------------ Alerts ------------
@router.post("/alerts/subscribe")
def subscribe(req: SubscribeReq):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
          CREATE TABLE IF NOT EXISTS alert_subs(
            id SERIAL PRIMARY KEY,
            email TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT now()
          )
        """)
        cur.execute("INSERT INTO alert_subs(email, phone) VALUES (%s, %s)", (req.email, req.phone))
        conn.commit()
    return {"ok": True}
