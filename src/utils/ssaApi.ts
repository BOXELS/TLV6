import type { SsaCredentials, SsaProduct, SsaOrder } from '../types/ssa';

const SSA_API_BASE = 'https://api.ssactivewear.com/v2';

async function makeRequest(
  credentials: SsaCredentials,
  endpoint: string,
  options: RequestInit = {}
) {
  // SSA uses API key in header directly
  const headers = {
    'Authorization': credentials.apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(`${SSA_API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('SSA API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`SSA API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function validateSsaCredentials(credentials: SsaCredentials): Promise<boolean> {
  try {
    // Try a simple endpoint to validate credentials
    await makeRequest(credentials, '/products/search?limit=1');
    return true;
  } catch (error) {
    console.error('SSA credential validation error:', error);
    return false;
  }
}

export async function fetchSsaProducts(
  credentials: SsaCredentials,
  query?: string
): Promise<SsaProduct[]> {
  const endpoint = query 
    ? `/products/search?q=${encodeURIComponent(query)}`
    : '/products';

  const data = await makeRequest(credentials, endpoint);
  return data.products;
}

export async function fetchSsaOrders(
  credentials: SsaCredentials,
  status?: string
): Promise<SsaOrder[]> {
  const endpoint = status
    ? `/orders?status=${encodeURIComponent(status)}`
    : '/orders';

  const data = await makeRequest(credentials, endpoint);
  return data.orders;
}

export async function createSsaOrder(
  credentials: SsaCredentials,
  order: Partial<SsaOrder>
): Promise<SsaOrder> {
  const data = await makeRequest(credentials, '/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
  return data.order;
}