// client/src/components/LoadingSkeleton.jsx
import React from 'react';
import './LoadingSkeleton.css'; // We will add simple animation later

const LoadingSkeleton = () => {
  return (
    <div className="skeleton-container">
      <div className="skeleton-img pulse"></div>
      <div className="skeleton-text pulse"></div>
      <div className="skeleton-text pulse"></div>
      <div className="skeleton-text short pulse"></div>
    </div>
  );
};

export default LoadingSkeleton;