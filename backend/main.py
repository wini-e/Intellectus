# backend/main.py
import pandas as pd
import io
import joblib
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from sklearn.preprocessing import LabelEncoder

# Initialize the FastAPI app and add middleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Model and Encoder
try:
    model = joblib.load('student_risk_model.joblib')
    fee_status_encoder = joblib.load('fee_status_encoder.joblib')
    feature_names = joblib.load('feature_names.joblib')
    print("Model and encoder loaded successfully.")
except FileNotFoundError:
    model, fee_status_encoder, feature_names = None, None, None
    print("WARNING: Model/encoder not found. Predictions will be disabled.")

# Helper Functions
def read_spreadsheet(file_content: bytes, filename: str) -> pd.DataFrame:
    if filename.endswith('.csv'):
        return pd.read_csv(io.BytesIO(file_content))
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        return pd.read_excel(io.BytesIO(file_content))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {filename}")

def calculate_attendance(group):
    present_days = group[group['status'] == 'Present'].shape[0]
    total_days = group.shape[0]
    return (present_days / total_days) * 100 if total_days > 0 else 0

def check_consecutive_absences(group):
    absences = (group['status'] == 'Absent').astype(int)
    consecutive_count = 0
    for val in absences:
        if val == 1:
            consecutive_count += 1
        else:
            consecutive_count = 0
        if consecutive_count >= 3:
            return True
    return False

# Main Analysis Endpoint
@app.post("/analyze-spreadsheets/")
async def analyze_data(files: List[UploadFile] = File(...)):
    try:
        # File Reading and Identification Logic
        file_map = {'students': None, 'academic_records': None, 'activity_records': None}
        for uploaded_file in files:
            content = await uploaded_file.read()
            if 'students' in uploaded_file.filename.lower():
                file_map['students'] = read_spreadsheet(content, uploaded_file.filename)
            elif 'academic_records' in uploaded_file.filename.lower():
                file_map['academic_records'] = read_spreadsheet(content, uploaded_file.filename)
            elif 'activity_records' in uploaded_file.filename.lower():
                file_map['activity_records'] = read_spreadsheet(content, uploaded_file.filename)

        if any(df is None for df in file_map.values()):
            raise HTTPException(status_code=400, detail="One or more files not identified. Check filenames.")

        students_df = file_map['students']
        academic_df = file_map['academic_records']
        activity_df = file_map['activity_records']

        # Data Analysis Logic
        academic_summary = academic_df.groupby('student_id').agg(
            overall_grade_avg=('score', 'mean'),
            failed_subjects_count=('attempt_number', lambda x: (x > 1).sum())
        ).reset_index()

        attendance_df = activity_df[activity_df['record_type'] == 'attendance'].copy()
        fees_df = activity_df[activity_df['record_type'] == 'fee_status'].copy()

        attendance_summary = attendance_df.groupby('student_id').apply(
            lambda g: pd.Series({
                'attendance_percentage': calculate_attendance(g),
                'has_consecutive_absences': check_consecutive_absences(g)
            })
        ).reset_index()

        if not fees_df.empty and 'semester' in fees_df.columns:
             current_semester_fees = pd.merge(fees_df, students_df[['student_id', 'semester']], on='student_id', suffixes=('_fee', '_student'))
             current_semester_fees = current_semester_fees[current_semester_fees['semester_fee'] == current_semester_fees['semester_student']]
             fee_summary = current_semester_fees.sort_values('date').groupby('student_id').last().reset_index()
             fee_summary = fee_summary[['student_id', 'status']].rename(columns={'status': 'fee_status'})
        else:
             fee_summary = fees_df.sort_values('date').groupby('student_id').last().reset_index()
             fee_summary = fee_summary[['student_id', 'status']].rename(columns={'status': 'fee_status'})

        # Merge and Clean Data
        final_df = students_df
        final_df = pd.merge(final_df, academic_summary, on='student_id', how='left')
        final_df = pd.merge(final_df, attendance_summary, on='student_id', how='left')
        final_df = pd.merge(final_df, fee_summary, on='student_id', how='left')

        final_df.fillna({
            'overall_grade_avg': 0, 'failed_subjects_count': 0,
            'attendance_percentage': 100, 'has_consecutive_absences': False,
            'fee_status': 'Not Available'
        }, inplace=True)

        final_df['overall_grade_avg'] = final_df['overall_grade_avg'].round(2)
        final_df['attendance_percentage'] = final_df['attendance_percentage'].round(2)

        # Make predictions
        if model and fee_status_encoder and feature_names:
            prediction_features = final_df.copy()
            
            known_fee_statuses = fee_status_encoder.classes_
            prediction_features['fee_status'] = prediction_features['fee_status'].apply(
                lambda x: x if x in known_fee_statuses else 'Unknown'
            )
            
            if 'Unknown' not in fee_status_encoder.classes_:
                fee_status_encoder.classes_ = np.append(fee_status_encoder.classes_, 'Unknown')

            prediction_features['fee_status_encoded'] = fee_status_encoder.transform(prediction_features['fee_status'])
            
            prediction_features = prediction_features[feature_names]

            predictions = model.predict(prediction_features)
            final_df['predicted_risk'] = predictions
        else:
            final_df['predicted_risk'] = 'Model Not Loaded'

        return final_df.to_dict(orient='records')
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {e}")


# Summary Endpoint for Dashboard Visuals
@app.post("/generate-summary/")
async def generate_summary(students: List[Dict]):
    if not students:
        raise HTTPException(status_code=400, detail="No student data provided.")
    df = pd.DataFrame(students)
    risk_distribution = df['predicted_risk'].value_counts().to_dict()
    scatter_data = df[['attendance_percentage', 'overall_grade_avg']].to_dict('records')
    total_students = len(df)
    average_attendance = df['attendance_percentage'].mean()
    average_grade = df['overall_grade_avg'].mean()
    return {
        "risk_distribution": risk_distribution,
        "scatter_data": scatter_data,
        "total_students": total_students,
        "average_attendance": average_attendance,
        "average_grade": average_grade
    }