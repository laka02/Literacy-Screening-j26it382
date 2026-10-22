import csv
import json
import time
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
TARGET_FILE = BASE_DIR / "calibration_target.json"
CSV_FILE = BASE_DIR / "calibration_samples.csv"
MODEL_FILE = BASE_DIR / "calibration_model.json"
STOP_FILE = BASE_DIR / "stop_tracker.flag"

FIELDS = [
    "participant_code", "timestamp_seconds", "stage",
    "target_index", "target_x", "target_y",
    "left_iris_x_relative", "left_iris_y_relative",
    "right_iris_x_relative", "right_iris_y_relative",
    "head_yaw_degrees", "head_pitch_degrees",
    "head_roll_degrees", "nose_x_normalized",
    "nose_y_normalized", "shoulder_mid_x_normalized",
    "shoulder_mid_y_normalized", "face_detected",
    "pose_detected", "gaze_x", "gaze_y"
]

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

MODEL_POINTS = np.array([
    (0, 0, 0),
    (0, -330, -65),
    (-225, 170, -135),
    (225, 170, -135),
    (-150, -150, -125),
    (150, -150, -125)
], dtype=np.float64)


def read_json(path, default=None):
    if default is None:
        default = {}

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def numeric(value, default=0.0):
    try:
        result = float(value)
        if np.isfinite(result):
            return result
    except (TypeError, ValueError):
        pass

    return default


def feature_vector(row):
    return np.array(
        [numeric(row.get(name)) for name in FEATURES],
        dtype=np.float64
    )


def iris_features(landmarks, iris_indices,
                  corner_a, corner_b, upper_lid, lower_lid,
                  width, height):

    def point(index):
        return np.array([
            landmarks[index].x * width,
            landmarks[index].y * height
        ], dtype=np.float64)

    iris_center = np.mean(
        [point(i) for i in iris_indices],
        axis=0
    )

    a = point(corner_a)
    b = point(corner_b)
    upper = point(upper_lid)
    lower = point(lower_lid)

    eye_width = np.linalg.norm(b - a)
    eye_height = np.linalg.norm(lower - upper)

    if eye_width < 1 or eye_height < 1:
        return None, None

    horizontal = np.dot(
        iris_center - a, b - a
    ) / (eye_width ** 2)

    vertical = np.dot(
        iris_center - upper, lower - upper
    ) / (eye_height ** 2)

    return float(horizontal), float(vertical)


def estimate_head_pose(landmarks, width, height):
    image_points = np.array([
        (landmarks[1].x * width, landmarks[1].y * height),
        (landmarks[152].x * width, landmarks[152].y * height),
        (landmarks[33].x * width, landmarks[33].y * height),
        (landmarks[263].x * width, landmarks[263].y * height),
        (landmarks[61].x * width, landmarks[61].y * height),
        (landmarks[291].x * width, landmarks[291].y * height),
    ], dtype=np.float64)

    focal_length = float(width)

    camera_matrix = np.array([
        [focal_length, 0, width / 2],
        [0, focal_length, height / 2],
        [0, 0, 1]
    ], dtype=np.float64)

    distortion = np.zeros((4, 1), dtype=np.float64)

    try:
        ok, rotation_vector, _ = cv2.solvePnP(
            MODEL_POINTS,
            image_points,
            camera_matrix,
            distortion,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not ok:
            return None, None, None

        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        angles = cv2.RQDecomp3x3(rotation_matrix)[0]

        pitch, yaw, roll = [float(v) for v in angles]

        return yaw, pitch, roll

    except cv2.error:
        return None, None, None


def predict_gaze(row):
    model = read_json(MODEL_FILE)

    if not model.get("coefficients"):
        return None, None

    try:
        vector = feature_vector(row)
        vector = np.append(vector, 1.0)

        coefficients = np.array(
            model["coefficients"],
            dtype=np.float64
        )

        prediction = vector @ coefficients

        # Preserve out-of-screen predictions so the client can reject them
        # instead of displaying them as false hotspots at the screen edge.
        return float(prediction[0]), float(prediction[1])

    except (ValueError, TypeError, KeyError):
        return None, None


def main():
    STOP_FILE.unlink(missing_ok=True)

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        camera.release()
        raise RuntimeError(
            "Could not open webcam. Check camera permissions "
            "and close other applications using the camera."
        )

    face_mesh_module = mp.solutions.face_mesh
    pose_module = mp.solutions.pose

    started = time.perf_counter()
    sample_count = 0

    try:
        with CSV_FILE.open(
            "w", newline="", encoding="utf-8"
        ) as csv_file:

            writer = csv.DictWriter(
                csv_file, fieldnames=FIELDS
            )
            writer.writeheader()
            csv_file.flush()

            with face_mesh_module.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            ) as face_mesh, pose_module.Pose(
                static_image_mode=False,
                model_complexity=1,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            ) as pose:

                while camera.isOpened():
                    if STOP_FILE.exists():
                        break

                    ok, frame = camera.read()

                    if not ok:
                        break

                    # Mirror the preview for a natural webcam experience.
                    frame = cv2.flip(frame, 1)

                    height, width = frame.shape[:2]
                    rgb = cv2.cvtColor(
                        frame, cv2.COLOR_BGR2RGB
                    )

                    face_result = face_mesh.process(rgb)
                    pose_result = pose.process(rgb)

                    elapsed = time.perf_counter() - started

                    target = read_json(
                        TARGET_FILE,
                        {
                            "active": False,
                            "stage": "idle",
                            "target_index": -1,
                            "x": None,
                            "y": None,
                            "participant_code": ""
                        }
                    )

                    face_found = bool(
                        face_result.multi_face_landmarks
                    )
                    pose_found = bool(pose_result.pose_landmarks)

                    row = {field: None for field in FIELDS}

                    row.update({
                        "participant_code":
                            target.get("participant_code", ""),
                        "timestamp_seconds": round(elapsed, 4),
                        "stage": target.get("stage", "idle"),
                        "target_index":
                            target.get("target_index", -1),
                        "target_x": target.get("x"),
                        "target_y": target.get("y"),
                        "face_detected": int(face_found),
                        "pose_detected": int(pose_found),
                    })

                    if face_found:
                        landmarks = (
                            face_result.multi_face_landmarks[0].landmark
                        )

                        left_x, left_y = iris_features(
                            landmarks, [468, 469, 470, 471, 472],
                            33, 133, 159, 145, width, height
                        )

                        right_x, right_y = iris_features(
                            landmarks, [473, 474, 475, 476, 477],
                            362, 263, 386, 374, width, height
                        )

                        yaw, pitch, roll = estimate_head_pose(
                            landmarks, width, height
                        )

                        row.update({
                            "left_iris_x_relative": left_x,
                            "left_iris_y_relative": left_y,
                            "right_iris_x_relative": right_x,
                            "right_iris_y_relative": right_y,
                            "head_yaw_degrees": yaw,
                            "head_pitch_degrees": pitch,
                            "head_roll_degrees": roll,
                            "nose_x_normalized":
                                float(landmarks[1].x),
                            "nose_y_normalized":
                                float(landmarks[1].y),
                        })

                        for index in [
                            33, 133, 159, 145, 362, 263,
                            386, 374, 468, 473, 1
                        ]:
                            point = (
                                int(landmarks[index].x * width),
                                int(landmarks[index].y * height)
                            )
                            cv2.circle(
                                frame, point, 3, (0, 255, 0), -1
                            )

                    if pose_found:
                        pose_landmarks = (
                            pose_result.pose_landmarks.landmark
                        )

                        left_shoulder = pose_landmarks[11]
                        right_shoulder = pose_landmarks[12]

                        row["shoulder_mid_x_normalized"] = float(
                            (left_shoulder.x + right_shoulder.x) / 2
                        )
                        row["shoulder_mid_y_normalized"] = float(
                            (left_shoulder.y + right_shoulder.y) / 2
                        )

                    if target.get("active"):
                        if (
                            face_found
                            and target.get("stage")
                            in {"reading", "validation"}
                        ):
                            gaze_x, gaze_y = predict_gaze(row)
                            row["gaze_x"] = gaze_x
                            row["gaze_y"] = gaze_y

                        writer.writerow(row)
                        csv_file.flush()
                        sample_count += 1

                    label = (
                        f"{target.get('stage', 'idle')} | "
                        f"Samples: {sample_count} | Q to quit"
                    )

                    cv2.putText(
                        frame, label, (12, 28),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55, (0, 255, 0), 2
                    )

                    cv2.imshow(
                        "EyeTrack - Camera Tracker", frame
                    )

                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break

    finally:
        camera.release()
        cv2.destroyAllWindows()

        print(f"Capture ended. Samples: {sample_count}")
        print(f"CSV saved to: {CSV_FILE}")


if __name__ == "__main__":
    main()