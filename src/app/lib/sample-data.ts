'use client';

// Comprehensive sample datasets for DataSense dashboard

export interface SampleDataset {
  name: string;
  description: string;
  icon: string;
  data: Record<string, any>[];
}

// 1. E-Commerce Sales Data
function generateSalesData(): Record<string, any>[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Beauty'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const data: Record<string, any>[] = [];

  let id = 1;
  for (const month of months) {
    for (const category of categories) {
      for (const region of regions) {
        const baseRevenue = Math.floor(Math.random() * 50000) + 10000;
        const unitsSold = Math.floor(Math.random() * 500) + 50;
        const avgPrice = Math.round((baseRevenue / unitsSold) * 100) / 100;
        const cost = Math.round(baseRevenue * (0.4 + Math.random() * 0.3) * 100) / 100;
        const profit = Math.round((baseRevenue - cost) * 100) / 100;
        const customerSatisfaction = Math.round((3 + Math.random() * 2) * 10) / 10;
        const returnRate = Math.round(Math.random() * 10 * 100) / 100;

        data.push({
          id: id++,
          month,
          category,
          region,
          revenue: baseRevenue,
          unitsSold,
          avgPrice,
          cost,
          profit,
          profitMargin: Math.round((profit / baseRevenue) * 10000) / 100,
          customerSatisfaction: Math.min(5, customerSatisfaction),
          returnRate,
          marketingSpend: Math.floor(Math.random() * 5000) + 500,
          websiteVisits: Math.floor(Math.random() * 50000) + 5000,
          conversionRate: Math.round(Math.random() * 8 * 100) / 100,
        });
      }
    }
  }
  return data;
}

// 2. Weather & Climate Data
function generateWeatherData(): Record<string, any>[] {
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Seattle', 'Miami', 'Denver'];
  const data: Record<string, any>[] = [];
  
  let id = 1;
  for (let month = 1; month <= 12; month++) {
    for (const city of cities) {
      const isSummer = month >= 5 && month <= 9;
      const baseTemp = city === 'Phoenix' ? 90 : city === 'Miami' ? 85 : city === 'Chicago' ? 55 : city === 'Denver' ? 50 : city === 'Seattle' ? 55 : 65;
      const seasonalAdj = isSummer ? 15 : -15;
      const temp = Math.round((baseTemp + seasonalAdj + (Math.random() * 10 - 5)) * 10) / 10;
      const humidity = Math.floor(Math.random() * 40) + 30;
      const rainfall = Math.round(Math.random() * 5 * 100) / 100;
      const windSpeed = Math.round(Math.random() * 25 * 10) / 10;
      const uvIndex = Math.floor(Math.random() * 8) + 1;
      const airQuality = Math.floor(Math.random() * 100) + 20;
      const cloudCover = Math.floor(Math.random() * 100);
      
      data.push({
        id: id++,
        city,
        month: `2024-${String(month).padStart(2, '0')}`,
        monthName: new Date(2024, month - 1).toLocaleString('default', { month: 'short' }),
        temperature: temp,
        feelsLike: Math.round((temp + (Math.random() * 6 - 3)) * 10) / 10,
        humidity,
        rainfall,
        windSpeed,
        uvIndex,
        airQuality,
        cloudCover,
        snowfall: (!isSummer && (city === 'Denver' || city === 'Chicago')) ? Math.round(Math.random() * 10 * 10) / 10 : 0,
        sunshineHours: Math.round((isSummer ? 10 : 6) + Math.random() * 4),
        dewPoint: Math.round((temp - 10 + Math.random() * 8) * 10) / 10,
      });
    }
  }
  return data;
}

// 3. Financial / Stock Market Data
function generateFinancialData(): Record<string, any>[] {
  const companies = ['TechCorp', 'FinanceHub', 'GreenEnergy', 'HealthPlus', 'RetailMax', 'AutoDrive', 'CloudServ', 'DataLogic'];
  const quarters = ['Q1-2023', 'Q2-2023', 'Q3-2023', 'Q4-2023', 'Q1-2024', 'Q2-2024', 'Q3-2024', 'Q4-2024'];
  const data: Record<string, any>[] = [];
  
  let id = 1;
  const stockPrices: Record<string, number> = {};
  companies.forEach(c => { stockPrices[c] = 50 + Math.random() * 200; });
  
  for (const quarter of quarters) {
    for (const company of companies) {
      const change = (Math.random() - 0.4) * 20;
      stockPrices[company] = Math.max(10, stockPrices[company] + change);
      
      const revenue = Math.floor(Math.random() * 500 + 100);
      const expenses = Math.floor(revenue * (0.5 + Math.random() * 0.3));
      const netIncome = revenue - expenses;
      const marketCap = Math.floor(stockPrices[company] * (Math.random() * 500 + 100));
      const peRatio = Math.round((10 + Math.random() * 40) * 10) / 10;
      const dividendYield = Math.round(Math.random() * 5 * 100) / 100;
      
      data.push({
        id: id++,
        company,
        quarter,
        stockPrice: Math.round(stockPrices[company] * 100) / 100,
        revenue: revenue * 1000000,
        expenses: expenses * 1000000,
        netIncome: netIncome * 1000000,
        earningsPerShare: Math.round((netIncome / (Math.random() * 500 + 100)) * 100) / 100,
        marketCap: marketCap * 1000000,
        peRatio,
        dividendYield,
        debtToEquity: Math.round(Math.random() * 2 * 100) / 100,
        returnOnEquity: Math.round(Math.random() * 30 * 100) / 100,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        beta: Math.round((0.5 + Math.random() * 1.5) * 100) / 100,
      });
    }
  }
  return data;
}

// 4. Health & Fitness Data
function generateHealthData(): Record<string, any>[] {
  const ageGroups = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
  const genders = ['Male', 'Female'];
  const activities = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];
  const data: Record<string, any>[] = [];
  
  let id = 1;
  for (const ageGroup of ageGroups) {
    for (const gender of genders) {
      for (const activity of activities) {
        const bmi = activity === 'Very Active' ? 22 + Math.random() * 4 :
                    activity === 'Active' ? 23 + Math.random() * 5 :
                    activity === 'Moderate' ? 24 + Math.random() * 6 :
                    activity === 'Light' ? 25 + Math.random() * 7 :
                    27 + Math.random() * 8;
        
        const restingHR = activity === 'Very Active' ? 55 + Math.random() * 10 :
                          activity === 'Active' ? 60 + Math.random() * 10 :
                          65 + Math.random() * 15;
        
        const steps = activity === 'Very Active' ? 12000 + Math.random() * 5000 :
                      activity === 'Active' ? 8000 + Math.random() * 3000 :
                      activity === 'Moderate' ? 5000 + Math.random() * 2000 :
                      activity === 'Light' ? 3000 + Math.random() * 1500 :
                      1000 + Math.random() * 1500;
        
        data.push({
          id: id++,
          ageGroup,
          gender,
          activityLevel: activity,
          bmi: Math.round(bmi * 10) / 10,
          restingHeartRate: Math.round(restingHR),
          bloodPressureSystolic: Math.round(110 + Math.random() * 40),
          bloodPressureDiastolic: Math.round(70 + Math.random() * 25),
          cholesterol: Math.round(150 + Math.random() * 100),
          bloodSugar: Math.round(80 + Math.random() * 60),
          dailySteps: Math.round(steps),
          sleepHours: Math.round((5 + Math.random() * 4) * 10) / 10,
          waterIntake: Math.round((1 + Math.random() * 2.5) * 10) / 10,
          stressLevel: Math.floor(Math.random() * 10) + 1,
          vo2Max: Math.round((25 + Math.random() * 25) * 10) / 10,
          bodyFatPercentage: Math.round((10 + Math.random() * 25) * 10) / 10,
        });
      }
    }
  }
  return data;
}

// 5. Marketing Campaign Data
function generateMarketingData(): Record<string, any>[] {
  const platforms = ['Google Ads', 'Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 'YouTube', 'Email'];
  const campaigns = ['Summer Sale', 'Brand Awareness', 'Product Launch', 'Retargeting', 'Holiday Special', 'Newsletter'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data: Record<string, any>[] = [];
  
  let id = 1;
  for (const month of months) {
    for (const platform of platforms) {
      for (const campaign of campaigns) {
        const impressions = Math.floor(Math.random() * 500000) + 10000;
        const ctr = Math.round(Math.random() * 5 * 100) / 100;
        const clicks = Math.floor(impressions * (ctr / 100));
        const cpc = Math.round((0.5 + Math.random() * 3) * 100) / 100;
        const spend = Math.round(clicks * cpc * 100) / 100;
        const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.08));
        const revenue = Math.round(conversions * (20 + Math.random() * 80) * 100) / 100;
        const roas = spend > 0 ? Math.round((revenue / spend) * 100) / 100 : 0;
        
        data.push({
          id: id++,
          month,
          platform,
          campaign,
          impressions,
          clicks,
          ctr,
          cpc,
          spend,
          conversions,
          conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,
          revenue,
          roas,
          costPerConversion: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : 0,
          bounceRate: Math.round((20 + Math.random() * 60) * 100) / 100,
          avgSessionDuration: Math.round((30 + Math.random() * 270) * 10) / 10,
          newUsers: Math.floor(clicks * (0.3 + Math.random() * 0.4)),
          engagementRate: Math.round((1 + Math.random() * 8) * 100) / 100,
        });
      }
    }
  }
  return data;
}

// 6. Employee/HR Data
function generateEmployeeData(): Record<string, any>[] {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Design'];
  const roles = ['Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director'];
  const data: Record<string, any>[] = [];
  
  let id = 1;
  for (const dept of departments) {
    for (const role of roles) {
      for (let i = 0; i < 3; i++) {
        const baseSalary = role === 'Junior' ? 50000 : role === 'Mid-Level' ? 75000 : role === 'Senior' ? 100000 : role === 'Lead' ? 120000 : role === 'Manager' ? 140000 : 180000;
        const salary = baseSalary + Math.floor(Math.random() * 20000);
        const yearsExp = role === 'Junior' ? Math.floor(Math.random() * 3) + 1 : role === 'Mid-Level' ? Math.floor(Math.random() * 3) + 3 : role === 'Senior' ? Math.floor(Math.random() * 5) + 5 : Math.floor(Math.random() * 8) + 8;
        
        data.push({
          id: id++,
          department: dept,
          role,
          salary,
          yearsExperience: yearsExp,
          performanceScore: Math.round((2 + Math.random() * 3) * 10) / 10,
          satisfactionScore: Math.round((2.5 + Math.random() * 2.5) * 10) / 10,
          trainingHours: Math.floor(Math.random() * 80),
          projectsCompleted: Math.floor(Math.random() * 15) + 1,
          absenteeismDays: Math.floor(Math.random() * 10),
          overtimeHours: Math.round(Math.random() * 20 * 10) / 10,
          promotionLast3Years: Math.floor(Math.random() * 3),
          teamSize: Math.floor(Math.random() * 10) + 1,
          remoteWorkDays: Math.floor(Math.random() * 5),
          engagementScore: Math.round((2 + Math.random() * 3) * 10) / 10,
        });
      }
    }
  }
  return data;
}

// 7. IoT / Sensor Data
function generateIoTData(): Record<string, any>[] {
  const devices = ['Sensor-A1', 'Sensor-A2', 'Sensor-B1', 'Sensor-B2', 'Sensor-C1', 'Sensor-C2'];
  const locations = ['Building A', 'Building B', 'Building C'];
  const data: Record<string, any>[] = [];
  
  let id = 1;
  for (let hour = 0; hour < 24; hour++) {
    for (const device of devices) {
      const isDay = hour >= 6 && hour <= 18;
      const location = device.startsWith('Sensor-A') ? 'Building A' : device.startsWith('Sensor-B') ? 'Building B' : 'Building C';
      
      data.push({
        id: id++,
        device,
        location,
        hour: `${String(hour).padStart(2, '0')}:00`,
        temperature: Math.round((isDay ? 22 + Math.random() * 6 : 18 + Math.random() * 4) * 10) / 10,
        humidity: Math.round((40 + Math.random() * 30) * 10) / 10,
        co2Level: Math.floor(isDay ? 400 + Math.random() * 600 : 350 + Math.random() * 200),
        noiseLevel: Math.round((isDay ? 40 + Math.random() * 30 : 25 + Math.random() * 15) * 10) / 10,
        lightLevel: Math.round(isDay ? 300 + Math.random() * 700 : 0 + Math.random() * 50),
        powerConsumption: Math.round((isDay ? 150 + Math.random() * 100 : 50 + Math.random() * 50) * 10) / 10,
        occupancy: isDay ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 5),
        airQuality: Math.floor(70 + Math.random() * 30),
        vibration: Math.round(Math.random() * 10 * 100) / 100,
        networkLatency: Math.floor(5 + Math.random() * 45),
        uptime: Math.round((98 + Math.random() * 2) * 100) / 100,
      });
    }
  }
  return data;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    name: 'E-Commerce Sales',
    description: '12 months of multi-region, multi-category sales data with revenue, profit, and customer metrics',
    icon: '🛒',
    data: generateSalesData(),
  },
  {
    name: 'Weather & Climate',
    description: 'Monthly weather data across 8 US cities including temperature, humidity, and air quality',
    icon: '🌤️',
    data: generateWeatherData(),
  },
  {
    name: 'Financial Markets',
    description: '8 quarters of stock market data for 8 companies with revenue, P/E ratios, and more',
    icon: '📈',
    data: generateFinancialData(),
  },
  {
    name: 'Health & Fitness',
    description: 'Health metrics across age groups, genders, and activity levels including BMI, vitals, and fitness',
    icon: '🏥',
    data: generateHealthData(),
  },
  {
    name: 'Marketing Campaigns',
    description: '12 months of multi-platform marketing data with impressions, CTR, ROAS, and conversions',
    icon: '📣',
    data: generateMarketingData(),
  },
  {
    name: 'Employee Analytics',
    description: 'HR data across 8 departments with salary, performance, satisfaction, and engagement metrics',
    icon: '👥',
    data: generateEmployeeData(),
  },
  {
    name: 'IoT Sensor Data',
    description: '24-hour sensor readings from 6 devices across 3 buildings with environmental metrics',
    icon: '📡',
    data: generateIoTData(),
  },
];