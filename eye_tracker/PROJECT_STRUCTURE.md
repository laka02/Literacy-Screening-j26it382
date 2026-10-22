# Eye Tracker Project Structure

Current development structure for the project in `eye_tracker/`:

```text
ey_tracker/
├── .venv/                     # Local Python virtual environment
├── data/                      # Project data storage (currently empty)
├── recordings/                # Video or session recordings (currently empty)
├── results/                   # Processed outputs / analysis results (currently empty)
├── eye_landmarks.csv          # Captured eye landmark samples from webcam tracking
├── main.py                    # Core webcam eye-tracking script using MediaPipe
├── PROJECT_STRUCTURE.md        # This file
└── README.md                  # Optional project documentation (not present yet)
```

## Notes

- `main.py` opens the webcam, tracks facial landmarks with MediaPipe, estimates iris positions, and saves timestamped values to `eye_landmarks.csv`.
- `eye_landmarks.csv` currently contains columns such as:
  - `timestamp_seconds`
  - `left_iris_x_relative`
  - `left_iris_y_relative`
  - `right_iris_x_relative`
  - `right_iris_y_relative`
- `data/`, `recordings/`, and `results/` are present as project folders for future pipeline stages and outputs.
- `.venv/` is the local environment used for running the project dependencies.
