export interface BotConfig {
  bot: {
    token: string;
    licenseKey: string;
    adminId: number[];
    channel: string;
    shopName: string;
    btnCtr: number;
    btnPrd: number;
    digit: number;
  };
  svalepay: {
    business_id: string;
    secret_key: string;
  };
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: string[];
  icon?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  items: ProductItem[];
}

export interface UserOrder {
  id: string;
  product: string;
  price: number;
  method: string;
  data: string;
  status: string;
  date: string;
}

export interface BotUser {
  id: number;
  username?: string;
  createdAt?: string;
  transaksi: number;
  saldo: number;
  order?: UserOrder[];
}

export interface OverviewStats {
  totalRevenue: number;
  totalTransactions: number;
  totalUsers: number;
  totalCategories: number;
  totalProducts: number;
  totalStockAvailable: number;
  revenueByDay: { date: string; amount: number; count: number }[];
  recentOrders: (UserOrder & { userId: number; username?: string })[];
}
