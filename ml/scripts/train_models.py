import warnings
import joblib
import numpy as np, pandas as pd
from pathlib import Path
from scipy.stats import spearmanr
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
from sklearn.model_selection import StratifiedGroupKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")
BASE = Path(r"D:\Research\Reading_Fluency\pipeline")
FEATURES = ["wpm", "wcpm", "accuracy", "skip_rate", "sub_rate", "ins_rate",
            "pause_count", "avg_pause", "total_pause", "long_pauses", "duration"]
ORDER = ["Low", "Medium", "High"]
TARGET_WCPM = 110      # assumption: wcpm that earns full speed credit

df = pd.read_csv(BASE / "features.csv")
df = df[df["Teacher_Label"].isin(ORDER)].reset_index(drop=True)

# ---- RFCS (0-100): weighted combination of fluency features ----
def rfcs(r):
    accuracy = r["accuracy"]
    speed = min(r["wcpm"] / TARGET_WCPM, 1.0)
    completion = 1 - r["skip_rate"]
    pausing = 1 - min(r["avg_pause"] / 2.0, 1.0)
    return 100 * (0.35 * accuracy + 0.30 * speed + 0.20 * completion + 0.15 * pausing)

df["RFCS"] = df.apply(rfcs, axis=1)
rho, p = spearmanr(df["RFCS"], df["Teacher_Score"])
print(f"RFCS vs Teacher_Score: Spearman rho = {rho:.2f} (p = {p:.1e})")
print(df.groupby("Teacher_Label")["RFCS"].agg(["count", "mean", "min", "max"]).loc[ORDER].round(1))
df.to_csv(BASE / "features_rfcs.csv", index=False, encoding="utf-8-sig")

# ---- ML models: grouped cross-validation by student ----
X = df[FEATURES].values
y = df["Teacher_Label"].map({l: i for i, l in enumerate(ORDER)}).values
groups = df["Student_ID"].values

models = {
    "LogisticRegression": make_pipeline(StandardScaler(),
        LogisticRegression(max_iter=2000, class_weight="balanced")),
    "RandomForest": RandomForestClassifier(n_estimators=300, max_depth=5,
        min_samples_leaf=3, class_weight="balanced", random_state=42),
    "XGBoost": XGBClassifier(n_estimators=150, max_depth=3, learning_rate=0.1,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss", random_state=42),
}

summary = {}
for name, model in models.items():
    accs, f1s = [], []
    for seed in range(5):
        cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=seed)
        pred = cross_val_predict(model, X, y, cv=cv, groups=groups)
        accs.append(accuracy_score(y, pred))
        f1s.append(f1_score(y, pred, average="macro"))
        if seed == 0:
            cm = confusion_matrix(y, pred, labels=[0, 1, 2])
    summary[name] = np.mean(f1s)
    print(f"\n=== {name} ===")
    print(f"accuracy {np.mean(accs):.2f} +/- {np.std(accs):.2f} | macro-F1 {np.mean(f1s):.2f} +/- {np.std(f1s):.2f}")
    print(pd.DataFrame(cm, index=[f"true_{l}" for l in ORDER], columns=[f"pred_{l}" for l in ORDER]))

best = max(summary, key=summary.get)
print(f"\nBest model by macro-F1: {best}")
final = models[best].fit(X, y)
joblib.dump({"model": final, "features": FEATURES, "classes": ORDER, "name": best,
             "target_wcpm": TARGET_WCPM}, BASE / "model.pkl")
print("Saved model.pkl")

rf = models["RandomForest"].fit(X, y)
imp = pd.Series(rf.feature_importances_, index=FEATURES).sort_values(ascending=False).round(3)
print("\nRandom Forest feature importance:\n", imp)