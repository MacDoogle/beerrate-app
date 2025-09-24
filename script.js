// BeerRate App with GitHub Integration

class BeerRateApp {
    constructor() {
        this.beers = [];
        this.selectedRating = null;
        this.githubConfig = this.loadGitHubConfig();
        this.init();
    }

    async init() {
        this.setupEventListeners();
        
        // Try to load data from GitHub first, then fallback to localStorage
        await this.loadData();
        this.displayBeers();
        this.updateConnectionStatus();
    }

    // GitHub Configuration
    loadGitHubConfig() {
        const config = localStorage.getItem('githubConfig');
        return config ? JSON.parse(config) : null;
    }

    saveGitHubConfig(token, repo) {
        const config = { token, repo };
        localStorage.setItem('githubConfig', JSON.stringify(config));
        this.githubConfig = config;
    }

    // Data Loading Priority: GitHub → localStorage → empty
    async loadData() {
        try {
            if (this.githubConfig) {
                console.log('Attempting to load from GitHub...');
                this.beers = await this.loadFromGitHub();
                this.showMessage('Data loaded from GitHub!', 'success');
                return;
            }
        } catch (error) {
            console.log('GitHub load failed, trying localStorage...', error.message);
        }

        // Fallback to localStorage
        const stored = localStorage.getItem('beerRatings');
        this.beers = stored ? JSON.parse(stored) : [];
        
        if (this.beers.length > 0) {
            this.showMessage('Data loaded from local storage', 'info');
        }
    }

    // GitHub API Functions
    async loadFromGitHub() {
        if (!this.githubConfig) throw new Error('GitHub not configured');

        const url = `https://api.github.com/repos/${this.githubConfig.repo}/contents/beer-data.json`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            // File doesn't exist yet, return empty array
            return [];
        }

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const fileData = await response.json();
        const content = atob(fileData.content.replace(/\s/g, ''));
        const data = JSON.parse(content);
        
        return data.beers || [];
    }

    async saveToGitHub() {
        if (!this.githubConfig) {
            this.showMessage('GitHub not configured. Use GitHub Setup first.', 'error');
            return false;
        }

        try {
            const exportData = {
                beers: this.beers,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };

            // Get current file SHA (required for updates)
            let sha = null;
            try {
                const getCurrentFile = await fetch(
                    `https://api.github.com/repos/${this.githubConfig.repo}/contents/beer-data.json`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.githubConfig.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (getCurrentFile.ok) {
                    const currentData = await getCurrentFile.json();
                    sha = currentData.sha;
                }
            } catch (e) {
                // File doesn't exist yet, that's fine
            }

            // Create or update file
            const content = btoa(JSON.stringify(exportData, null, 2));
            const updateData = {
                message: `Update beer ratings - ${new Date().toLocaleString()}`,
                content: content
            };

            if (sha) {
                updateData.sha = sha;
            }

            const response = await fetch(
                `https://api.github.com/repos/${this.githubConfig.repo}/contents/beer-data.json`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GitHub save failed: ${error.message}`);
            }

            this.showMessage('Data synced to GitHub successfully!', 'success');
            return true;

        } catch (error) {
            this.showMessage(`GitHub sync failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testGitHubConnection() {
        if (!this.githubConfig) {
            this.showMessage('Please configure GitHub settings first', 'error');
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.githubConfig.repo}`, {
                headers: {
                    'Authorization': `Bearer ${this.githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                this.showMessage('GitHub connection successful!', 'success');
                this.updateConnectionStatus();
            } else {
                throw new Error(`Connection failed: ${response.status}`);
            }
        } catch (error) {
            this.showMessage(`Connection test failed: ${error.message}`, 'error');
        }
    }

    updateConnectionStatus() {
        const status = document.getElementById('connectionStatus');
        if (this.githubConfig) {
            status.innerHTML = `
                <div class="status-connected">
                    ✅ Connected to GitHub: ${this.githubConfig.repo}
                </div>
            `;
        } else {
            status.innerHTML = `
                <div class="status-local">
                    💾 Using local storage only - Click "GitHub Setup" to sync across devices
                </div>
            `;
        }
    }

    // Local Storage Management (backup)
    saveBeersLocally() {
        localStorage.setItem('beerRatings', JSON.stringify(this.beers));
    }

    // Event Listeners
    setupEventListeners() {
        // Form submission
        document.getElementById('beerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBeer();
        });

        // Rating button clicks
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectRating(e.target);
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

        // GitHub functionality
        document.getElementById('githubSetupBtn').addEventListener('click', () => {
            this.toggleGitHubSetup();
        });

        document.getElementById('saveGithubConfig').addEventListener('click', () => {
            this.saveGitHubSettings();
        });

        document.getElementById('testGithubConnection').addEventListener('click', () => {
            this.testGitHubConnection();
        });

        document.getElementById('syncGithubBtn').addEventListener('click', () => {
            this.syncToGitHub();
        });
    }

    toggleGitHubSetup() {
        const setup = document.getElementById('githubSetup');
        setup.style.display = setup.style.display === 'none' ? 'block' : 'none';
        
        if (this.githubConfig) {
            document.getElementById('githubRepo').value = this.githubConfig.repo;
        }
    }

    saveGitHubSettings() {
        const token = document.getElementById('githubToken').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();

        if (!token || !repo) {
            this.showMessage('Please fill in both GitHub token and repository', 'error');
            return;
        }

        this.saveGitHubConfig(token, repo);
        this.showMessage('GitHub configuration saved!', 'success');
        this.updateConnectionStatus();
        
        // Hide setup section
        document.getElementById('githubSetup').style.display = 'none';
    }

    async syncToGitHub() {
        const success = await this.saveToGitHub();
        if (success) {
            // Also save locally as backup
            this.saveBeersLocally();
        }
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

    // Add New Beer
    async addBeer() {
        const name = document.getElementById('beerName').value.trim();
        const brewery = document.getElementById('brewery').value.trim();
        const style = document.getElementById('beerStyle').value;
        const rating = this.selectedRating;

        if (!name || !brewery || !style || !rating) {
            this.showMessage('Please fill in all fields and select a rating!', 'error');
            return;
        }

        // Check for duplicates
        const duplicate = this.beers.find(beer => 
            beer.name.toLowerCase() === name.toLowerCase() && 
            beer.brewery.toLowerCase() === brewery.toLowerCase()
        );

        if (duplicate) {
            if (confirm('This beer already exists. Do you want to update its rating?')) {
                duplicate.rating = parseInt(rating);
                duplicate.style = style;
                duplicate.dateAdded = new Date().toISOString();
            } else {
                return;
            }
        } else {
            const newBeer = {
                id: Date.now(),
                name: name,
                brewery: brewery,
                style: style,
                rating: parseInt(rating),
                dateAdded: new Date().toISOString()
            };

            this.beers.unshift(newBeer);
        }

        // Save locally first (immediate)
        this.saveBeersLocally();
        
        // Try to sync to GitHub (if configured)
        if (this.githubConfig) {
            await this.saveToGitHub();
        }

        this.displayBeers();
        this.resetForm();
        this.showMessage('Beer added successfully!', 'success');
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
                    <p>No beers found. Add your first beer rating above!</p>
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
            const term = searchTerm.toLowerCase();
            return beer.name.toLowerCase().includes(term) ||
                   beer.brewery.toLowerCase().includes(term) ||
                   beer.style.toLowerCase().includes(term);
        });

        this.displayBeers(filtered);
    }

    // Delete Beer
    async deleteBeer(id) {
        if (confirm('Are you sure you want to delete this beer rating?')) {
            this.beers = this.beers.filter(beer => beer.id !== id);
            
            // Save locally and to GitHub
            this.saveBeersLocally();
            if (this.githubConfig) {
                await this.saveToGitHub();
            }
            
            this.displayBeers();
            this.showMessage('Beer deleted successfully!', 'info');
        }
    }

    // Export/Import functionality
    exportData() {
        if (this.beers.length === 0) {
            this.showMessage('No beers to export!', 'info');
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

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                let beersToImport = [];
                if (importedData.beers && Array.isArray(importedData.beers)) {
                    beersToImport = importedData.beers;
                } else if (Array.isArray(importedData)) {
                    beersToImport = importedData;
                } else {
                    throw new Error('Invalid file format');
                }

                const isValidData = beersToImport.every(beer => 
                    beer.name && beer.brewery && beer.style && beer.rating
                );

                if (!isValidData) {
                    throw new Error('Invalid beer data format');
                }

                const merge = confirm(
                    `Import ${beersToImport.length} beers?\n\n` +
                    `Click OK to MERGE with existing data\n` +
                    `Click Cancel to REPLACE all existing data`
                );

                if (!merge) {
                    this.beers = [];
                }

                let importedCount = 0;
                let duplicateCount = 0;

                beersToImport.forEach(importedBeer => {
                    const existing = this.beers.find(beer => 
                        beer.name.toLowerCase() === importedBeer.name.toLowerCase() && 
                        beer.brewery.toLowerCase() === importedBeer.brewery.toLowerCase()
                    );

                    if (existing) {
                        existing.rating = importedBeer.rating;
                        existing.style = importedBeer.style;
                        existing.dateAdded = importedBeer.dateAdded || new Date().toISOString();
                        duplicateCount++;
                    } else {
                        this.beers.push({
                            ...importedBeer,
                            id: Date.now() + Math.random(),
                            dateAdded: importedBeer.dateAdded || new Date().toISOString()
                        });
                        importedCount++;
                    }
                });

                // Save locally and to GitHub
                this.saveBeersLocally();
                if (this.githubConfig) {
                    await this.saveToGitHub();
                }
                
                this.displayBeers();
                
                this.showMessage(
                    `Import complete! Added ${importedCount} new beers, updated ${duplicateCount} existing beers.`,
                    'success'
                );

            } catch (error) {
                this.showMessage('Error importing file: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
        document.getElementById('importFile').value = '';
    }

    showStats() {
        const stats = this.getStats();
        
        if (!stats) {
            this.showMessage('No beers to analyze!', 'info');
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
        
        let backgroundColor;
        switch(type) {
            case 'success': backgroundColor = '#28a745'; break;
            case 'error': backgroundColor = '#dc3545'; break;
            default: backgroundColor = '#17a2b8'; break;
        }
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${backgroundColor};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(messageDiv)) {
                    document.body.removeChild(messageDiv);
                }
            }, 300);
        }, 4000);
    }

    // Get statistics
    getStats() {
        if (this.beers.length === 0) return null;

        const totalBeers = this.beers.length;
        const avgRating = (this.beers.reduce((sum, beer) => sum + beer.rating, 0) / totalBeers).toFixed(1);
        const topStyle = this.getMostPopularStyle();
        const topBrewery = this.getMostPopularBrewery();
        
        const greatCount = this.beers.filter(beer => beer.rating === 4).length;
        const goodCount = this.beers.filter(beer => beer.rating === 3).length;
        const drinkableCount = this.beers.filter(beer => beer.rating === 2).length;
        const badCount = this.beers.filter(beer => beer.rating === 1).length;

        return {
            totalBeers,
            avgRating,
            topStyle,
            topBrewery,
            greatCount,
            goodCount,
            drinkableCount,
            badCount
        };
    }

    getMostPopularStyle() {
        const styleCounts = {};
        this.beers.forEach(beer => {
            styleCounts[beer.style] = (styleCounts[beer.style] || 0) + 1;
        });
        
        return Object.entries(styleCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
    }

    getMostPopularBrewery() {
        const breweryCounts = {};
        this.beers.forEach(beer => {
            breweryCounts[beer.brewery] = (breweryCounts[beer.brewery] || 0) + 1;
        });
        
        return Object.entries(breweryCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BeerRateApp();
});

// Add CSS for new elements
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
    
    .connection-status {
        margin: 20px 0;
        padding: 10px;
        border-radius: 5px;
        text-align: center;
    }
    
    .status-connected {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .status-local {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }
    
    .github-section {
        background: #f8f9fa;
        border: 2px dashed #6c757d;
    }
    
    .github-section small {
        display: block;
        color: #6c757d;
        margin-top: 5px;
    }
`;
document.head.appendChild(style);