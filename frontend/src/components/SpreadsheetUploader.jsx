// frontend/src/components/SpreadsheetUploader.jsx
import React, { useState } from 'react';

const CustomFileInput = ({ label, onFileSelect, isLoading }) => {
  const [fileName, setFileName] = useState('');
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      onFileSelect(e.target.files[0]);
    } else {
      setFileName('');
      onFileSelect(null);
    }
  };
  return (
    <div className="custom-file-input-container">
      <label className="file-input-label">{label}</label>
      <label htmlFor={`file-upload-${label}`} className="custom-file-upload">
        {fileName || 'Select a file...'}
      </label>
      <input id={`file-upload-${label}`} type="file" onChange={handleFileChange} disabled={isLoading} />
    </div>
  );
};

function SpreadsheetUploader({ onAnalyze, isLoading, summaryData, analyzedData }) {
  const [studentFile, setStudentFile] = useState(null);
  const [academicFile, setAcademicFile] = useState(null);
  const [activityFile, setActivityFile] = useState(null);
  const [error, setError] = useState('');

  const handleUploadClick = () => {
    if (!studentFile || !academicFile || !activityFile) {
      setError('Please select all three required files.');
      return;
    }
    setError('');
    const formData = new FormData();
    formData.append('files', studentFile);
    formData.append('files', academicFile);
    formData.append('files', activityFile);
    onAnalyze(formData);
  };

  const highRiskCount = analyzedData?.filter(s => s.predicted_risk === 'High').length || 0;
  const mediumRiskCount = analyzedData?.filter(s => s.predicted_risk === 'Medium').length || 0;

  return (
    <div className="uploader-container">
      <div>
        <h2>Data Upload</h2>
        <div className="uploader-grid">
          <CustomFileInput label="Students File" onFileSelect={setStudentFile} isLoading={isLoading} />
          <CustomFileInput label="Academic Records" onFileSelect={setAcademicFile} isLoading={isLoading} />
          <CustomFileInput label="Activity Records" onFileSelect={setActivityFile} isLoading={isLoading} />
        </div>
        <button onClick={handleUploadClick} disabled={isLoading} className="analyze-button">
          {isLoading ? 'Analyzing...' : 'Analyze Data'}
        </button>
        {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
      </div>
      {summaryData && (
        <div className="analysis-summary">
          <h2>Analysis Summary</h2>
          <div className="summary-item">
            <span>Total Students</span>
            <strong>{summaryData.total_students}</strong>
          </div>
          <div className="summary-item">
            <span>High Risk</span>
            <strong className="high-risk-text">{highRiskCount}</strong>
          </div>
          <div className="summary-item">
            <span>Medium Risk</span>
            <strong className="medium-risk-text">{mediumRiskCount}</strong>
          </div>
          <div className="summary-item">
            <span>Avg. Attendance</span>
            <strong>{summaryData.average_attendance.toFixed(1)}%</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpreadsheetUploader;