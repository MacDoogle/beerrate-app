using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using BeerRate_App.Models;
using System.Text.Json;

namespace BeerRate_App.Pages;

[IgnoreAntiforgeryToken]
public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;
    private readonly AppDbContext _context;

    public IndexModel(ILogger<IndexModel> logger, AppDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public List<BeerRating> BeerRatings { get; set; } = new();

    public async Task OnGetAsync()
    {
        try
        {
            BeerRatings = await _context.BeerRatings
                .OrderByDescending(b => b.Id)
                .ToListAsync();
            _logger.LogInformation("Loaded {Count} beers from database", BeerRatings.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading beers on page load");
            BeerRatings = new List<BeerRating>();
        }
    }

    public async Task<IActionResult> OnPostSubmitAsync()
    {
        try
        {
            _logger.LogInformation("Received POST request to Submit handler");
            
            // Try to get data from form first, then JSON
            string? beerName = Request.Form["BeerName"];
            string? style = Request.Form["Style"];  
            string? notes = Request.Form["Notes"];
            string? ratingStr = Request.Form["Rating"];

            // If form data is empty, try JSON
            if (string.IsNullOrEmpty(beerName))
            {
                using var reader = new StreamReader(Request.Body);
                var json = await reader.ReadToEndAsync();
                _logger.LogInformation("Received JSON: {Json}", json);
                
                var data = JsonSerializer.Deserialize<BeerSubmissionData>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (data != null)
                {
                    beerName = data.BeerName;
                    style = data.Style;
                    notes = data.Notes;
                    ratingStr = data.Rating.ToString();
                }
            }

            if (string.IsNullOrEmpty(beerName) || string.IsNullOrEmpty(ratingStr) || !int.TryParse(ratingStr, out int rating))
            {
                _logger.LogWarning("Invalid data received: BeerName={BeerName}, Rating={Rating}", beerName, ratingStr);
                return BadRequest("Invalid data - missing required fields");
            }

            // Create new BeerRating entity
            var beerRating = new BeerRating
            {
                BeerName = beerName,
                Brewery = notes ?? "", // Using Notes field as Brewery
                Style = style ?? "",
                Rating = rating
            };

            // Add to database
            _context.BeerRatings.Add(beerRating);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully saved beer rating with ID: {Id}", beerRating.Id);
            return new JsonResult(new { success = true, id = beerRating.Id, beer = beerRating });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving beer rating");
            return BadRequest($"Error saving beer rating: {ex.Message}");
        }
    }

    public async Task<IActionResult> OnGetBeersAsync()
    {
        try
        {
            var beers = await _context.BeerRatings
                .OrderByDescending(b => b.Id)
                .ToListAsync();
            return new JsonResult(beers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading beers");
            return BadRequest($"Error loading beers: {ex.Message}");
        }
    }

    public async Task<IActionResult> OnGetStatsAsync()
    {
        try
        {
            var beers = await _context.BeerRatings.ToListAsync();
            
            var stats = new
            {
                TotalBeers = beers.Count,
                MostPopularStyle = beers.GroupBy(b => b.Style)
                    .OrderByDescending(g => g.Count())
                    .FirstOrDefault()?.Key ?? "No ratings yet",
                MostRatedBrewery = beers.GroupBy(b => b.Brewery)
                    .OrderByDescending(g => g.Count())
                    .FirstOrDefault()?.Key ?? "No ratings yet",
                RatingCounts = beers.GroupBy(b => b.Rating)
                    .OrderBy(g => g.Key)
                    .ToDictionary(g => g.Key, g => g.Count())
            };
            
            return new JsonResult(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading stats");
            return BadRequest($"Error loading stats: {ex.Message}");
        }
    }

    // Helper class for JSON deserialization
    public class BeerSubmissionData
    {
        public string? BeerName { get; set; }
        public string? Style { get; set; }
        public int Rating { get; set; }
        public string? Notes { get; set; }
    }
}
