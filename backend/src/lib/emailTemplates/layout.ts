import { getStoreFrontendUrl } from "../resendEmail.js";

export const STORE_NAME = process.env.STORE_NAME?.trim() || "Dhrumil Jewellers";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function orderAccountUrl(orderId: string): string {
  return `${getStoreFrontendUrl()}/account/my-orders/${orderId}`;
}

export function emailShell(title: string, bodyHtml: string): string {
  const storeUrl = getStoreFrontendUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:Georgia,'Times New Roman',serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:28px 32px 12px;text-align:center;border-bottom:1px solid #f4f4f5;">
              <p style="margin:0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#71717a;">${escapeHtml(STORE_NAME)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${bodyHtml}</td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#71717a;">
                <a href="${escapeHtml(storeUrl)}" style="color:#18181b;text-decoration:none;">${escapeHtml(storeUrl.replace(/^https?:\/\//, ""))}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">Thank you for shopping with us.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ctaButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:14px 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;">${escapeHtml(label)}</a>`;
}
