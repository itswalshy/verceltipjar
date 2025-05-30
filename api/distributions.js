// Self-contained memory storage for distributions
// Note: In production, replace with a real database
let distributions = [];
let distributionId = 1;

// Utility functions
function calculatePayout(hours, hourlyRate) {
  return hours * hourlyRate;
}

function roundAndCalculateBills(amount) {
  const rounded = Math.round(amount);
  const billBreakdown = {
    twenties: Math.floor(rounded / 20),
    tens: Math.floor((rounded % 20) / 10),
    fives: Math.floor((rounded % 10) / 5),
    ones: rounded % 5
  };
  return { rounded, billBreakdown };
}

// Schema validation
const partnerHoursSchema = {
  parse: (data) => {
    if (!Array.isArray(data)) {
      throw new Error('Partner hours must be an array');
    }
    for (const item of data) {
      if (!item.name || typeof item.name !== 'string') {
        throw new Error('Each partner must have a name');
      }
      if (typeof item.hours !== 'number' || item.hours < 0) {
        throw new Error('Each partner must have valid hours');
      }
    }
    return data;
  }
};

// Storage functions
function getDistributions() {
  return distributions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function createDistribution(insertDistribution) {
  const id = distributionId++;
  const distribution = {
    ...insertDistribution,
    id,
    date: new Date().toISOString()
  };
  distributions.push(distribution);
  return distribution;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get distribution history
      const distributionsList = getDistributions();
      return res.json(distributionsList);
    }
    
    if (req.method === 'POST') {
      // Save distribution to history
      const { totalAmount, totalHours, hourlyRate, partnerData } = req.body;
      
      const distribution = createDistribution({
        totalAmount,
        totalHours,
        hourlyRate,
        partnerData
      });
      
      return res.status(201).json(distribution);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Distributions API error:", error);
    return res.status(500).json({
      error: req.method === 'GET' ? "Failed to retrieve distributions" : "Failed to save distribution"
    });
  }
}