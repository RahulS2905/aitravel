// client/src/components/TripCard.jsx
import React from 'react';

const TripCard = ({ trip, onView }) => {
  return (
    <div className="trip-card">
      <div className="card-image">
        {trip.image ? (
          <img src={trip.image} alt={trip.to} />
        ) : (
          <div className="placeholder-image">✈️</div>
        )}
      </div>
      <div className="card-content">
        <h3>{trip.from} ➝ {trip.to}</h3>
        <span className="badge">{trip.days} Days</span>
        <button onClick={() => onView(trip)} className="view-btn">
          View Plan
        </button>
      </div>
    </div>
  );
};

export default TripCard;