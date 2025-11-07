using Microsoft.EntityFrameworkCore;
using BeerRate_App.Models;

namespace BeerRate_App
{
    public class AppDbContext : DbContext
    {
        public DbSet<BeerRating> BeerRatings { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
     
            // Configure entity for PostgreSQL
            modelBuilder.Entity<BeerRating>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).UseIdentityByDefaultColumn();
                entity.Property(e => e.BeerName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Brewery).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Style).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Rating).IsRequired();
            });
        }
    }
}