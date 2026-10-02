import pandas as pd
df = pd.read_csv("features.csv")
feats = ["wpm","wcpm","accuracy","skip_rate","sub_rate","ins_rate",
         "pause_count","avg_pause","total_pause","long_pauses","duration"]

print("== Spearman correlation with Teacher_Score ==")
print(df[feats + ["Teacher_Score"]].corr(method="spearman")["Teacher_Score"].drop("Teacher_Score").round(2).sort_values())

print("\n== Median feature values per Teacher_Label ==")
print(df.groupby("Teacher_Label")[feats].median().round(2).T[["Low","Medium","High"]])

print("\n== Suspicious recordings ==")
bad = df[(df.window_words < 20) | (df.extra_words > 40) | (df.avg_pause > 5)]
print(bad[["Audio_File","window_words","extra_words","duration","avg_pause","Teacher_Score","Teacher_Label"]].to_string(index=False))