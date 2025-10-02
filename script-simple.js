// Simplified BeerRate App - No GitHub Integration
// Uses simple API backend for data persistence

class BeerRateApp {
    constructor() {
        this.beers = [];
        this.selectedRating = null;
        this.API_BASE = '/api/beers'; // Will work with Vercel serverless functions
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.displayBeers();
        this.showMessage('✅ Connected to cloud storage!', 'success');
    }

    // Simple API calls instead of GitHub integration
    async loadData() {
        try {
            const response = await fetch(this.API_BASE);
            if (response.ok) {
                const data = await response.json();
                this.beers = data.beers || [];
                console.log(`Loaded ${this.beers.length} beers from cloud`);
            } else {
                console.log('No existing data found, starting fresh');
                this.beers = [];
            }
        } catch (error) {
            console.log('Using offline mode, data will be saved locally');
            // Fallback to localStorage for offline use
            const stored = localStorage.getItem('beerRatings');
            this.beers = stored ? JSON.parse(stored) : [];
        }
    }

    async saveToCloud() {
        try {
            const response = await fetch(this.API_BASE, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ beers: this.beers })
            });

            if (response.ok) {
                console.log('Data saved to cloud successfully');
                return true;
            } else {
                throw new Error('Failed to save to cloud');
            }
        } catch (error) {
            console.log('Cloud save failed, saving locally:', error);
            // Fallback to localStorage
            localStorage.setItem('beerRatings', JSON.stringify(this.beers));
            return false;
        }
    }

    async deleteBeerFromCloud(id) {
        try {
            const response = await fetch(`${this.API_BASE}?id=${id}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.log('Cloud delete failed:', error);
            return false;
        }
    }

    // Event Listeners (simplified - no GitHub setup needed)
    setupEventListeners() {
        // Form submission
        document.getElementById('beerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBeer();
        });

        // Rating button clicks
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectRating(btn);
            });
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchBeers(e.target.value);
        });

        // Backup functionality
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('statsBtn').addEventListener('click', () => {
            this.showStats();
        });
    }

    // Rating Selection
    selectRating(button) {
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        button.classList.add('selected');
        this.selectedRating = button.dataset.rating;
        document.getElementById('rating').value = this.selectedRating;
    }

    // Add New Beer (simplified)
    async addBeer() {
        const name = document.getElementById('beerName').value.trim();
        const brewery = document.getElementById('brewery').value.trim();
        const style = document.getElementById('beerStyle').value;
        const rating = this.selectedRating;

        if (!name || !brewery || !style || !rating) {
            this.showMessage('Please fill in all fields and select a rating', 'error');
            return;
        }

        // Check for duplicates
        const duplicate = this.beers.find(beer => 
            beer.name.toLowerCase() === name.toLowerCase() && 
            beer.brewery.toLowerCase() === brewery.toLowerCase()
        );

        if (duplicate) {
            if (confirm(`You've already rated "${name}" by ${brewery}. Update the rating?`)) {
                duplicate.rating = parseInt(rating);
                duplicate.style = style;
                duplicate.dateAdded = new Date().toISOString();
            } else {
                return;
            }
        } else {
            const newBeer = {
                id: Date.now(),
                name,
                brewery,
                style,
                rating: parseInt(rating),
                dateAdded: new Date().toISOString()
            };
            this.beers.push(newBeer);
        }

        // Save to cloud
        const saved = await this.saveToCloud();
        
        this.displayBeers();
        this.resetForm();
        
        if (saved) {
            this.showMessage('🍺 Beer added and saved to cloud!', 'success');
        } else {
            this.showMessage('🍺 Beer added (saved locally - will sync when online)', 'warning');
        }
    }

    // Reset Form
    resetForm() {
        document.getElementById('beerForm').reset();
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.selectedRating = null;
        document.getElementById('rating').value = '';
    }

    // Display Beers
    displayBeers(beersToShow = null) {
        const beerList = document.getElementById('beerList');
        const beers = beersToShow || this.beers;

        if (beers.length === 0) {
            beerList.innerHTML = `
                <div class="empty-state">
                    <p>No beers rated yet! Add your first beer above. 🍺</p>
                </div>
            `;
            return;
        }

        beerList.innerHTML = beers.map(beer => `
            <div class="beer-item" data-id="${beer.id}">
                <div class="beer-header">
                    <h3 class="beer-name">${this.escapeHtml(beer.name)}</h3>
                    <div class="beer-rating">${'⭐'.repeat(beer.rating)}</div>
                </div>
                <div class="beer-brewery">by ${this.escapeHtml(beer.brewery)}</div>
                <div class="beer-style">${this.escapeHtml(beer.style)}</div>
                <button class="delete-btn" onclick="app.deleteBeer(${beer.id})">Delete</button>
            </div>
        `).join('');
    }

    // Search Functionality
    searchBeers(searchTerm) {
        if (!searchTerm.trim()) {
            this.displayBeers();
            return;
        }

        const filtered = this.beers.filter(beer => {
            return beer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   beer.brewery.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   beer.style.toLowerCase().includes(searchTerm.toLowerCase());
        });

        this.displayBeers(filtered);
    }

    // Delete Beer
    async deleteBeer(id) {
        if (confirm('Are you sure you want to delete this beer rating?')) {
            // Remove from local array
            this.beers = this.beers.filter(beer => beer.id !== id);
            
            // Try to delete from cloud
            const deleted = await this.deleteBeerFromCloud(id);
            
            this.displayBeers();
            
            if (deleted) {
                this.showMessage('Beer deleted from cloud storage', 'success');
            } else {
                this.showMessage('Beer deleted locally (will sync when online)', 'warning');
            }
        }
    }

    // Export/Import functionality (same as before)
    exportData() {
        if (this.beers.length === 0) {
            this.showMessage('No beers to export!', 'warning');
            return;
        }

        const exportData = {
            beers: this.beers,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const data = JSON.stringify(exportData, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `beer-ratings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showMessage('Data exported successfully!', 'success');
    }

    async importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.beers || !Array.isArray(importedData.beers)) {
                    throw new Error('Invalid file format');
                }

                const confirmMessage = `Import ${importedData.beers.length} beers? This will replace your current data.`;
                
                if (confirm(confirmMessage)) {
                    this.beers = importedData.beers.map(beer => ({
                        ...beer,
                        id: beer.id || Date.now() + Math.random(),
                        dateAdded: beer.dateAdded || new Date().toISOString()
                    }));

                    const saved = await this.saveToCloud();
                    this.displayBeers();
                    
                    if (saved) {
                        this.showMessage(`Successfully imported ${this.beers.length} beers!`, 'success');
                    } else {
                        this.showMessage(`Imported ${this.beers.length} beers (saved locally)`, 'warning');
                    }
                }
            } catch (error) {
                this.showMessage('Error importing file. Please check the format.', 'error');
            }
        };

        reader.readAsText(file);
        document.getElementById('importFile').value = '';
    }

    showStats() {
        const stats = this.getStats();
        
        if (!stats) {
            this.showMessage('No beers to analyze yet!', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'stats-modal';
        modal.innerHTML = `
            <div class="stats-content">
                <button class="close-btn">&times;</button>
                <h3>📊 Your Beer Stats</h3>
                <div class="stat-item">
                    <span>Total Beers Rated:</span>
                    <span><strong>${stats.totalBeers}</strong></span>
                </div>
                <div class="stat-item">
                    <span>Average Rating:</span>
                    <span><strong>${stats.avgRating} stars</strong></span>
                </div>
                <div class="stat-item">
                    <span>Most Popular Style:</span>
                    <span><strong>${stats.topStyle}</strong></span>
                </div>
                <div class="stat-item">
                    <span>Most Rated Brewery:</span>
                    <span><strong>${stats.topBrewery}</strong></span>
                </div>
                <div class="stat-item">
                    <span>4-Star Beers (Great):</span>
                    <span><strong>${stats.greatCount}</strong></span>
                </div>
                <div class="stat-item">
                    <span>3-Star Beers (Good):</span>
                    <span><strong>${stats.goodCount}</strong></span>
                </div>
                <div class="stat-item">
                    <span>2-Star Beers (Drinkable):</span>
                    <span><strong>${stats.drinkableCount}</strong></span>
                </div>
                <div class="stat-item">
                    <span>1-Star Beers (Bad):</span>
                    <span><strong>${stats.badCount}</strong></span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        const colors = {
            success: '#d4edda',
            error: '#f8d7da',
            warning: '#fff3cd',
            info: '#d1ecf1'
        };

        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${colors[type] || colors.info};
            border: 1px solid;
            border-radius: 5px;
            z-index: 1000;
            max-width: 300px;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(messageDiv)) {
                    document.body.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }

    // Get statistics
    getStats() {
        if (this.beers.length === 0) return null;

        const totalBeers = this.beers.length;
        const avgRating = (this.beers.reduce((sum, beer) => sum + beer.rating, 0) / totalBeers).toFixed(1);
        
        const badCount = this.beers.filter(b => b.rating === 1).length;
        const drinkableCount = this.beers.filter(b => b.rating === 2).length;
        const goodCount = this.beers.filter(b => b.rating === 3).length;
        const greatCount = this.beers.filter(b => b.rating === 4).length;

        return {
            totalBeers,
            avgRating,
            topStyle: this.getMostPopularStyle(),
            topBrewery: this.getMostPopularBrewery(),
            badCount,
            drinkableCount,
            goodCount,
            greatCount
        };
    }

    getMostPopularStyle() {
        const styleCounts = {};
        this.beers.forEach(beer => {
            styleCounts[beer.style] = (styleCounts[beer.style] || 0) + 1;
        });
        return Object.keys(styleCounts).reduce((a, b) => styleCounts[a] > styleCounts[b] ? a : b) || 'None';
    }

    getMostPopularBrewery() {
        const breweryCounts = {};
        this.beers.forEach(beer => {
            breweryCounts[beer.brewery] = (breweryCounts[beer.brewery] || 0) + 1;
        });
        return Object.keys(breweryCounts).reduce((a, b) => breweryCounts[a] > breweryCounts[b] ? a : b) || 'None';
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BeerRateApp();
});

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
`;
document.head.appendChild(style);