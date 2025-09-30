// frontend/src/components/Hero.jsx
import React from 'react';

function Hero() {
  return (
    <div className="hero-container">
      <h1 className="hero-title">
        Unlock Student <br />
        Potential with <br />
        <span className="hero-highlight">Data-Driven Insights</span>
      </h1>
      <p className="hero-subtitle">
        Intellectus analyzes academic and activity records to proactively identify at-risk students, enabling timely interventions.
      </p>
    </div>
  );
}

export default Hero;