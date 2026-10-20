
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# Read the CSV from the same folder as this Python script.
BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "caire_training_data.csv"
MODEL_PATH = BASE_DIR / "caire_random_forest_demo.joblib"

df = pd.read_csv(CSV_PATH)

features = [
    "writing_score",
    "speaking_score",
    "vocabulary_score",
    "target_skill",
    "target_skill_score",
    "previous_target_skill_score",
    "attempts",
    "hints_used",
    "score_change",
]

target = "support_priority_label"
group_column = "student_id"

required_columns = features + [target, group_column]
missing_columns = [
    column for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"CSV is missing required columns: {missing_columns}\n"
        f"Available columns: {df.columns.tolist()}"
    )

# Keep records from the same fictional student in one split only.
X = df[features].copy()
y = df[target].copy()
groups = df[group_column].copy()

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.2,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(X, y, groups=groups)
)

X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

numeric = [
    "writing_score",
    "speaking_score",
    "vocabulary_score",
    "target_skill_score",
    "previous_target_skill_score",
    "attempts",
    "hints_used",
    "score_change",
]

categorical = ["target_skill"]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            SimpleImputer(strategy="median"),
            numeric,
        ),
        (
            "categorical",
            Pipeline(
                steps=[
                    (
                        "imputer",
                        SimpleImputer(strategy="most_frequent"),
                    ),
                    (
                        "onehot",
                        OneHotEncoder(handle_unknown="ignore"),
                    ),
                ]
            ),
            categorical,
        ),
    ]
)

model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=150,
                class_weight="balanced",
                random_state=42,
            ),
        ),
    ]
)

model.fit(X_train, y_train)
pred = model.predict(X_test)

print("DEMO ONLY: metrics on synthetic data")
print(classification_report(y_test, pred, zero_division=0))

labels = ["high", "medium", "low"]
print("Confusion matrix label order:", labels)
print(confusion_matrix(y_test, pred, labels=labels))

joblib.dump(model, MODEL_PATH)
print(f"Saved: {MODEL_PATH}")

example = pd.DataFrame(
    [
        {
            "writing_score": 55,
            "speaking_score": 65,
            "vocabulary_score": 56,
            "target_skill": "writing",
            "target_skill_score": 55,
            "previous_target_skill_score": 52,
            "attempts": 3,
            "hints_used": 1,
            "score_change": 3,
        }
    ]
)

print(
    "Example predicted support priority:",
    model.predict(example)[0],
)
