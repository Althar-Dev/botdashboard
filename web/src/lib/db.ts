import fs from 'fs/promises';
import path from 'path';
import { BotConfig, ProductCategory, BotUser, OverviewStats, UserOrder } from './types';

const DB_DIR = path.resolve(process.cwd(), '../src/database');

const PATH_CONFIG = path.join(DB_DIR, 'config.json');
const PATH_PRODUCT = path.join(DB_DIR, 'product.json');
const PATH_USER = path.join(DB_DIR, 'user.json');
const PATH_STATS = path.join(DB_DIR, 'stats.json');

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return fallback;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<boolean> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// CONFIG
export async function getConfig(): Promise<BotConfig> {
  return readJson<BotConfig>(PATH_CONFIG, {
    bot: {
      token: '',
      licenseKey: '',
      adminId: [],
      channel: '',
      shopName: 'SValePay Shop',
      btnCtr: 2,
      btnPrd: 4,
      digit: 0,
    },
    svalepay: {
      business_id: '',
      secret_key: '',
    },
  });
}

export async function saveConfig(config: BotConfig): Promise<boolean> {
  return writeJson(PATH_CONFIG, config);
}

// PRODUCTS
export async function getProducts(): Promise<ProductCategory[]> {
  return readJson<ProductCategory[]>(PATH_PRODUCT, []);
}

export async function saveProducts(products: ProductCategory[]): Promise<boolean> {
  return writeJson(PATH_PRODUCT, products);
}

// USERS
export async function getUsers(): Promise<BotUser[]> {
  return readJson<BotUser[]>(PATH_USER, []);
}

export async function saveUsers(users: BotUser[]): Promise<boolean> {
  return writeJson(PATH_USER, users);
}

// STATS & ANALYTICS
export async function getOverviewStats(): Promise<OverviewStats> {
  const users = await getUsers();
  const categories = await getProducts();

  let totalRevenue = 0;
  let totalTransactions = 0;
  const allOrders: (UserOrder & { userId: number; username?: string })[] = [];

  users.forEach((user) => {
    if (user.order && Array.isArray(user.order)) {
      user.order.forEach((ord) => {
        allOrders.push({
          ...ord,
          userId: user.id,
          username: user.username,
        });
        if (ord.status === 'success' || !ord.status) {
          totalRevenue += Number(ord.price || 0);
          totalTransactions += 1;
        }
      });
    }
  });

  // Sort orders descending by date
  allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate stock count & product stats
  let totalProducts = 0;
  let totalStockAvailable = 0;

  categories.forEach((cat) => {
    if (cat.items && Array.isArray(cat.items)) {
      totalProducts += cat.items.length;
      cat.items.forEach((item) => {
        if (Array.isArray(item.stock)) {
          totalStockAvailable += item.stock.length;
        }
      });
    }
  });

  // Group revenue by day for chart
  const revenueMap: Record<string, { amount: number; count: number }> = {};
  
  allOrders.forEach((ord) => {
    if (!ord.date) return;
    const dateKey = new Date(ord.date).toISOString().split('T')[0];
    if (!revenueMap[dateKey]) {
      revenueMap[dateKey] = { amount: 0, count: 0 };
    }
    revenueMap[dateKey].amount += Number(ord.price || 0);
    revenueMap[dateKey].count += 1;
  });

  const revenueByDay = Object.keys(revenueMap)
    .sort()
    .slice(-14)
    .map((date) => ({
      date,
      amount: revenueMap[date].amount,
      count: revenueMap[date].count,
    }));

  return {
    totalRevenue,
    totalTransactions: totalTransactions || allOrders.length,
    totalUsers: users.length,
    totalCategories: categories.length,
    totalProducts,
    totalStockAvailable,
    revenueByDay,
    recentOrders: allOrders.slice(0, 10),
  };
}
