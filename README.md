# Car Complaints Scraper

This is a web scraper built using Node.js and Cheerio to extract data from the Car Complaints website (https://www.carcomplaints.com) and generate a JSON file containing information about car models, their specific problems, and other details.

## Installation

1. Clone the repository: git clone https://github.com/your-username/car-complaints-scraper.git


2. Navigate to the project directory: cd car-complaints-scraper


3. Install dependencies: npm install


## Usage

To run the scraper, execute the following command: node main.js


This will start the scraping process and generate a `models.json` file containing the extracted data in the project directory.

## Project Structure

- `main.js`: Main script file that performs web scraping and generates the JSON file.
- `models.json`: Output file containing the scraped data in JSON format.
- `package.json`: Contains project metadata and dependencies.
- `README.md`: Documentation file providing information about the project.

## Dependencies

- axios: For making HTTP requests.
- cheerio: For parsing HTML content.
- fs: For file system operations.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


