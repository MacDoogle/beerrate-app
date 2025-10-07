// Handle rating button clicks
document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('rating').value = btn.dataset.rating;
        // Optional: visually highlight selected rating
        document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

// Handle form submission
document.getElementById('beerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const beerName = document.getElementById('beerName').value;
    const style = document.getElementById('beerStyle').value;
    const rating = parseInt(document.getElementById('rating').value);
    const notes = document.getElementById('brewery').value;

    // Validate required fields
    if (!beerName || !style || !rating) {
        alert("Please fill in all required fields and select a rating.");
        return;
    }

    try {
        // Use FormData for better Razor Pages compatibility
        const formData = new FormData();
        formData.append('BeerName', beerName);
        formData.append('Style', style);
        formData.append('Rating', rating.toString());
        formData.append('Notes', notes);

        const response = await fetch('/?handler=Submit', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            alert("Beer rating saved successfully! ID: " + result.id);
            
            // Add the new beer to the list dynamically
            addBeerToList(result.beer);
            
            // Reset the form
            e.target.reset();
            document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
            document.getElementById('rating').value = '';
        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            alert("Failed to save rating: " + errorText);
        }
    } catch (err) {
        console.error('Network error:', err);
        alert("Error submitting rating: " + err.message);
    }
});

// Function to add a beer to the list dynamically
function addBeerToList(beer) {
    const beerList = document.getElementById('beerList');
    
    // Remove "no beers" message if it exists
    const noBeersMsg = beerList.querySelector('.no-beers');
    if (noBeersMsg) {
        noBeersMsg.remove();
    }
    
    // Create beer card element
    const beerCard = document.createElement('div');
    beerCard.className = 'beer-card';
    beerCard.setAttribute('data-beer-id', beer.id);
    
    // Create star rating display
    let stars = '';
    for (let i = 1; i <= beer.rating; i++) {
        stars += '⭐';
    }
    
    beerCard.innerHTML = `
        <h3>${beer.beerName}</h3>
        <p><strong>Brewery:</strong> ${beer.brewery}</p>
        <p><strong>Style:</strong> ${beer.style}</p>
        <p><strong>Rating:</strong> ${stars}</p>
    `;
    
    // Add to the top of the list
    beerList.insertBefore(beerCard, beerList.firstChild);
}

// Export to CSV functionality
document.getElementById('exportBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetch('/?handler=Beers');
        if (response.ok) {
            const beers = await response.json();
            
            // Convert to CSV format
            const csvHeader = 'Beer Name,Brewery,Style,Rating\n';
            const csvRows = beers.map(beer => 
                `"${beer.beerName}","${beer.brewery}","${beer.style}",${beer.rating}`
            ).join('\n');
            
            const csvContent = csvHeader + csvRows;
            const dataBlob = new Blob([csvContent], { type: 'text/csv' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `beer-ratings-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            alert('Beer data exported to CSV successfully!');
        } else {
            alert('Failed to export data');
        }
    } catch (err) {
        alert('Error exporting data: ' + err.message);
    }
});

// Stats functionality
document.getElementById('statsBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetch('/?handler=Stats');
        if (response.ok) {
            const stats = await response.json();
            displayStats(stats);
        } else {
            alert('Failed to load stats');
        }
    } catch (err) {
        alert('Error loading stats: ' + err.message);
    }
});

// Display stats in modal
function displayStats(stats) {
    const statsData = document.getElementById('statsData');
    
    let ratingBreakdown = '';
    for (let rating = 1; rating <= 4; rating++) {
        const count = stats.ratingCounts[rating] || 0;
        const stars = '⭐'.repeat(rating);
        ratingBreakdown += `
            <div class="stat-item">
                <span>${stars}</span>
                <span>${count} beer(s)</span>
            </div>
        `;
    }
    
    statsData.innerHTML = `
        <div class="stat-item">
            <span><strong>Total Beers Rated:</strong></span>
            <span>${stats.totalBeers}</span>
        </div>
        <div class="stat-item">
            <span><strong>Most Popular Style:</strong></span>
            <span>${stats.mostPopularStyle}</span>
        </div>
        <div class="stat-item">
            <span><strong>Most Rated Brewery:</strong></span>
            <span>${stats.mostRatedBrewery}</span>
        </div>
        <hr style="margin: 15px 0;">
        <h4 style="margin-bottom: 10px;">Rating Breakdown:</h4>
        ${ratingBreakdown}
    `;
    
    document.getElementById('statsModal').style.display = 'flex';
}

// Close stats modal
document.getElementById('closeStats')?.addEventListener('click', () => {
    document.getElementById('statsModal').style.display = 'none';
});

// Close modal when clicking outside
document.getElementById('statsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'statsModal') {
        document.getElementById('statsModal').style.display = 'none';
    }
});

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const beerCards = document.querySelectorAll('.beer-card');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = e.target.value ? 'block' : 'none';
    }
    
    beerCards.forEach(card => {
        const beerName = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const brewery = card.querySelector('p')?.textContent.toLowerCase() || '';
        const style = card.querySelectorAll('p')[1]?.textContent.toLowerCase() || '';
        
        const matches = beerName.includes(searchTerm) || 
                       brewery.includes(searchTerm) || 
                       style.includes(searchTerm);
        
        card.style.display = matches ? 'block' : 'none';
    });
    
    // Show "no results" message if no beers match
    const visibleCards = document.querySelectorAll('.beer-card[style*="block"], .beer-card:not([style*="none"])');
    const beerList = document.getElementById('beerList');
    let noResultsMsg = document.querySelector('.no-results');
    
    if (visibleCards.length === 0 && searchTerm && beerCards.length > 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('p');
            noResultsMsg.className = 'no-results';
            noResultsMsg.style.textAlign = 'center';
            noResultsMsg.style.color = '#666';
            noResultsMsg.style.fontStyle = 'italic';
            noResultsMsg.style.padding = '20px';
            beerList.appendChild(noResultsMsg);
        }
        noResultsMsg.textContent = `No beers found matching "${e.target.value}"`;
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
});

// Clear search functionality
document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    searchInput.value = '';
    clearBtn.style.display = 'none';
    
    // Show all beer cards
    document.querySelectorAll('.beer-card').forEach(card => {
        card.style.display = 'block';
    });
    
    // Hide no results message
    const noResultsMsg = document.querySelector('.no-results');
    if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
});