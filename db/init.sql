CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS weather_obs (
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    rainfall_mm REAL,
    temp_c REAL,
    humidity REAL
);
SELECT create_hypertable('weather_obs','ts', if_not_exists => TRUE);

-- Optional demo sensors table (safe to keep)
CREATE TABLE IF NOT EXISTS sensor_readings (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  location TEXT,
  vib_rms REAL,
  displacement_mm REAL,
  risk_label TEXT
);
SELECT create_hypertable('sensor_readings','ts', if_not_exists => TRUE);

DROP TABLE IF EXISTS weather_obs;
CREATE TABLE weather_obs (
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    rainfall_mm REAL,
    temp_c REAL,
    humidity REAL
);


-- inside psql connected to DB 'mine'
CREATE TABLE IF NOT EXISTS risk_scores (
  t timestamp NOT NULL DEFAULT now(),
  score double precision NOT NULL
);

-- make it a hypertable if you want (TimescaleDB)
SELECT create_hypertable('risk_scores', 't', if_not_exists => TRUE);

email-validator
