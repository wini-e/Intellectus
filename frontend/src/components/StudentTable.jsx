// frontend/src/components/StudentTable.jsx
import React, { useState } from 'react';
import './Modal.css';

// Helper function to get the CSS class for the risk tag
const getRiskClassName = (riskLevel) => {
  if (!riskLevel) return '';
  const level = riskLevel.toLowerCase();
  if (level === 'low') return 'low';
  if (level === 'medium') return 'medium';
  if (level === 'high') return 'high';
  return '';
};

// Helper component for the gradient bar in the modal
const GradientBar = ({ value, max }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const hue = (percentage / 100) * 120; // 0 is red, 120 is green
  const color = `hsl(${hue}, 90%, 45%)`;
  return (
    <div className="bar-background">
      <div className="bar-foreground" style={{ width: `${percentage}%`, backgroundColor: color }} />
    </div>
  );
};

function StudentTable({ students }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleViewClick = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  async function sendNotification(student) {
    if (!window.confirm(`Send notification for ${student.full_name}?`)) return;
    try {
      const res = await fetch("http://localhost:4000/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: student.guardian_email,
          subject: `Student Risk Alert: ${student.full_name}`,
          message: `This is an alert for ${student.full_name} (${student.student_id}), who is currently at ${student.predicted_risk} risk.`
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Notification sent successfully!");
      } else {
        alert("Failed to send notification: " + JSON.stringify(data.error));
      }
    } catch (err) {
      alert("Error: Is the notification server running on port 4000?");
    }
  }

  return (
    <>
      <h2>Student Risk Overview</h2>
      <table className="student-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>AI Predicted Risk</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* This map function renders the student list */}
          {students.map((student) => (
            <tr key={student.student_id}>
              <td>{student.student_id}</td>
              <td>{student.full_name}</td>
              <td>
                <span className={`risk-tag ${getRiskClassName(student.predicted_risk)}`}>
                  {student.predicted_risk}
                </span>
              </td>
              <td>
                <button onClick={() => handleViewClick(student)} className="view-button">
                  View
                </button>
                <button className="view-button notify" onClick={() => sendNotification(student)}>
                  📩 Notify
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* The Modal for viewing student details */}
      {modalOpen && selectedStudent && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="modal-close-button">&times;</button>
            <div className="modal-header">
              <h2 className="modal-title">{selectedStudent.full_name}</h2>
              <span className="modal-subtitle">{selectedStudent.student_id}</span>
            </div>
            <div className="modal-grid">
              <div className="modal-card risk-assessment-card">
                <h3>Dropout Risk Assessment</h3>
                <div className={`risk-value ${getRiskClassName(selectedStudent.predicted_risk)}`}>
                  {selectedStudent.predicted_risk}
                </div>
                <div className="risk-level-bar-light">
                  <div className={`risk-level-indicator-light ${getRiskClassName(selectedStudent.predicted_risk)}`} />
                </div>
                <div className="action-box">
                  <strong>Recommended Action:</strong>
                  <p>Schedule attendance counseling</p>
                </div>
              </div>
              <div className="modal-card performance-metrics-card">
                <h3>Academic Performance</h3>
                <div className="metric-item">
                  <span>Avg. Grade</span>
                  <strong>{selectedStudent.overall_grade_avg}%</strong>
                </div>
                <div className="metric-item">
                  <span>Attendance</span>
                  <strong>{selectedStudent.attendance_percentage}%</strong>
                </div>
                <div className="metric-item">
                  <span>Backlogs</span>
                  <strong>{selectedStudent.failed_subjects_count}</strong>
                </div>
                <div className="metric-item">
                  <span>Fee Status</span>
                  <strong>{selectedStudent.fee_status}</strong>
                </div>
              </div>
            </div>
            <div className="modal-card feature-impact-card">
              <h3>Feature Impact Analysis</h3>
              <div className="metric-bar-item">
                <div className="metric-label"><span>Avg. Grade</span><span>{selectedStudent.overall_grade_avg}%</span></div>
                <GradientBar value={selectedStudent.overall_grade_avg} max={100} />
              </div>
              <div className="metric-bar-item">
                <div className="metric-label"><span>Attendance</span><span>{selectedStudent.attendance_percentage}%</span></div>
                <GradientBar value={selectedStudent.attendance_percentage} max={100} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentTable;