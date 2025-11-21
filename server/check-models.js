// server/check-models.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
  try {
    // We will try to access the model list directly to see what works
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const data = await response.json();
    
    console.log("=== AVAILABLE MODELS ===");
    if (data.models) {
      data.models.forEach(model => {
        // Only show models that support generating content
        if (model.supportedGenerationMethods.includes("generateContent")) {
          console.log(`Name: ${model.name}`);
        }
      });
    } else {
      console.log("No models found. Check your API Key.");
      console.log(data);
    }
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

checkModels();