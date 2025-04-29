import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
// Environment variables should be properly set in .env.local
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
const CRAWLBASE_API_KEY = process.env.CRAWLBASE_API_KEY;
// const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

const CACHE_DIR = path.join(process.cwd(), 'cache');
const CACHE_DURATION = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

interface RequestItem {
  name: string;
  quantity: number;
  unit: string;
  sku?: string;
}

interface ScrapedProduct {
  name: string;
  price: number;
  link: string;
}

interface CacheItem {
  price: number;
  timestamp: number;
}

interface CacheData {
  walmart: CacheItem;
  target: CacheItem;
}

const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cache management functions
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

async function getCachedPrice(itemKey: string): Promise<CacheData | null> {
  try {
    const cacheFile = path.join(CACHE_DIR, `${itemKey}.json`);
    const data = await fs.readFile(cacheFile, 'utf-8');
    const cached = JSON.parse(data) as CacheData;
    
    // Check if cache is still valid (within 2 days)
    const now = Date.now();
    if (now - cached.walmart.timestamp > CACHE_DURATION || 
        now - cached.target.timestamp > CACHE_DURATION) {
      return null;
    }
    
    return cached;
  } catch {
    return null;
  }
}

async function setCachedPrice(itemKey: string, prices: { walmart: number; target: number }) {
  try {
    await ensureCacheDir();
    const cacheFile = path.join(CACHE_DIR, `${itemKey}.json`);
    const timestamp = Date.now();
    const cacheData: CacheData = {
      walmart: { price: prices.walmart, timestamp },
      target: { price: prices.target, timestamp }
    };
    await fs.writeFile(cacheFile, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

function generateCacheKey(query: string): string {
  // Create a cache key from the query, removing special characters and spaces
  return query.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function scrapeTarget1(query: string) {
  const targetUrl = `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`;
  const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${targetUrl}`;
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
         `--proxy-server=${proxyUrl}`
      ]
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      // Navigate to the target page with increased timeout
      await page.goto(targetUrl, { 
        timeout: 60000,
        waitUntil: ['networkidle0', 'domcontentloaded']
      });
      
      // Wait for product elements to be visible
      await page.waitForSelector('[data-test="@web/site-top-of-funnel/ProductCardWrapper"]', { timeout: 10000 });
      
      // Add a small delay to ensure dynamic content is loaded
      await waitFor(2000);

      const products = await page.evaluate(() => {
        const results: ScrapedProduct[] = [];
        const productElements = document.querySelectorAll('[data-test="@web/site-top-of-funnel/ProductCardWrapper"]');

        productElements.forEach((el: Element) => {
          const titleEl = el.querySelector('[data-test="product-title"]');
          const priceEl = el.querySelector('[data-test="current-price"]');
          const linkEl = el.querySelector('a');

          const name = titleEl?.textContent || '';
          const priceText = priceEl?.textContent || '';
          const link = linkEl?.getAttribute('href') || '';

          if (name && priceText && link) {
            // Extract numeric price from string (e.g., "$19.99" -> 19.99)
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            if (!isNaN(price)) {
              results.push({ name, price, link });
            }
          }
        });
      
        return results;
      });

      const firstProduct = products[0];
      console.log('Target scraper results:', firstProduct);
      
      await browser.close();
      return firstProduct?.price || null;
    } catch (innerError) {
      console.error('Target page navigation/scraping error:', innerError);
      await browser.close();
      return null;
    }
  } catch (err) {
    console.error('Target scraper error:', err);
    return null;
  }
}
async function scrapeTarget(query: string){
  try{
    const targetUrl = `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`;
    const url = `https://api.crawlbase.com/?token=${CRAWLBASE_API_KEY}&url=${targetUrl}`
    console.log(url)
    const {data: html} = await axios.get(url)
    console.log("Crawlbase response received");
    const $ = cheerio.load(html);
    let results: ScrapedProduct[] = [];
    $('[data-test="@web/site-top-of-funnel/ProductCardWrapper"]').each((i, el) => {
      const name = $(el).find('[data-test="product-title"]').text().trim();
      const price = $(el).find('[data-test="current-price"]').text().trim().replace('$', '');
      const link = $(el).find('a').attr('href');
      if (name && price && link) {
        results.push({
          name,
          price:parseFloat(price),
          link: link.startsWith('http') ? link : `https://www.target.com${link}`
        });
      }
    });
   
    // Filter out results with price 0, null, or undefined
    results = results.filter(r => r.price && r.price > 0);
    // Sort results by price ascending
    // results.sort((a, b) => a.price - b.price);

    if(results.length > 0){
      console.log("Target price:", results[0]);
      return results[0]?.price;
    }else{
      return null;
    }
  }catch(err: any){
    console.error('Price scraper error:', err.message);
    return null;
  }
}
async function scrapeWalmart(query: string) {
  const walmartUrl = `https://api.scraperapi.com/structured/walmart/search?api_key=${SCRAPER_API_KEY}&query=${encodeURIComponent(query)}&limit=5`;
  
  try {
    const { data } = await axios.get(walmartUrl);
    const { items } = data;
    let results: { name: string; price: number; link: string }[] = (items || []).map((item: any) => ({
      name: item.name,
      price: item.price,
      link: item.url,
    }));
    // Filter out results with price 0, null, or undefined
    results = results.filter(r => r.price && r.price > 0);
    // Sort results by price ascending
    // results.sort((a, b) => a.price - b.price);
    console.log('Walmart scraper results:', results[0]);
    return results[0]?.price || null; // Return the lowest price
  } catch (err) {
    console.error('Walmart scraper error:', err);
    return null;
  }
}

async function getPrices(item: RequestItem) {
  const searchQuery = `${item.quantity} ${item.unit} ${item.name}`;
  console.log('Searching for:', searchQuery);

  const cacheKey = generateCacheKey(searchQuery);
  const cachedData = await getCachedPrice(cacheKey);

  if (cachedData) {
    console.log('Using cached prices for:', searchQuery);
    return {
      walmart: cachedData.walmart.price,
      target: cachedData.target.price
    };
  }

  // Add retry logic for failed scraping attempts
  let retryCount = 0;
  const maxRetries = 1;
  let walmartPrice: number | null = null;
  let targetPrice: number | null = null;

  while (retryCount <= maxRetries && (walmartPrice === null || targetPrice === null)) {
    if (retryCount > 0) {
      console.log(`Retry attempt ${retryCount} for ${searchQuery}`);
      await waitFor(2000 * retryCount); // Exponential backoff
    }

    const [walmartResult, targetResult]: [number | null, number | null] = await Promise.all([
      walmartPrice === null ? scrapeWalmart(searchQuery) : Promise.resolve(walmartPrice),
      targetPrice === null ? scrapeTarget(searchQuery) : Promise.resolve(targetPrice)
    ]);

    if (walmartPrice === null) walmartPrice = walmartResult;
    if (targetPrice === null) targetPrice = targetResult;

    retryCount++;
  }

  const prices = {
    walmart: walmartPrice !== null ? walmartPrice : 0,
    target: targetPrice !== null ? targetPrice : 0
  };

  // Only cache if at least one real price was found
  if (walmartPrice !== null || targetPrice !== null) {
    await setCachedPrice(cacheKey, prices);
  }

  return prices;
}

export async function POST(request: Request) {
  try {
    if (!SCRAPER_API_KEY) {
      throw new Error('SCRAPER_API_KEY is not configured');
    }

    const items: RequestItem[] = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected an array of items.' },
        { status: 400 }
      );
    }

    let walmartTotal = 0;
    let targetTotal = 0;
    const comparisonItems = [];

    // Calculate prices for each item
    for (const item of items) {
      const prices = await getPrices(item);
      const walmartPrice = prices.walmart;
      const targetPrice = prices.target;
      
      // Calculate total based on quantity
      const walmartItemTotal = walmartPrice;
      const targetItemTotal = targetPrice;
      
      walmartTotal += walmartItemTotal;
      targetTotal += targetItemTotal;

      comparisonItems.push({
        item: item.name,
        quantity: `${item.quantity} ${item.unit}`,
        walmartPrice: walmartPrice/item.quantity,
        targetPrice: targetPrice/item.quantity,
        walmartTotal: walmartItemTotal,
        targetTotal: targetItemTotal,
        priceDifference: targetItemTotal - walmartItemTotal,
        walmartIsCheaper: walmartItemTotal < targetItemTotal,
      });
    }

    // Calculate the overall difference
    const totalDifference = targetTotal - walmartTotal;

    const response = {
      walmart: {
        totalCost: Number(walmartTotal.toFixed(2)),
        unavailableItems: 0,
      },
      target: {
        totalCost: Number(targetTotal.toFixed(2)),
        difference: Number(totalDifference.toFixed(2)),
        unavailableItems: 0,
      },
      items: comparisonItems.map(item => ({
        ...item,
        walmartPrice: Number(item.walmartPrice.toFixed(2)),
        targetPrice: Number(item.targetPrice.toFixed(2)),
        walmartTotal: Number(item.walmartTotal.toFixed(2)),
        targetTotal: Number(item.targetTotal.toFixed(2)),
        priceDifference: Number(item.priceDifference.toFixed(2)),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing comparison:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 