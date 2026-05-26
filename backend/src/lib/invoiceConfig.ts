/** Seller details for GST invoices. Override via env before production. */
export type InvoiceSellerConfig = {
  businessName: string;
  gstin: string;
  registeredState: string;
  address: string;
  pincode: string;
};

const DEFAULT_ADDRESS =
  "No, G-5, Fatimah Palace, Opp Parekh Jewellers, Navapura Karva Road, Bhagal, Surat, Gujarat, India, 395007";

/** Placeholder GSTIN (Gujarat state code 24). Replace STORE_GSTIN in production. */
const DEFAULT_GSTIN = "24AAAAA0000A1Z5";

export function getInvoiceSellerConfig(): InvoiceSellerConfig {
  return {
    businessName: process.env.STORE_NAME?.trim() || "Dhrumil Jewellers",
    gstin: process.env.STORE_GSTIN?.trim() || DEFAULT_GSTIN,
    registeredState: process.env.STORE_REGISTERED_STATE?.trim() || "Gujarat",
    address: process.env.STORE_ADDRESS?.trim() || DEFAULT_ADDRESS,
    pincode: process.env.STORE_PINCODE?.trim() || "395007",
  };
}

export function normalizeIndianState(state: string): string {
  return state.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isIntraStateSupply(customerState: string, sellerState: string): boolean {
  const customer = normalizeIndianState(customerState);
  const seller = normalizeIndianState(sellerState);

  if (customer === seller) return true;

  const gujaratAliases = new Set(["gujarat", "gj"]);
  return gujaratAliases.has(customer) && gujaratAliases.has(seller);
}

export type GstSplit = {
  mode: "intra" | "inter";
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
};

export function splitGstPaise(gstPaise: number, customerState: string): GstSplit {
  const seller = getInvoiceSellerConfig();

  if (isIntraStateSupply(customerState, seller.registeredState)) {
    const cgstPaise = Math.floor(gstPaise / 2);
    return {
      mode: "intra",
      cgstPaise,
      sgstPaise: gstPaise - cgstPaise,
      igstPaise: 0,
    };
  }

  return {
    mode: "inter",
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: gstPaise,
  };
}
