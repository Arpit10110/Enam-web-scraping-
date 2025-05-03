# 🌾 ENAM Crop Price Scraper

This project uses **Puppeteer** to scrape real-time crop prices from the official [eNAM](https://enam.gov.in/web/dashboard/live_price) website and provides an **Express API** to trigger the scraper and fetch the data.

---

## 🚀 Features

- Scrapes real-time crop price data from eNAM dashboard.
- Stores the scraped data in a local JSON file (`enam_price_data.json`).
- Offers an Express API endpoint (`/getPrices`) that triggers the scraper and returns fresh data.
- Can also be run directly via `node index.js`.

---

## 📦 Installation

```bash
git clone https://github.com/yourusername/enam-crop-scraper.git
cd enam-crop-scraper
npm install
