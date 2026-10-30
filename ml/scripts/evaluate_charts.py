
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, f1_score, confusion_matrix,
    ConfusionMatrixDisplay
)
from sklearn.model_selection import StratifiedGroupKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

BASE = Path(r"D:\Research\Reading_Fluency\pipeline")
OUTPUT = BASE / "evaluation_charts"
OUTPUT.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "wpm", "wcpm", "accuracy", "skip_rate", "sub_rate",
    "ins_rate", "pause_count", "avg_pause",
    "total_pause", "long_pauses", "duration"
]
ORDER = ["Low", "Medium", "High"]

df = pd.read_csv(BASE / "features.csv")
df = df[df["Teacher_Label"].isin(ORDER)].reset_index(drop=True)

X = df[FEATURES].values
y = df["Teacher_Label"].map(
    {label: i for i, label in enumerate(ORDER)}
).values
groups = df["Student_ID"].values

models = {
    "Logistic Regression": make_pipeline(
        StandardScaler(),
        LogisticRegression(max_iter=2000, class_weight="balanced")
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=300, max_depth=5,
        min_samples_leaf=3, class_weight="balanced",
        random_state=42
    ),
    "XGBoost": XGBClassifier(
        n_estimators=150, max_depth=3,
        learning_rate=0.1, subsample=0.8,
        colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42
    )
}

results = []
confusion_matrices = {}

for name, model in models.items():
    accuracies = []
    f1_scores = []

    for seed in range(5):
        cv = StratifiedGroupKFold(
            n_splits=5, shuffle=True, random_state=seed
        )

        predictions = cross_val_predict(
            model, X, y, cv=cv, groups=groups
        )

        accuracies.append(accuracy_score(y, predictions))
        f1_scores.append(f1_score(y, predictions, average="macro"))

        if seed == 0:
            confusion_matrices[name] = confusion_matrix(
                y, predictions, labels=[0, 1, 2]
            )

    results.append({
        "Model": name,
        "Accuracy": np.mean(accuracies),
        "Macro_F1": np.mean(f1_scores),
        "Accuracy_SD": np.std(accuracies),
        "F1_SD": np.std(f1_scores)
    })

results_df = pd.DataFrame(results)
results_df.to_csv(OUTPUT / "model_comparison.csv", index=False)

print("\n=== MODEL COMPARISON ===")
print(results_df.round(3).to_string(index=False))

# Chart 1: Model comparison
x = np.arange(len(results_df))
width = 0.35

fig, ax = plt.subplots(figsize=(10, 6))
bars1 = ax.bar(
    x - width / 2, results_df["Accuracy"] * 100,
    width, label="Accuracy"
)
bars2 = ax.bar(
    x + width / 2, results_df["Macro_F1"] * 100,
    width, label="Macro F1"
)

ax.set_xticks(x)
ax.set_xticklabels(results_df["Model"])
ax.set_ylabel("Score (%)")
ax.set_ylim(0, 100)
ax.set_title("ML Model Comparison - Grouped Cross-Validation")
ax.legend()
ax.bar_label(bars1, fmt="%.1f")
ax.bar_label(bars2, fmt="%.1f")

plt.tight_layout()
plt.savefig(OUTPUT / "01_model_comparison.png", dpi=300)
plt.close()

# Select best model by mean macro F1
best_row = results_df.loc[results_df["Macro_F1"].idxmax()]
best_name = best_row["Model"]

print("\nBest model:", best_name)

# Chart 2: Confusion matrix from seed 0
cm = confusion_matrices[best_name]
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm, display_labels=ORDER
)

fig, ax = plt.subplots(figsize=(7, 6))
disp.plot(ax=ax, cmap="Blues", values_format="d")
ax.set_title(f"Confusion Matrix - {best_name}\nSeed 0 Grouped CV")
plt.tight_layout()
plt.savefig(OUTPUT / "02_confusion_matrix.png", dpi=300)
plt.close()

# Chart 3: Random Forest feature importance
rf = models["Random Forest"]
rf.fit(X, y)

importance = pd.Series(
    rf.feature_importances_, index=FEATURES
).sort_values()

fig, ax = plt.subplots(figsize=(9, 6))
importance.plot(kind="barh", ax=ax)
ax.set_xlabel("Feature Importance")
ax.set_title("Random Forest Feature Importance")
plt.tight_layout()
plt.savefig(OUTPUT / "03_feature_importance.png", dpi=300)
plt.close()

print("\nCharts saved to:", OUTPUT)
print("1. 01_model_comparison.png")
print("2. 02_confusion_matrix.png")
print("3. 03_feature_importance.png")
