async function handler(req: any, res: any) {
  const apiKey = process.env.METALAPI_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing METALAPI_KEY' });
    return;
  }

  try {
    const latest = await fetchMetalApiLatest(apiKey);
    if (!latest || latest.success === false) {
      res.status(502).json({
        error: latest?.error?.info || latest?.error?.message || 'Upstream error',
        provider: 'metalapi',
        code: latest?.error?.code || null
      });
      return;
    }

    const rates = latest?.rates || {};
    const usdPerOz = resolveUsdPerOz(rates);
    let usdToZar = numberOrNull(rates.USDZAR ?? rates.ZAR);
    let usdToMzn = numberOrNull(rates.USDMZN ?? rates.MZN);

    if (!usdToZar || !usdToMzn) {
      const fx = await fetch('https://open.er-api.com/v6/latest/USD');
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

    let monthlyHistory = await fetchMonthlyTimeseries(apiKey);
    if (monthlyHistory.length < 2) {
      monthlyHistory = await fetchMonthlyHistorical(apiKey);
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
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

function resolveUsdPerOz(rates: any): number | null {
  const direct = numberOrNull(rates.USDXAU);
  if (direct) return direct;
  const xau = numberOrNull(rates.XAU);
  if (!xau) return null;
  // If XAU is oz per USD, invert. If already USD per oz, leave.
  return xau < 1 ? 1 / xau : xau;
}

async function fetchMetalApiLatest(apiKey: string): Promise<any> {
  const url =
    `https://metalapi.com/api/v1/latest` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&base=USD&symbols=XAU,USDXAU,ZAR,MZN,USDZAR,USDMZN`;

  return fetchJson(url);
}

async function fetchMonthlyTimeseries(apiKey: string): Promise<Array<{ date: string; price: number }>> {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);

  const url =
    `https://metalapi.com/api/v1/timeseries` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&start_date=${toYmd(start)}` +
    `&end_date=${toYmd(end)}` +
    `&base=USD&symbols=XAU,USDXAU`;

  const data = await fetchJson(url);
  if (!data || data.success === false) return [];

  const ratesByDate = data?.rates || {};
  const byMonth: Record<string, { date: string; price: number }> = {};

  for (const [date, rates] of Object.entries(ratesByDate)) {
    const price = resolveUsdPerOz(rates as any);
    if (!price) continue;
    const monthKey = String(date).slice(0, 7);
    const existing = byMonth[monthKey];
    if (!existing || String(date) > existing.date) {
      byMonth[monthKey] = { date: String(date), price: Math.round(price * 100) / 100 };
    }
  }

  const months = Object.keys(byMonth).sort();
  return months.map(m => byMonth[m]);
}

async function fetchMonthlyHistorical(apiKey: string): Promise<Array<{ date: string; price: number }>> {
  const end = new Date();
  const months: Array<{ date: string; price: number }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i + 1, 0); // last day of month
    const url =
      `https://metalapi.com/api/v1/historical/${toYmd(d)}` +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&base=USD&symbols=XAU,USDXAU`;

    const data = await fetchJson(url);
    if (!data || data.success === false) continue;
    const price = resolveUsdPerOz(data?.rates || {});
    if (!price) continue;
    months.push({ date: toYmd(d), price: Math.round(price * 100) / 100 });
  }

  return months;
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url);
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
