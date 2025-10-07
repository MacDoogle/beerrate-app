namespace BeerRate_App.Models
{
    public class BeerRating
    {
        public int Id { get; set; }
        public required string BeerName { get; set; }
        public required string Brewery { get; set; }
        public required string Style { get; set; }
        public required int Rating { get; set; } // 1–4 scale
    }
}