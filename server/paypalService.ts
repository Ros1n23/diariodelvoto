import fs from 'node:fs';
import path from 'node:path';

function getEnvConfig() {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf-8');
  } catch {
    // ignore
  }

  const config: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      config[key] = val;
    }
  }

  const mode = process.env.PAYPAL_MODE || config.PAYPAL_MODE || 'sandbox';
  const clientId = process.env.PAYPAL_CLIENT_ID || config.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || config.PAYPAL_CLIENT_SECRET || '';

  return { mode, clientId, clientSecret };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export function getPayPalPublicClientId(): string {
  return getEnvConfig().clientId;
}

export function getPayPalMode(): string {
  return getEnvConfig().mode;
}

export async function getPayPalAccessToken(): Promise<string> {
  const { mode, clientId, clientSecret } = getEnvConfig();
  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de PayPal no configuradas en .env');
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error de autenticación con PayPal: ${errorText}`);
  }

  const data = (await res.json()) as any;
  const token = data.access_token;
  const expiresIn = data.expires_in || 3600;
  cachedToken = {
    token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };

  return token;
}

export async function createPayPalOrder(
  amountEur: number,
  description: string = 'Mecenazgo Cívico — Diario del Voto'
): Promise<{ orderId: string }> {
  const { mode } = getEnvConfig();
  const token = await getPayPalAccessToken();
  const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description,
          amount: {
            currency_code: 'EUR',
            value: amountEur.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Diario del Voto',
        locale: 'es-ES',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al crear orden en PayPal: ${errText}`);
  }

  const data = (await res.json()) as any;
  return { orderId: data.id };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  orderId: string;
  captureId: string;
  status: string;
  amountEur: number;
  currency: string;
}> {
  const { mode } = getEnvConfig();
  const token = await getPayPalAccessToken();
  const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al capturar orden en PayPal: ${errText}`);
  }

  const data = (await res.json()) as any;
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture || capture.status !== 'COMPLETED') {
    throw new Error(`El pago no se ha completado correctamente en PayPal (estado: ${capture?.status || 'desconocido'})`);
  }

  return {
    orderId: data.id,
    captureId: capture.id,
    status: capture.status,
    amountEur: parseFloat(capture.amount.value),
    currency: capture.amount.currency_code,
  };
}

export async function refundPayPalCapture(
  captureId: string,
  note: string = 'Reembolso por rechazo editorial en Diario del Voto'
): Promise<{
  refundId: string;
  status: string;
}> {
  const { mode } = getEnvConfig();
  const token = await getPayPalAccessToken();
  const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      note_to_payer: note.slice(0, 255),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al reembolsar en PayPal: ${errText}`);
  }

  const data = (await res.json()) as any;
  return {
    refundId: data.id,
    status: data.status,
  };
}
