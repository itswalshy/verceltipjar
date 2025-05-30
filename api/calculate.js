// Self-contained utility functions for Vercel
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { partnerHours, totalAmount, totalHours, hourlyRate } = req.body;
    
    // Validate partner hours
    try {
      partnerHoursSchema.parse(partnerHours);
    } catch (error) {
      return res.status(400).json({ error: "Invalid partner hours data" });
    }
    
    // Calculate payout for each partner
    const partnerPayouts = partnerHours.map(partner => {
      const payout = calculatePayout(partner.hours, hourlyRate);
      const { rounded, billBreakdown } = roundAndCalculateBills(payout);
      
      return {
        name: partner.name,
        hours: partner.hours,
        payout,
        rounded,
        billBreakdown
      };
    });
    
    const distributionData = {
      totalAmount,
      totalHours,
      hourlyRate,
      partnerPayouts
    };
    
    return res.json(distributionData);
  } catch (error) {
    console.error("Distribution calculation error:", error);
    return res.status(500).json({ error: "Failed to calculate distribution" });
  }
}