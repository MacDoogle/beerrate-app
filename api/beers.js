// Vercel Serverless Function for Beer Data
// This replaces the complex GitHub integration with a simple API

let beersData = {
  beers: [],
  lastUpdated: new Date().toISOString(),
  version: "1.0"
};

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  switch (req.method) {
    case 'GET':
      // Get all beers
      return res.status(200).json(beersData);

    case 'POST':
      // Add a new beer
      const newBeer = req.body;
      newBeer.id = Date.now(); // Simple ID generation
      newBeer.dateAdded = new Date().toISOString();
      
      beersData.beers.push(newBeer);
      beersData.lastUpdated = new Date().toISOString();
      
      return res.status(201).json({ success: true, beer: newBeer });

    case 'PUT':
      // Update all beers (for import functionality)
      if (req.body.beers && Array.isArray(req.body.beers)) {
        beersData.beers = req.body.beers;
        beersData.lastUpdated = new Date().toISOString();
        return res.status(200).json({ success: true, message: 'Data updated successfully' });
      }
      return res.status(400).json({ error: 'Invalid data format' });

    case 'DELETE':
      // Delete a beer by ID
      const { id } = req.query;
      const initialLength = beersData.beers.length;
      beersData.beers = beersData.beers.filter(beer => beer.id !== parseInt(id));
      
      if (beersData.beers.length < initialLength) {
        beersData.lastUpdated = new Date().toISOString();
        return res.status(200).json({ success: true, message: 'Beer deleted' });
      }
      
      return res.status(404).json({ error: 'Beer not found' });

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}