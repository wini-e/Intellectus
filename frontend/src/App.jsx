// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SpreadsheetUploader from './components/SpreadsheetUploader';
import StudentTable from './components/StudentTable';
import Dashboard from './components/Dashboard';
import Hero from './components/Hero';
import logo from './assets/Intellectus.png';
import './App.css';

function App() {
  const [analyzedData, setAnalyzedData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mainContentRef = useRef(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnalysis = async (formData) => {
    setIsLoading(true);
    setAnalyzedData(null);
    setSummaryData(null);
    try {
      const analysisResponse = await axios.post('http://127.0.0.1:8000/analyze-spreadsheets/', formData);
      setAnalyzedData(analysisResponse.data);
      if (analysisResponse.data && analysisResponse.data.length > 0) {
        const summaryResponse = await axios.post('http://127.0.0.1:8000/generate-summary/', analysisResponse.data);
        setSummaryData(summaryResponse.data);
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Analysis failed. Check server logs.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMouseMove = (e) => {
    const mainEl = mainContentRef.current;
    if (mainEl) {
      const rect = mainEl.getBoundingClientRect();
      mainEl.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      mainEl.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    }
  };

  return (
    <>
      <div className={`splash-screen ${!showSplash ? 'hidden' : ''}`}>
        <img src={logo} alt="Intellectus Logo" className="splash-logo" />
      </div>

      <div className="app-container" style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
        <aside className="sidebar">
          <div className="sidebar-content">
            <img src={logo} alt="Intellectus Logo" className="sidebar-logo" />
            <SpreadsheetUploader
              onAnalyze={handleAnalysis}
              isLoading={isLoading}
              summaryData={summaryData}
              analyzedData={analyzedData}
            />
          </div>
          <footer className="sidebar-footer">
            <p>&copy; 2025 Intellectus. <br /> Securing Student Potential.</p>
          </footer>
        </aside>

        <main className="main-content" ref={mainContentRef} onMouseMove={handleMouseMove}>
          {isLoading && (
            <div className="card"><p>Analyzing data, please wait...</p></div>
          )}
          {!isLoading && !analyzedData && <Hero />}
          {summaryData && (
            <div className="card" style={{ animationDelay: '0.2s' }}>
              <Dashboard summaryData={summaryData} />
            </div>
          )}
          {analyzedData && (
            <div className="card" style={{ animationDelay: '0.3s' }}>
              <StudentTable students={analyzedData} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;