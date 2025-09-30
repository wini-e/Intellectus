import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

print("--- Starting Model Training ---")

data = {
    'overall_grade_avg': [88, 68, 55, 95, 78, 58, 82, 45, 65, 49, 90],
    'failed_subjects_count': [0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 0],
    'attendance_percentage': [95, 80, 65, 98, 88, 70, 91, 60, 85, 68, 100],
    'fee_status': ['Paid', 'Due', 'Overdue', 'Paid', 'Due', 'Overdue', 'Paid', 'Overdue', 'Paid', 'Overdue', 'Not Available'],
    'risk_level': ['Low', 'Medium', 'High', 'Low', 'Medium', 'High', 'Low', 'High', 'Medium', 'High', 'Low']
}
df = pd.DataFrame(data)
print("Loaded sample data.")

le = LabelEncoder()
df['fee_status_encoded'] = le.fit_transform(df['fee_status'])

features = ['overall_grade_avg', 'failed_subjects_count', 'attendance_percentage', 'fee_status_encoded']
target = 'risk_level'

X = df[features]
y = df[target]
print("Data preprocessed.")

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)
print("Model training complete.")

joblib.dump(model, 'student_risk_model.joblib')
joblib.dump(le, 'fee_status_encoder.joblib')
joblib.dump(features, 'feature_names.joblib')

print("\n--- Model, encoder, and feature names saved successfully! ---")