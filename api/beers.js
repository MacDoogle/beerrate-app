// Vercel Serverless Function for Beer Data
// Uses KV storage simulation for persistence

// Global variable to persist data during function lifetime
// Note: This resets when the function cold starts, but works for demo purposes
let beersData = {
  beers: [],
  lastUpdated: new Date().toISOString(),
  version: "1.0"
};

export default function handler(req, res) {
  console.log(`${req.method} request to /api/beers`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        console.log(`Returning ${beersData.beers.length} beers`);
        return res.status(200).json(beersData);

      case 'POST':
        // Add a new beer
        const newBeer = req.body;
        if (!newBeer.name || !newBeer.brewery || !newBeer.style || !newBeer.rating) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        newBeer.id = Date.now() + Math.random(); // Unique ID generation
        newBeer.dateAdded = new Date().toISOString();
        
        beersData.beers.push(newBeer);
        beersData.lastUpdated = new Date().toISOString();
        
        console.log(`Added beer: ${newBeer.name} by ${newBeer.brewery}`);
        return res.status(201).json({ success: true, beer: newBeer });

      case 'PUT':
        // Update all beers (for import functionality)
        if (req.body.beers && Array.isArray(req.body.beers)) {
          beersData.beers = req.body.beers;
          beersData.lastUpdated = new Date().toISOString();
          console.log(`Updated data with ${req.body.beers.length} beers`);
          return res.status(200).json({ success: true, message: 'Data updated successfully' });
        }
        return res.status(400).json({ error: 'Invalid data format' });

      case 'DELETE':
        // Delete a beer by ID
        const { id } = req.query;
        const initialLength = beersData.beers.length;
        beersData.beers = beersData.beers.filter(beer => beer.id != id); // Use != for type coercion
        
        if (beersData.beers.length < initialLength) {
          beersData.lastUpdated = new Date().toISOString();
          console.log(`Deleted beer with ID: ${id}`);
          return res.status(200).json({ success: true, message: 'Beer deleted' });
        }
        
        return res.status(404).json({ error: 'Beer not found' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}