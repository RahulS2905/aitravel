// client/src/App.jsx
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { generateTrip, saveTrip, getMyTrips } from './services/api';
import './App.css';

function App() {
  // --- State Variables ---
  const [form, setForm] = useState({ from: '', to: '', days: '' });
  const [tripData, setTripData] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  
  // Sidebar States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(350); // Default width
  const sidebarRef = useRef(null); // Ref for resizing

  const { user } = useUser();

  // --- Resizer Logic ---
  const startResizing = (mouseDownEvent) => {
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (mouseMoveEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth > 250 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
      document.body.style.cursor = "default";
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
    document.body.style.cursor = "col-resize";
  };

  // --- Handlers ---
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onGenerate = async () => {
    if (!form.from || !form.to || !form.days) return toast.error("Please fill all fields!");
    setLoading(true);
    const loadId = toast.loading("Analyzing costs & optimizing route...");
    
    try {
      const data = await generateTrip(form);
      setTripData(data);
      toast.success("Trip generated!", { id: loadId });
      // Auto-close sidebar on mobile if needed, or keep open
    } catch (err) {
      toast.error("Failed to plan trip.", { id: loadId });
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!tripData) return;
    const saveId = toast.loading("Saving entire plan...");
    try {
      // This sends EVERYTHING (Images, Budget, Plan, Rentals) to the database
      await saveTrip({ 
        ...form, 
        ...tripData, 
        userEmail: user?.primaryEmailAddress?.emailAddress 
      });
      toast.success("Trip Saved Successfully!", { id: saveId });
      loadHistory();
    } catch (err) {
      toast.error("Error saving trip.", { id: saveId });
    }
  };

  const onDelete = async (e, id) => {
    e.stopPropagation();
    if(!confirm("Are you sure you want to delete this trip?")) return;

    try {
        await axios.delete(`http://localhost:5000/api/trips/${id}`);
        toast.success("Trip deleted.");
        loadHistory();
        if (tripData && tripData._id === id) setTripData(null); 
    } catch(err) {
        toast.error("Could not delete.");
    }
  }

  const loadHistory = async () => {
    if (!user) return;
    try { 
        const data = await getMyTrips(); 
        setSavedTrips(data); 
    } catch (e) {}
  };

  useEffect(() => { if(user) loadHistory(); }, [user]);

  // --- RENDER ---
  return (
    <>
      <Toaster position="top-center" />
      
      {/* 1. LANDING PAGE (Logged Out) */}
      <SignedOut>
        <div className="landing-page">
          <div className="landing-content">
            <h1>TravelAI ✈️</h1>
            <h2>Your Budget-Smart Travel Planner</h2>
            <p>Get optimized routes, transport rentals, and middle-class budget breakdowns powered by AI.</p>
            <SignInButton mode="modal">
              <button className="big-btn">Start Planning</button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      {/* 2. DASHBOARD (Logged In) */}
      <SignedIn>
        <div className="app-layout" style={{ gridTemplateColumns: isSidebarOpen ? `${sidebarWidth}px 1fr` : '0px 1fr' }}>
          
          {/* LEFT SIDEBAR */}
          <div className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`} style={{ width: isSidebarOpen ? sidebarWidth : 0 }}>
            
            <div className="logo">
              <span>TravelAI ✈️</span>
              <UserButton afterSignOutUrl="/" />
            </div>
            
            <div className="greeting">
              <h3>{user?.firstName}'s Trips</h3>
            </div>

            <div className="input-group">
              <label>From</label>
              <input name="from" value={form.from} onChange={handleChange} placeholder="e.g. Bangalore" />
            </div>
            <div className="input-group">
              <label>To</label>
              <input name="to" value={form.to} onChange={handleChange} placeholder="e.g. Coorg" />
            </div>
            <div className="input-group">
              <label>Days</label>
              <input name="days" type="number" value={form.days} onChange={handleChange} placeholder="3" />
            </div>
            
            <button className="btn-primary" onClick={onGenerate} disabled={loading}>
              {loading ? "Calculating..." : "Plan My Trip ➜"}
            </button>

            <hr style={{width: '100%', borderColor: '#f1f5f9', margin: '20px 0'}}/>

            <h3>📂 Saved Routes</h3>
            <div className="history-list">
              {savedTrips.map(trip => (
                <div key={trip._id} className="history-item" onClick={() => { setTripData(trip); setForm({from: trip.from, to: trip.to, days: trip.days}); }}>
                  <div style={{flex:1}}>
                    <strong>{trip.to}</strong> <span style={{color:'#64748b', fontSize:'0.85rem'}}>({trip.days}d)</span>
                  </div>
                  <button onClick={(e) => onDelete(e, trip._id)} className="delete-btn">🗑️</button>
                </div>
              ))}
            </div>

            {/* DRAG HANDLE */}
            <div className="resizer" onMouseDown={startResizing}></div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="main-content">
            
            {/* SIDEBAR TOGGLE BUTTON */}
            <button 
              className="toggle-sidebar-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {isSidebarOpen ? "◀" : "▶"}
            </button>

            {!tripData ? (
              // EMPTY STATE
              <div className="empty-state-container">
                <div className="empty-state-content">
                  <h2>Where are we going next? 🌍</h2>
                  <p>Enter your destination to see optimized routes & budget costs.</p>
                </div>
              </div>
            ) : (
              // RESULTS DASHBOARD
              <div className="results-container">
                
                {/* A. IMAGE GALLERY */}
                {tripData.images && tripData.images.length > 0 ? (
                  <div className="image-gallery">
                    <img src={tripData.images[0]} className="gallery-main" alt="Main" />
                    <div className="gallery-side">
                      {tripData.images[1] && <img src={tripData.images[1]} alt="Side 1" />}
                      {tripData.images[2] && <img src={tripData.images[2]} alt="Side 2" />}
                    </div>
                  </div>
                ) : (
                  tripData.image && <img src={tripData.image} className="hero-image" alt="Dest" />
                )}

                {/* B. INFO CARDS */}
                {tripData.location_info && (
                   <div className="info-grid">
                      <div className="info-card clickable-card" onClick={() => setShowBudgetModal(true)}>
                        <h4>💰 Total Budget</h4>
                        <p>{tripData.location_info.total_budget || "View Cost"}</p>
                        <span style={{fontSize:'0.8rem', color:'#10b981', textDecoration:'underline'}}>See Breakdown ↘</span>
                      </div>

                      <div className="info-card">
                        <h4>🌤️ Weather</h4>
                        <p>{tripData.location_info.weather_note}</p>
                      </div>
                      <div className="info-card">
                        <h4>🗣️ Language</h4>
                        <p>{tripData.location_info.language}</p>
                      </div>
                   </div>
                )}

                {/* C. RENTALS SECTION */}
                {tripData.location_info?.rentals && (
                    <div className="rentals-section">
                        <h3>🛵 Rent a Ride (Top Picks)</h3>
                        <div className="rental-grid">
                            {tripData.location_info.rentals.map((rental, idx) => (
                                <a key={idx} href={`https://www.google.com/search?q=${rental.name}+rental+${tripData.to}`} target="_blank" rel="noreferrer" className="rental-card">
                                    <span className="rental-icon">{rental.type === 'Car' ? '🚘' : '🛵'}</span>
                                    <div>
                                        <strong>{rental.name}</strong>
                                        <p>Check Prices ↗</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* D. MAP */}
                <div className="map-container">
                   <iframe
                      width="100%" height="100%" frameBorder="0"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(tripData.to)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                   ></iframe>
                </div>

                {/* E. ITINERARY TEXT & SAVE BUTTON */}
                <div className="markdown-body">
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                      <h2 style={{margin:0}}>📍 Optimized Itinerary</h2>
                      
                      {/* --- HERE IS THE SAVE BUTTON --- */}
                      <button onClick={onSave} className="save-btn">
                        💾 Save Full Trip
                      </button>
                   </div>
                   <ReactMarkdown>{tripData.plan}</ReactMarkdown>
                </div>
                
                {/* Bottom Spacer */}
                <div style={{height: '100px'}}></div>

                {/* F. BUDGET MODAL */}
                {showBudgetModal && tripData.location_info?.budget_breakdown && (
                  <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <h3>💸 Estimated Costs ({form.days} Days)</h3>
                        <button onClick={() => setShowBudgetModal(false)} className="close-btn">×</button>
                      </div>
                      
                      <div className="budget-list">
                        <div className="budget-row">
                          <span>🏨 Accommodation</span>
                          <strong>{tripData.location_info.budget_breakdown.accommodation}</strong>
                        </div>
                        <div className="budget-row">
                          <span>🍔 Food & Dining</span>
                          <strong>{tripData.location_info.budget_breakdown.food}</strong>
                        </div>
                        <div className="budget-row">
                          <span>🚌 Local Transport</span>
                          <strong>{tripData.location_info.budget_breakdown.transport}</strong>
                        </div>
                        <div className="budget-row">
                          <span>🎟️ Activities</span>
                          <strong>{tripData.location_info.budget_breakdown.activities}</strong>
                        </div>
                      </div>

                      <div className="modal-footer">
                        <small>*Estimates based on middle-class spending habits.</small>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}

export default App;