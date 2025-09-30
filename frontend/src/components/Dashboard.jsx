// frontend/src/components/Dashboard.jsx
import React from 'react';
import { Pie, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// New Custom Legend Component
const CustomLegend = ({ data }) => (
  <div className="custom-legend">
    {data.labels.map((label, index) => (
      <div key={label} className="legend-item">
        <span className="legend-color-box" style={{ backgroundColor: data.datasets[0].backgroundColor[index] }} />
        <span className="legend-label">{label}</span>
        <span className="legend-value">{data.datasets[0].data[index]}</span>
      </div>
    ))}
  </div>
);


function Dashboard({ summaryData }) {
  if (!summaryData) return null;

  const { risk_distribution, scatter_data, total_students, average_attendance, average_grade } = summaryData;

  const pieData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [risk_distribution['High'] || 0, risk_distribution['Medium'] || 0, risk_distribution['Low'] || 0],
      backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],
      borderWidth: 6,
      borderColor: 'var(--color-surface)',
    }],
  };

  const pieOptions = { 
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', 
    plugins: { 
      // The default legend is now disabled
      legend: { display: false },
      tooltip: {
          callbacks: {
              label: function(context) {
                  return `${context.label}: ${context.raw}`;
              }
          }
      }
    },
  };

  const scatterData = {
    datasets: [{
      data: scatter_data.map(student => ({ x: student.attendance_percentage, y: student.overall_grade_avg })),
      backgroundColor: 'rgba(17, 24, 39, 0.7)',
      pointRadius: 6,
      pointHoverRadius: 8,
    }],
  };
  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
        x: { title: { display: true, text: 'Attendance (%)', font: {family: "'Inter', sans-serif"} } }, 
        y: { title: { display: true, text: 'Average Grade (%)', font: {family: "'Inter', sans-serif"} } } 
    },
    plugins: { legend: { display: false } }
  };

  return (
    <>
      <h2>Dashboard</h2>
      <div className="dashboard-grid">
        <div className="metrics-column">
          <div className="metric-card">
            <h3>Total Students</h3>
            <p>{total_students}</p>
          </div>
          <div className="metric-card">
            <h3>Avg. Attendance</h3>
            <p>{average_attendance.toFixed(1)}%</p>
          </div>
          <div className="metric-card">
            <h3>Avg. Grade</h3>
            <p>{average_grade.toFixed(1)}%</p>
          </div>
        </div>
        <div className="chart-container pie-chart-container">
          <h3>Risk Distribution</h3>
          <div className="pie-chart-wrapper">
            <div className="chart-itself">
              <Pie data={pieData} options={pieOptions} />
            </div>
            {/* We render our new custom legend here */}
            <CustomLegend data={pieData} />
          </div>
        </div>
        <div className="chart-container scatter-chart-container">
          <h3>Attendance vs. Grades</h3>
          <div className="chart-wrapper">
            <Scatter options={scatterOptions} data={scatterData} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;