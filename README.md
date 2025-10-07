# 🍺 BeerRate App

A simple and intuitive web application for rating and tracking your favorite beers, built with ASP.NET Core and Entity Framework.

## Features

- **📝 Rate Beers**: Add beers with name, brewery, style, and 1-4 star ratings
- **🔍 Search & Filter**: Find specific beers by name, brewery, or style
- **📊 Statistics**: View detailed stats including:
  - Total beers rated
  - Most popular beer style
  - Most rated brewery
  - Rating breakdown by stars
- **📥 Export Data**: Export your beer ratings to CSV format
- **💾 Persistent Storage**: All data stored in SQL Server database

## Screenshots

### Main Interface
- Clean, modern design with beer-themed styling
- Easy-to-use rating system with star buttons
- Real-time search functionality

### Statistics Dashboard
- Comprehensive overview of your beer rating habits
- Visual breakdown of ratings by stars
- Identify your preferences and trends

## Technology Stack

- **Backend**: ASP.NET Core 8.0 with Razor Pages
- **Database**: SQL Server Express with Entity Framework Core
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS with beer-themed color palette

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- SQL Server Express (or SQL Server)
- Visual Studio Code or Visual Studio

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/BeerRate-App.git
   cd BeerRate-App
   ```

2. Update the connection string in `appsettings.json` if needed:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost\\SQLEXPRESS22;Database=BeerRate;Trusted_Connection=true;TrustServerCertificate=True;"
     }
   }
   ```

3. Apply database migrations:
   ```bash
   dotnet ef database update
   ```

4. Run the application:
   ```bash
   dotnet run --launch-profile http
   ```

5. Open your browser to `http://localhost:5163`

## Usage

### Adding a Beer Rating

1. Fill out the beer details:
   - **Beer Name**: The name of the beer
   - **Brewery**: The brewery that makes it
   - **Style**: Select from common beer styles (IPA, Lager, Stout, etc.)
   - **Rating**: Click on 1-4 stars to rate the beer

2. Click "Add Beer" to save your rating

### Searching Your Beers

- Use the search box to filter by beer name, brewery, or style
- Search works in real-time as you type
- Click the "✕ Clear" button to reset the search

### Viewing Statistics

- Click "📊 View Stats" to see your beer rating statistics
- View your most popular styles, breweries, and rating distribution
- Close the modal by clicking the X or clicking outside

### Exporting Data

- Click "📥 Export to CSV" to download your beer ratings
- File includes all beer details in a spreadsheet-friendly format
- Filename includes the current date for easy organization

## Project Structure

```
BeerRate-App/
├── Models/
│   └── BeerRating.cs          # Data model for beer ratings
├── Pages/
│   ├── Index.cshtml           # Main page template
│   └── Index.cshtml.cs        # Page logic and API handlers
├── Migrations/                # Entity Framework migrations
├── wwwroot/
│   ├── styles.css            # Custom CSS styling
│   └── script.js             # Client-side JavaScript
├── AppDbContext.cs           # Database context
└── Program.cs                # Application configuration
```

## Database Schema

### BeerRatings Table

| Column    | Type         | Description                    |
|-----------|--------------|--------------------------------|
| Id        | int (PK)     | Auto-incrementing primary key  |
| BeerName  | nvarchar     | Name of the beer              |
| Brewery   | nvarchar     | Brewery name                  |
| Style     | nvarchar     | Beer style (IPA, Lager, etc.) |
| Rating    | int          | Rating from 1-4 stars         |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with ASP.NET Core and Entity Framework
- Icons and emojis for enhanced user experience
- Responsive design for mobile and desktop use