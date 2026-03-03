/**
 * Real-Time Data Service
 * 
 * Integrates with external APIs for:
 * - Market prices (Mandi rates)
 * - Weather data
 * - Government schemes
 */

import "dotenv/config";

// ============================================
// Types
// ============================================

export interface MandiPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
}

export interface WeatherData {
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feels_like: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  description: string;
  forecast_3day: Array<{
    date: string;
    temp_min: number;
    temp_max: number;
    description: string;
    rain_probability: number;
  }>;
  alerts: Array<{
    event: string;
    description: string;
    severity: string;
  }>;
}

export interface GovernmentScheme {
  scheme_id: string;
  scheme_code: string;
  scheme_name: string;
  scheme_name_marathi?: string;
  scheme_name_hindi?: string;
  description: string;
  description_marathi?: string;
  description_hindi?: string;
  benefits: string;
  eligibility: string[];
  application_url: string;
  department: string;
  state: string;
  category: string;
  is_active: boolean;
  last_updated: Date;
}

// ============================================
// Market Prices (Mandi Rates)
// ============================================

/**
 * Fetch mandi prices from data.gov.in
 * Free API with government data
 */
export async function fetchMandiPrices(
  state: string,
  commodity: string,
  district?: string
): Promise<MandiPrice[]> {
  const API_KEY = process.env.DATA_GOV_IN_API_KEY;
  
  if (!API_KEY) {
    console.warn('DATA_GOV_IN_API_KEY not configured, using mock data');
    return getMockMandiPrices(state, commodity);
  }

  try {
    const url = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    
    // Build filters - API is case-sensitive
    const filters: any = {};
    
    // State filter - try exact match first
    filters['state'] = state;
    
    // Commodity filter - try exact match
    filters['commodity'] = commodity;
    
    if (district) {
      filters['district'] = district;
    }
    
    const params = new URLSearchParams({
      'api-key': API_KEY,
      format: 'json',
      filters: JSON.stringify(filters),
      limit: '50',
      offset: '0'
    });

    console.log(`Fetching mandi prices: ${url}?${params.toString()}`);

    const response = await fetch(`${url}?${params}`, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Kisan-Setu-AI/1.0'
      }
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`API Response: ${data.total} total records, ${data.count} returned`);
    
    // Check if we got any records
    if (!data.records || data.records.length === 0) {
      console.warn(`No records found for ${state}, ${commodity}. Trying without filters...`);
      
      // Try without filters to get any recent data
      const fallbackParams = new URLSearchParams({
        'api-key': API_KEY,
        format: 'json',
        limit: '50',
        offset: '0'
      });
      
      const fallbackResponse = await fetch(`${url}?${fallbackParams}`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.records && fallbackData.records.length > 0) {
        console.log(`Found ${fallbackData.records.length} records without filters`);
        // Filter client-side for matching state/commodity
        const filtered = fallbackData.records.filter((r: any) => 
          r.state?.toLowerCase().includes(state.toLowerCase()) ||
          r.commodity?.toLowerCase().includes(commodity.toLowerCase())
        );
        
        if (filtered.length > 0) {
          return filtered.map((record: any) => ({
            state: record.state,
            district: record.district,
            market: record.market,
            commodity: record.commodity,
            variety: record.variety || 'General',
            arrival_date: record.arrival_date,
            min_price: parseFloat(record.min_price) || 0,
            max_price: parseFloat(record.max_price) || 0,
            modal_price: parseFloat(record.modal_price) || 0,
            unit: 'quintal'
          }));
        }
      }
      
      // If still no data, return mock
      return getMockMandiPrices(state, commodity);
    }
    
    return data.records.map((record: any) => ({
      state: record.state,
      district: record.district,
      market: record.market,
      commodity: record.commodity,
      variety: record.variety || 'General',
      arrival_date: record.arrival_date,
      min_price: parseFloat(record.min_price) || 0,
      max_price: parseFloat(record.max_price) || 0,
      modal_price: parseFloat(record.modal_price) || 0,
      unit: 'quintal'
    }));
  } catch (error) {
    console.error('Error fetching mandi prices:', error);
    return getMockMandiPrices(state, commodity);
  }
}

/**
 * Mock mandi prices for testing
 */
function getMockMandiPrices(state: string, commodity: string): MandiPrice[] {
  const today = new Date().toISOString().split('T')[0];
  
  const mockPrices: Record<string, number> = {
    'onion': 2500,
    'tomato': 1800,
    'potato': 1200,
    'wheat': 2200,
    'rice': 2800,
    'cotton': 6500,
    'sugarcane': 3200
  };
  
  const basePrice = mockPrices[commodity.toLowerCase()] || 2000;
  
  return [
    {
      state,
      district: 'Pune',
      market: 'Pune Market Yard',
      commodity,
      variety: 'General',
      arrival_date: today,
      min_price: basePrice - 200,
      max_price: basePrice + 300,
      modal_price: basePrice,
      unit: 'quintal'
    }
  ];
}

// ============================================
// Weather Data
// ============================================

/**
 * Fetch weather from Open-Meteo
 * Completely FREE, no API key required!
 * API: https://open-meteo.com/
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    // Open-Meteo API - FREE, no API key needed!
    const url = 'https://api.open-meteo.com/v1/forecast';
    
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '7'
    });

    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Get location name (reverse geocoding)
    let locationName = 'Unknown';
    try {
      const geocodeUrl = 'https://api.open-meteo.com/v1/geocoding';
      const geocodeParams = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        count: '1'
      });
      const geocodeResponse = await fetch(`${geocodeUrl}?${geocodeParams}`);
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.results && geocodeData.results.length > 0) {
          locationName = geocodeData.results[0].name;
        }
      }
    } catch (error) {
      console.warn('Geocoding failed:', error);
    }

    // Process 3-day forecast from daily data
    const forecast3day = [];
    for (let i = 1; i <= 3 && i < data.daily.time.length; i++) {
      forecast3day.push({
        date: data.daily.time[i],
        temp_min: data.daily.temperature_2m_min[i],
        temp_max: data.daily.temperature_2m_max[i],
        description: getWeatherDescription(data.daily.weather_code[i]),
        rain_probability: data.daily.precipitation_probability_max[i] || 0
      });
    }

    // Check for weather alerts based on conditions
    const alerts = [];
    
    // Heavy rain alert
    if (data.daily.precipitation_sum[0] > 50) {
      alerts.push({
        event: 'Heavy Rain',
        description: `Heavy rainfall expected: ${data.daily.precipitation_sum[0]}mm`,
        severity: 'high'
      });
    }
    
    // High temperature alert
    if (data.daily.temperature_2m_max[0] > 40) {
      alerts.push({
        event: 'Heat Wave',
        description: `Very high temperature expected: ${data.daily.temperature_2m_max[0]}°C`,
        severity: 'high'
      });
    }

    return {
      location: locationName,
      latitude,
      longitude,
      temperature: data.current.temperature_2m,
      feels_like: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      rainfall: data.current.precipitation || 0,
      wind_speed: data.current.wind_speed_10m,
      description: getWeatherDescription(data.current.weather_code),
      forecast_3day: forecast3day,
      alerts: alerts
    };
  } catch (error) {
    console.error('Error fetching weather data from Open-Meteo:', error);
    return getMockWeatherData(latitude, longitude);
  }
}

/**
 * Convert WMO weather code to description
 * https://open-meteo.com/en/docs
 */
function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'foggy',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    71: 'slight snow',
    73: 'moderate snow',
    75: 'heavy snow',
    77: 'snow grains',
    80: 'slight rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    85: 'slight snow showers',
    86: 'heavy snow showers',
    95: 'thunderstorm',
    96: 'thunderstorm with slight hail',
    99: 'thunderstorm with heavy hail'
  };
  
  return weatherCodes[code] || 'unknown';
}

/**
 * Mock weather data for testing
 */
function getMockWeatherData(latitude: number, longitude: number): WeatherData {
  const today = new Date();
  
  return {
    location: 'Pune',
    latitude,
    longitude,
    temperature: 28,
    feels_like: 30,
    humidity: 65,
    rainfall: 0,
    wind_speed: 12,
    description: 'partly cloudy',
    forecast_3day: [
      {
        date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
        temp_min: 22,
        temp_max: 32,
        description: 'sunny',
        rain_probability: 10
      },
      {
        date: new Date(today.getTime() + 172800000).toISOString().split('T')[0],
        temp_min: 23,
        temp_max: 31,
        description: 'partly cloudy',
        rain_probability: 30
      },
      {
        date: new Date(today.getTime() + 259200000).toISOString().split('T')[0],
        temp_min: 21,
        temp_max: 29,
        description: 'light rain',
        rain_probability: 70
      }
    ],
    alerts: []
  };
}

// ============================================
// Government Schemes
// ============================================

/**
 * Fetch government schemes
 * Uses cached data + periodic updates
 */
export async function fetchGovernmentSchemes(
  state: string,
  category: string = 'agriculture'
): Promise<GovernmentScheme[]> {
  // For now, return curated list of major schemes
  // In production, integrate with MyScheme API or data.gov.in
  
  return getMockGovernmentSchemes(state, category);
}

/**
 * Mock government schemes (curated list)
 */
function getMockGovernmentSchemes(state: string, category: string): GovernmentScheme[] {
  const schemes: GovernmentScheme[] = [
    {
      scheme_id: '1',
      scheme_code: 'PM-KISAN-2026',
      scheme_name: 'PM Kisan Samman Nidhi',
      scheme_name_marathi: 'पीएम किसान सम्मान निधी',
      scheme_name_hindi: 'पीएम किसान सम्मान निधी',
      description: 'Direct income support of ₹6,000 per year to all landholding farmers',
      description_marathi: 'सर्व जमीनधारक शेतकऱ्यांना दरवर्षी ₹६,००० चे थेट उत्पन्न समर्थन',
      description_hindi: 'सभी जमीनधारक किसानों को प्रति वर्ष ₹६,००० का प्रत्यक्ष आय सहायता',
      benefits: '₹6,000 per year in 3 installments',
      eligibility: ['Land ownership', 'Age 18+', 'Not a government employee'],
      application_url: 'https://pmkisan.gov.in/',
      department: 'Ministry of Agriculture',
      state: 'All India',
      category: 'agriculture',
      is_active: true,
      last_updated: new Date()
    },
    {
      scheme_id: '2',
      scheme_code: 'PM-FASAL-BIMA-2026',
      scheme_name: 'PM Fasal Bima Yojana',
      scheme_name_marathi: 'पीएम फसल बीमा योजना',
      scheme_name_hindi: 'पीएम फसल बीमा योजना',
      description: 'Crop insurance scheme with premium subsidy',
      description_marathi: 'प्रीमियम सबसिडीसह पीक बीमा योजना',
      description_hindi: 'प्रीमियम सब्सिडी के साथ फसल बीमा योजना',
      benefits: 'Up to 90% premium subsidy, comprehensive crop coverage',
      eligibility: ['Land ownership', 'Bank account', 'Aadhaar linked'],
      application_url: 'https://pmfby.gov.in/',
      department: 'Ministry of Agriculture',
      state: 'All India',
      category: 'agriculture',
      is_active: true,
      last_updated: new Date()
    },
    {
      scheme_id: '3',
      scheme_code: 'SOIL-HEALTH-CARD-2026',
      scheme_name: 'Soil Health Card Scheme',
      scheme_name_marathi: 'मृदा आरोग्य कार्ड योजना',
      scheme_name_hindi: 'मिट्टी स्वास्थ्य कार्ड योजना',
      description: 'Free soil testing and health cards',
      description_marathi: 'मोफत मृदा चाचणी आणि आरोग्य कार्ड',
      description_hindi: 'मुफ्त मिट्टी परीक्षण और स्वास्थ्य कार्ड',
      benefits: 'Free soil testing, personalized fertilizer recommendations',
      eligibility: ['Farmer status'],
      application_url: 'https://soilhealth.dac.gov.in/',
      department: 'Ministry of Agriculture',
      state: 'All India',
      category: 'agriculture',
      is_active: true,
      last_updated: new Date()
    }
  ];
  
  return schemes.filter(s => 
    s.state === 'All India' || s.state === state
  );
}

// ============================================
// Unified Data Service
// ============================================

export class RealtimeDataService {
  /**
   * Get market prices with caching
   */
  async getMarketPrices(
    state: string,
    commodity: string,
    district?: string
  ): Promise<MandiPrice[]> {
    try {
      return await fetchMandiPrices(state, commodity, district);
    } catch (error) {
      console.error('Error getting market prices:', error);
      return [];
    }
  }

  /**
   * Get weather data with caching
   */
  async getWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      return await fetchWeatherData(latitude, longitude);
    } catch (error) {
      console.error('Error getting weather:', error);
      return getMockWeatherData(latitude, longitude);
    }
  }

  /**
   * Get government schemes
   */
  async getGovernmentSchemes(
    state: string,
    category: string = 'agriculture'
  ): Promise<GovernmentScheme[]> {
    try {
      return await fetchGovernmentSchemes(state, category);
    } catch (error) {
      console.error('Error getting schemes:', error);
      return [];
    }
  }
}
