import type {
  ApiResponse,
  ApiError,
  AuthTokens,
  RegisterInput,
  LoginInput,
  JoinInput,
  User,
  Wallet,
  Transaction,
  Category,
  Budget,
  DashboardSummary,
  DailyChartData,
  CategoryChartData,
  RecurringRule,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

class ApiClient {
  private accessToken: string | null = null;
  private isRefreshing = false;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const data = await response.json();
      
      if (data.error === 'invalid or expired token' || data.error === 'missing authorization header') {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const refreshResponse = await this.refreshToken();
            if (refreshResponse.success) {
              const newToken = refreshResponse.data.access_token;
              this.accessToken = newToken;
              localStorage.setItem('fintrack_access_token', newToken);
              
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await fetch(url, {
                ...options,
                headers,
              });
              
              const retryData = await retryResponse.json();
              if (!retryResponse.ok) {
                const error = retryData as ApiError;
                throw new Error(error.message || error.error || 'Request failed');
              }
              
              this.isRefreshing = false;
              return retryData as T;
            }
          } catch (refreshError) {
            this.isRefreshing = false;
            localStorage.removeItem('fintrack_access_token');
            localStorage.removeItem('fintrack_user');
            localStorage.removeItem('fintrack_wallet');
            window.location.href = '/login';
            throw refreshError;
          }
        }
      }
      
      throw new Error(data.message || data.error || 'Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || error.error || 'Request failed');
    }

    return data as T;
  }

  // Auth endpoints
  async register(input: RegisterInput): Promise<ApiResponse<AuthTokens & { user: User; wallet: Wallet }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async login(input: LoginInput): Promise<ApiResponse<AuthTokens & { user: User; wallet: Wallet }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async join(input: JoinInput): Promise<ApiResponse<AuthTokens & { user: User; wallet: Wallet }>> {
    return this.request('/auth/join', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const currentToken = this.accessToken;
    
    return this.request('/auth/refresh', {
      method: 'POST',
      headers: currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {},
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  }

  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request('/user/profile');
  }

  // Transaction endpoints
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    category_id?: string;
    type?: 'income' | 'expense';
  }): Promise<ApiResponse<Transaction[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async createTransaction(input: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getTransaction(id: string): Promise<ApiResponse<Transaction>> {
    return this.request(`/transactions/${id}`);
  }

  async updateTransaction(id: string, input: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteTransaction(id: string): Promise<ApiResponse<void>> {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Category endpoints
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request('/categories');
  }

  async createCategory(input: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateCategory(id: string, input: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Budget endpoints
  async getBudgets(month?: string): Promise<ApiResponse<Budget[]>> {
    const queryString = month ? `?month=${month}` : '';
    return this.request(`/budgets${queryString}`);
  }

  async createBudget(input: Partial<Budget>): Promise<ApiResponse<Budget>> {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateBudget(id: string, input: Partial<Budget>): Promise<ApiResponse<Budget>> {
    return this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteBudget(id: string): Promise<ApiResponse<void>> {
    return this.request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard endpoints
  async getDashboardSummary(month?: string): Promise<ApiResponse<DashboardSummary>> {
    const queryString = month ? `?month=${month}` : '';
    return this.request(`/dashboard/summary${queryString}`);
  }

  async getDailyChartData(month?: string): Promise<ApiResponse<DailyChartData[]>> {
    const queryString = month ? `?month=${month}` : '';
    return this.request(`/dashboard/chart/daily${queryString}`);
  }

  async getCategoryChartData(month?: string): Promise<ApiResponse<CategoryChartData[]>> {
    const queryString = month ? `?month=${month}` : '';
    return this.request(`/dashboard/chart/category${queryString}`);
  }

  // Wallet endpoints
  async getWallet(): Promise<ApiResponse<Wallet>> {
    return this.request('/wallet');
  }

  async getWalletCode(): Promise<ApiResponse<{ code: string }>> {
    return this.request('/wallet/code');
  }

  // Recurring endpoints
  async getRecurring(): Promise<ApiResponse<RecurringRule[]>> {
    return this.request('/recurring');
  }

  async createRecurring(input: Partial<RecurringRule>): Promise<ApiResponse<RecurringRule>> {
    return this.request('/recurring', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async toggleRecurring(id: string): Promise<ApiResponse<RecurringRule>> {
    return this.request(`/recurring/${id}/toggle`, {
      method: 'PUT',
    });
  }

  async updateRecurring(id: string, input: Partial<RecurringRule>): Promise<ApiResponse<RecurringRule>> {
    return this.request(`/recurring/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteRecurring(id: string): Promise<ApiResponse<void>> {
    return this.request(`/recurring/${id}`, {
      method: 'DELETE',
    });
  }

  // Insights endpoints
  async getInsights(month?: string): Promise<ApiResponse<any[]>> {
    const queryString = month ? `?month=${month}` : '';
    return this.request(`/insights${queryString}`);
  }
}

export const api = new ApiClient();
export default api;
