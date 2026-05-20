const DEFAULT_BASE_URL = "https://apiv2.shiprocket.in";

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function getConfig() {
  const email =
    process.env.SHIPROCKET_EMAIL?.trim() ||
    process.env.SHIPROCKET_API_EMAIL?.trim();
  const password =
    process.env.SHIPROCKET_PASSWORD?.trim() ||
    process.env.SHIPROCKET_API_PASSWORD?.trim();
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION?.trim();
  if (!pickupLocation) {
    throw new Error("SHIPROCKET_PICKUP_LOCATION is required (use exact nickname from Shiprocket panel)");
  }
  const baseUrl = process.env.SHIPROCKET_BASE_URL?.trim() || DEFAULT_BASE_URL;

  if (!email || !password) {
    throw new Error("SHIPROCKET_NOT_CONFIGURED");
  }

  return { email, password, pickupLocation: pickupLocation!, baseUrl };
}

export function isShiprocketConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

async function login(): Promise<string> {
  const cached = tokenCache;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const { email, password, baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}/v1/external/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    token?: string;
    message?: string;
  };

  if (!response.ok || !body.token) {
    throw new Error(body.message ?? "Shiprocket login failed");
  }

  tokenCache = {
    token: body.token,
    expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
  };

  return body.token;
}

async function shiprocketFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { baseUrl } = getConfig();
  const token = await login();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    const message =
      (body as { message?: string }).message ??
      (body as { error?: string }).error ??
      `Shiprocket request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

export type ShiprocketAdhocOrderPayload = {
  order_id: string;
  order_date: string;
  pickup_location: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: number;
  }[];
  payment_method: "Prepaid" | "COD";
  shipping_charges: number;
  giftwrap_charges: number;
  transaction_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
};

export async function createShiprocketAdhocOrder(payload: ShiprocketAdhocOrderPayload) {
  return shiprocketFetch<{
    order_id?: number;
    shipment_id?: number;
    status?: string;
    status_code?: number;
    message?: string;
  }>("/v1/external/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function assignShiprocketAwb(shipmentId: number) {
  return shiprocketFetch<{
    awb_assign_status?: number;
    response?: {
      data?: {
        awb_code?: string;
        courier_name?: string;
        etd?: string;
      };
    };
    message?: string;
  }>("/v1/external/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

export async function generateShiprocketPickup(shipmentId: number) {
  return shiprocketFetch<{
    pickup_status?: number;
    response?: {
      pickup_scheduled_date?: string;
      pickup_scheduled_time?: string;
      pickup_time?: string;
      pickup_slot?: string;
      [key: string]: unknown;
    };
    message?: string;
  }>("/v1/external/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

export function getShiprocketPickupLocation(): string {
  return getConfig().pickupLocation;
}

export type ShiprocketWarehouseAddress = {
  name: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
};

export function getShiprocketWarehouseAddress(): ShiprocketWarehouseAddress {
  const name = process.env.SHIPROCKET_WAREHOUSE_NAME?.trim() || "Wholesale Jewelry";
  const address =
    process.env.SHIPROCKET_WAREHOUSE_ADDRESS?.trim() ||
    process.env.SHIPROCKET_WAREHOUSE_LINE1?.trim();
  const city = process.env.SHIPROCKET_WAREHOUSE_CITY?.trim();
  const state = process.env.SHIPROCKET_WAREHOUSE_STATE?.trim();
  const pincode = process.env.SHIPROCKET_WAREHOUSE_PINCODE?.trim();
  const phone = process.env.SHIPROCKET_WAREHOUSE_PHONE?.trim();
  if (!address || !city || !state || !pincode || !phone) {
    throw new Error(
      "SHIPROCKET_WAREHOUSE_ADDRESS, CITY, STATE, PINCODE, and PHONE are required for return pickups",
    );
  }
  return {
    name,
    address,
    address2: process.env.SHIPROCKET_WAREHOUSE_ADDRESS_2?.trim() || "",
    city,
    state,
    pincode,
    phone,
    email: process.env.SHIPROCKET_WAREHOUSE_EMAIL?.trim() || "returns@wholesalejewelry.local",
  };
}

export type ShiprocketReturnOrderPayload = {
  order_id: string;
  order_date: string;
  channel_id?: number;
  pickup_customer_name: string;
  pickup_last_name: string;
  pickup_address: string;
  pickup_address_2: string;
  pickup_city: string;
  pickup_state: string;
  pickup_country: string;
  pickup_pincode: number;
  pickup_email: string;
  pickup_phone: string;
  shipping_customer_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_pincode: number;
  shipping_email: string;
  shipping_phone: string;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    hsn?: number;
  }[];
  payment_method: "Prepaid";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
};

export async function createShiprocketReturnOrder(payload: ShiprocketReturnOrderPayload) {
  return shiprocketFetch<{
    order_id?: number;
    shipment_id?: number;
    status?: string;
    status_code?: number;
    message?: string;
  }>("/v1/external/orders/create/return", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
