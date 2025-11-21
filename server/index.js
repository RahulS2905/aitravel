// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Error:", err));

// 1. UPDATE SCHEMA: Store an Array of strings for images
const TripSchema = new mongoose.Schema({
    from: String,
    to: String,
    days: Number,
    plan: String,
    images: [String], // <--- CHANGED: Now stores multiple images
    location_info: Object,
    createdAt: { type: Date, default: Date.now }
});

const Trip = mongoose.model('Trip', TripSchema);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Inside server/index.js

app.post('/api/generate-plan', async (req, res) => {
    const { from, to, days } = req.body;
    let images = [];

    try {
        // 1. Fetch Images (Keep existing logic)
        try {
            if (process.env.UNSPLASH_ACCESS_KEY) {
                const imgRes = await axios.get(`https://api.unsplash.com/search/photos`, {
                    params: { query: to, per_page: 3, orientation: 'landscape' },
                    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
                });
                if (imgRes.data.results.length > 0) images = imgRes.data.results.map(img => img.urls.regular);
            }
        } catch (e) { console.log("Image fetch failed"); }

        // 2. THE NEW "MIDDLE CLASS" PROMPT
        // --- UPDATED PROMPT WITH REAL RENTAL COMPANIES ---
        const prompt = `
            Act as a budget-savvy travel agent. 
            Trip: ${from} to ${to} for ${days} days.
            
            Requirements:
            1. BUDGET: STRICTLY Middle-Class. Calculate TOTAL cost for ${days} days.
            2. OPTIMIZED ROUTE: Order visits logically.
            3. RENTALS: Suggest 3 top bike/car rental companies operating in ${to}.
               - PRIORITY LIST (If in India, pick from these): Royal Brothers, ONN Bikes, Rentrip, WheelOnRent, TransRentals, Thrillophilia, Ontrack, Zypp, Vogo, Bounce, Stonehead Bikes, Wheelstreet.
               - If these aren't available in the specific city, suggest local highly-rated alternatives.
            
            Output strictly valid JSON:
            {
              "location_info": {
                "currency": "e.g. ₹ (INR)",
                "total_budget": "e.g. ₹12,000 (Total for 3 days)",
                "budget_breakdown": {
                    "accommodation": "e.g. ₹6,000",
                    "food": "e.g. ₹3,000",
                    "transport": "e.g. ₹1,500",
                    "activities": "e.g. ₹1,500"
                },
                "weather_note": "e.g. Sunny, 28°C",
                "language": "e.g. Hindi/English",
                "rentals": [
                    {"type": "Bike", "name": "Royal Brothers"}, 
                    {"type": "Scooter", "name": "Vogo"},
                    {"type": "Car", "name": "ZoomCar"}
                ]
              },
              "itinerary_text": "## Day 1..."
            }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedData = JSON.parse(text);

        res.json({ 
            plan: parsedData.itinerary_text, 
            location_info: parsedData.location_info, 
            images: images 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate plan" });
    }
});

app.post('/api/save-trip', async (req, res) => {
    try {
        const newTrip = new Trip(req.body);
        await newTrip.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: "Save failed" }); }
});

app.get('/api/my-trips', async (req, res) => {
    try {
        const trips = await Trip.find().sort({ createdAt: -1 });
        res.json(trips);
    } catch (error) { res.status(500).json({ error: "Fetch failed" }); }
});

app.delete('/api/trips/:id', async (req, res) => {
    try {
        await Trip.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: "Delete failed" }); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));