using Microsoft.EntityFrameworkCore;
using BeerRate_App.Models;

namespace BeerRate_App
{
    public class AppDbContext : DbContext
    {
        public DbSet<BeerRating> BeerRatings { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    }
}