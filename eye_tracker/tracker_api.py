import csv
import json
import subprocess
import sys
import threading
from pathlib import Path

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent

TRACKER_SCRIPT = BASE_DIR / "main.py"
CSV_FILE = BASE_DIR / "calibration_samples.csv"
TARGET_FILE = BASE_DIR / "calibration_target.json"
MODEL_FILE = BASE_DIR / "calibration_model.json"
LOG_FILE = BASE_DIR / "tracker.log"
STOP_FILE = BASE_DIR / "stop_tracker.flag"

FEATURES = [
    "left_iris_x_relative",
    "left_iris_y_relative",
    "right_iris_x_relative",
    "right_iris_y_relative",
    "head_yaw_degrees",
    "head_pitch_degrees",
    "head_roll_degrees",
    "nose_x_normalized",
    "nose_y_normalized",
    "shoulder_mid_x_normalized",
    "shoulder_mid_y_normalized",
]

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        ]
    }
})

process = None
lock = threading.Lock()


def running():
    return process is not None and process.poll() is None


def set_target(payload):
    temporary_file = TARGET_FILE.with_suffix(".tmp")
    temporary_file.write_text(
        json.dumps(payload), encoding="utf-8"
    )
    temporary_file.replace(TARGET_FILE)


def inactive_target(stage="idle", participant_code=""):
    return {
        "active": False,
        "stage": stage,
        "target_index": -1,
        "x": None,
        "y": None,
        "participant_code": participant_code,
    }


def numeric(value, default=0.0):
    try:
        number = float(value)
        return number if np.isfinite(number) else default
    except (TypeError, ValueError):
        return default


def features_from_row(row):
    return [numeric(row.get(name)) for name in FEATURES]


def read_rows():
    if not CSV_FILE.exists():
        return []

    with CSV_FILE.open(
        "r", newline="", encoding="utf-8"
    ) as file:
        return list(csv.DictReader(file))


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "python-tracker"
    })


@app.get("/api/tracker/status")
def tracker_status():
    with lock:
        active = running()

    return jsonify({
        "status": "running" if active else "stopped"
    })


@app.post("/api/tracker/start")
def start_tracker():
    global process

    payload = request.get_json(silent=True) or {}
    participant_code = str(
        payload.get("participant_code", "")
    ).strip()

    with lock:
        if running():
            return jsonify({"status": "already_running"})

        if not TRACKER_SCRIPT.exists():
            return jsonify({
                "error": "main.py was not found"
            }), 404

        STOP_FILE.unlink(missing_ok=True)
        MODEL_FILE.unlink(missing_ok=True)

        set_target(inactive_target(
            participant_code=participant_code
        ))

        try:
            with LOG_FILE.open(
                "a", encoding="utf-8"
            ) as log:
                process = subprocess.Popen(
                    [sys.executable, str(TRACKER_SCRIPT)],
                    cwd=str(BASE_DIR),
                    stdin=subprocess.DEVNULL,
                    stdout=log,
                    stderr=subprocess.STDOUT,
                )
        except OSError as error:
            process = None
            return jsonify({
                "error": f"Could not start tracker: {error}"
            }), 500

        started_process = process

    try:
        started_process.wait(timeout=0.5)
    except subprocess.TimeoutExpired:
        pass

    with lock:
        if (
            process is started_process
            and started_process.poll() is not None
        ):
            process = None
            return jsonify({
                "status": "error",
                "message": "Tracker exited during startup. "
                           "Check tracker.log."
            }), 500

    return jsonify({
        "status": "started",
        "message": "Camera tracker launched"
    })


@app.post("/api/tracker/stop")
def stop_tracker():
    global process

    with lock:
        current = process

        if current is None or current.poll() is not None:
            process = None
            set_target(inactive_target())
            return jsonify({"status": "not_running"})

        set_target(inactive_target())
        STOP_FILE.write_text("stop", encoding="utf-8")

    try:
        current.wait(timeout=5)
    except subprocess.TimeoutExpired:
        current.terminate()

        try:
            current.wait(timeout=3)
        except subprocess.TimeoutExpired:
            current.kill()
            current.wait()

    with lock:
        if process is current:
            process = None

    return jsonify({"status": "stopped"})


@app.post("/api/calibration/target")
def calibration_target():
    payload = request.get_json(silent=True) or {}

    stage = payload.get("stage")

    if stage not in {
        "eye", "eye_head", "validation", "reading", "idle"
    }:
        return jsonify({
            "error": "Invalid stage"
        }), 400

    active = bool(payload.get("active", False))
    target_index = payload.get("target_index", -1)
    x = payload.get("x")
    y = payload.get("y")

    participant_code = str(
        payload.get("participant_code", "")
    ).strip()

    if active and stage in {"eye", "eye_head", "validation"}:
        if not isinstance(x, (int, float)) or not isinstance(
            y, (int, float)
        ):
            return jsonify({
                "error": "Calibration targets require x and y"
            }), 400

        if not (0 <= x <= 1 and 0 <= y <= 1):
            return jsonify({
                "error": "Target coordinates must be between 0 and 1"
            }), 400

        if not isinstance(target_index, int) or target_index < 0:
            return jsonify({
                "error": "Invalid target index"
            }), 400

    if active and stage == "reading" and not MODEL_FILE.exists():
        return jsonify({
            "error": "Calibration model not found. "
                     "Complete eye/head calibration first."
        }), 400

    target = {
        "active": active,
        "stage": stage,
        "target_index": target_index,
        "x": x,
        "y": y,
        "participant_code": participant_code,
    }

    set_target(target)

    return jsonify({
        "status": "ok",
        "target": target
    })


@app.post("/api/calibration/fit")
def fit_calibration():
    rows = read_rows()

    # Train from the combined eye + head calibration stage.
    training_rows = [
        row for row in rows
        if row.get("stage") == "eye_head"
        and row.get("face_detected") == "1"
        and row.get("target_x") not in ("", None)
        and row.get("target_y") not in ("", None)
    ]

    if len(training_rows) < 20:
        return jsonify({
            "error": (
                f"Not enough calibration samples: "
                f"{len(training_rows)}. Complete the eye/head "
                "calibration and try again."
            ),
            "sample_count": len(training_rows)
        }), 400

    x_values = []
    y_values = []

    for row in training_rows:
        feature_values = [
            float(value) for value in features_from_row(row)
        ]

        feature_values.append(1.0)

        x_values.append(feature_values)

        y_values.append([
            float(row["target_x"]),
            float(row["target_y"])
        ])

    X = np.asarray(x_values, dtype=np.float64)
    Y = np.asarray(y_values, dtype=np.float64)

    coefficients, _, _, _ = np.linalg.lstsq(
        X, Y, rcond=None
    )

    predictions = X @ coefficients
    rmse = np.sqrt(np.mean((predictions - Y) ** 2, axis=0))

    model = {
        "coefficients": coefficients.tolist(),
        "feature_names": FEATURES,
        "sample_count": len(training_rows),
        "calibration_rmse_x": float(rmse[0]),
        "calibration_rmse_y": float(rmse[1]),
    }

    MODEL_FILE.write_text(
        json.dumps(model, indent=2),
        encoding="utf-8"
    )

    return jsonify({
        "status": "ok",
        "sample_count": len(training_rows),
        "calibration_rmse_x": round(float(rmse[0]), 4),
        "calibration_rmse_y": round(float(rmse[1]), 4),
        "message": "Calibration model saved"
    })


@app.get("/api/calibration/summary")
def calibration_summary():
    counts = {"eye": {}, "eye_head": {}}

    try:
        rows = read_rows()

        for row in rows:
            stage = row.get("stage")
            target_index = row.get("target_index")

            if stage in counts and target_index not in ("", None):
                counts[stage][target_index] = (
                    counts[stage].get(target_index, 0) + 1
                )

        model = {}

        if MODEL_FILE.exists():
            model = json.loads(
                MODEL_FILE.read_text(encoding="utf-8")
            )

        return jsonify({
            "status": "ok",
            "counts": counts,
            "sample_count": len(rows),
            "model": model
        })

    except (OSError, csv.Error, json.JSONDecodeError) as error:
        return jsonify({"error": str(error)}), 500


@app.get("/api/tracker/samples")
def tracker_samples():
    stage_filter = request.args.get("stage", "reading")

    try:
        rows = read_rows()

        filtered = [
            row for row in rows
            if row.get("stage") == stage_filter
        ]

        result = []

        for row in filtered:
            try:
                gaze_x = float(row["gaze_x"])
            except (TypeError, ValueError, KeyError):
                gaze_x = None

            try:
                gaze_y = float(row["gaze_y"])
            except (TypeError, ValueError, KeyError):
                gaze_y = None

            if gaze_x is not None and not np.isfinite(gaze_x):
                gaze_x = None
            if gaze_y is not None and not np.isfinite(gaze_y):
                gaze_y = None

            result.append({
                "timestamp_seconds": numeric(
                    row.get("timestamp_seconds")
                ),
                "gaze_x": gaze_x,
                "gaze_y": gaze_y,
                "face_detected": row.get("face_detected") == "1",
                "prediction_available": (
                    gaze_x is not None and gaze_y is not None
                ),
                "target_index": int(numeric(
                    row.get("target_index"), default=-1
                )),
                "target_x": numeric(row.get("target_x")),
                "target_y": numeric(row.get("target_y")),
            })

        return jsonify({
            "status": "ok",
            "sample_count": len(result),
            "samples": result
        })

    except (OSError, csv.Error) as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    set_target(inactive_target())

    app.run(
        host="127.0.0.1",
        port=8000,
        debug=False,
        threaded=True
    )