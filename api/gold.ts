async function handler(req: any, res: any) {
  const apiKey = process.env.METALPRICE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing METALPRICE_API_KEY' });
    return;
  }

  try {
    const primary = await fetchMetalPriceApi(apiKey);
    const fallback = primary?.success === false ? await fetchMetalsApi(apiKey) : null;
    const data = primary?.success === false && fallback ? fallback : primary;

    if (!data || data.success === false) {
      res.status(502).json({
        error: data?.error?.info || data?.error?.message || 'Upstream error',
        provider: data?.provider || 'unknown',
        code: data?.error?.code || null
      });
      return;
    }

    const rates = data?.rates || {};
    const usdPerOz = resolveUsdPerOz(rates);
    let usdToZar = numberOrNull(rates.ZAR ?? rates.USDZAR);
    let usdToMzn = numberOrNull(rates.MZN ?? rates.USDMZN);

    if ((!usdToZar || !usdToMzn) && (usdToZar === null || usdToMzn === null)) {
      const fx = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=ZAR,MZN');
      if (fx.ok) {
        const fxData = await fx.json();
        const fxRates = fxData?.rates || {};
        if (!usdToZar) usdToZar = numberOrNull(fxRates.ZAR);
        if (!usdToMzn) usdToMzn = numberOrNull(fxRates.MZN);
      }
    }

    if (!usdPerOz || !usdToZar || !usdToMzn) {
      res.status(502).json({
        error: 'Invalid rates from upstream',
        missing: {
          usdPerOz: !usdPerOz,
          usdToZar: !usdToZar,
          usdToMzn: !usdToMzn
        }
      });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({
      timestamp: data?.timestamp
        ? new Date(data.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      usdPerOz,
      usdToZar,
      usdToMzn
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}

module.exports = handler;

function numberOrNull(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveUsdPerOz(rates: any): number | null {
  const direct = numberOrNull(rates.USDXAU);
  if (direct) return direct;
  const xau = numberOrNull(rates.XAU);
  if (!xau) return null;
  return xau < 1 ? 1 / xau : xau;
}

async function fetchMetalPriceApi(apiKey: string): Promise<any> {
  const url =
    `https://api.metalpriceapi.com/v1/latest` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&base=USD&currencies=XAU,ZAR,MZN`;

  const response = await fetch(url);
  const text = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    return { success: false, provider: 'metalpriceapi', error: { info: text } };
  }

  if (!response.ok || data?.success === false) {
    return {
      success: false,
      provider: 'metalpriceapi',
      error: data?.error || { info: text, code: response.status }
    };
  }

  return { ...data, provider: 'metalpriceapi' };
}

async function fetchMetalsApi(apiKey: string): Promise<any> {
  const url =
    `https://metals-api.com/api/latest` +
    `?access_key=${encodeURIComponent(apiKey)}` +
    `&base=USD&symbols=XAU,ZAR,MZN`;

  const response = await fetch(url);
  const text = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    return { success: false, provider: 'metals-api', error: { info: text } };
  }

  if (!response.ok || data?.success === false) {
    return {
      success: false,
      provider: 'metals-api',
      error: data?.error || { info: text, code: response.status }
    };
  }

  return { ...data, provider: 'metals-api' };
}
