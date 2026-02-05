async function handler(req: any, res: any) {
  const apiKey = process.env.COMMODITYPRICE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing COMMODITYPRICE_API_KEY' });
    return;
  }

  try {
    const latest = await fetchCommodityLatest(apiKey);
    if (!latest || latest.success === false) {
      res.status(502).json({
        error: latest?.message || latest?.error?.info || latest?.error || 'Upstream error',
        provider: 'commoditypriceapi',
        code: latest?.code || latest?.error?.code || null
      });
      return;
    }

    const usdPerOz = extractLatestRate(latest);

    const fx = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!fx.ok) {
      res.status(502).json({ error: 'FX rates unavailable' });
      return;
    }
    const fxData = await fx.json();
    const fxRates = fxData?.rates || {};
    const usdToZar = numberOrNull(fxRates.ZAR);
    const usdToMzn = numberOrNull(fxRates.MZN);

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

    const monthlyHistory = await fetchMonthlyHistory(apiKey);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({
      timestamp: latest?.timestamp
        ? new Date(latest.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      usdPerOz,
      usdToZar,
      usdToMzn,
      monthlyHistory
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

async function fetchCommodityLatest(apiKey: string): Promise<any> {
  const url =
    `https://api.commoditypriceapi.com/v2/rates/latest` +
    `?symbols=XAU`;

  return fetchJson(url, apiKey);
}

async function fetchMonthlyHistory(apiKey: string): Promise<Array<{ date: string; price: number }>> {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);

  const url =
    `https://api.commoditypriceapi.com/v2/rates/timeseries` +
    `?symbols=XAU` +
    `&startDate=${toYmd(start)}` +
    `&endDate=${toYmd(end)}`;

  const data = await fetchJson(url, apiKey);
  if (!data || data.success === false) return [];

  return collapseToMonthly(extractTimeseriesRates(data));
}

function extractLatestRate(data: any): number | null {
  const rate = numberOrNull(data?.rates?.XAU);
  if (rate) return rate;
  const alt = numberOrNull(data?.rates?.xau);
  if (alt) return alt;
  return null;
}

function extractTimeseriesRates(data: any): Array<{ date: string; price: number }> {
  const rates = data?.rates || {};
  const points: Array<{ date: string; price: number }> = [];

  // Shape A: rates: { "2025-01-01": { "XAU": 2000 } }
  for (const [date, value] of Object.entries(rates)) {
    if (typeof value === 'number') {
      const price = numberOrNull(value);
      if (price) points.push({ date, price });
      continue;
    }
    if (value && typeof value === 'object') {
      const vAny: any = value;
      const price = numberOrNull(vAny.XAU ?? vAny.xau ?? vAny.close ?? vAny?.XAU?.close);
      if (price) points.push({ date, price });
    }
  }

  // Shape B: rates: { XAU: { "2025-01-01": 2000 } }
  if (points.length === 0 && rates?.XAU && typeof rates.XAU === 'object') {
    for (const [date, value] of Object.entries(rates.XAU)) {
      const price = numberOrNull(value);
      if (price) points.push({ date, price });
    }
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

function collapseToMonthly(points: Array<{ date: string; price: number }>): Array<{ date: string; price: number }> {
  const byMonth: Record<string, { date: string; price: number }> = {};
  for (const point of points) {
    const monthKey = point.date.slice(0, 7);
    const existing = byMonth[monthKey];
    if (!existing || point.date > existing.date) {
      byMonth[monthKey] = { date: point.date, price: Math.round(point.price * 100) / 100 };
    }
  }
  return Object.keys(byMonth)
    .sort()
    .map(key => byMonth[key]);
}

async function fetchJson(url: string, apiKey: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey
    }
  });
  const text = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    return { success: false, error: { info: text, code: response.status } };
  }
  if (!response.ok || data?.success === false) {
    return { success: false, error: data?.error || { info: text, code: response.status } };
  }
  return data;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
