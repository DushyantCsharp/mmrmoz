async function handler(req: any, res: any) {
  const apiKey = process.env.COMMODITYPRICE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing COMMODITYPRICE_API_KEY' });
    return;
  }

  try {
    const usd = await fetchCommodityPrice(apiKey, 'USD');
    if (!usd || usd.success === false) {
      res.status(502).json({
        error: usd?.message || usd?.error || 'Upstream error',
        provider: 'commoditypriceapi',
        code: usd?.code || null
      });
      return;
    }

    const usdPerOz = numberOrNull(usd?.rates?.XAU?.rate ?? usd?.rates?.XAU);

    // Try commoditypriceapi quotes for ZAR/MZN (plan-dependent)
    const zarQuote = await fetchCommodityPrice(apiKey, 'ZAR');
    const mznQuote = await fetchCommodityPrice(apiKey, 'MZN');
    const zarPerOz = numberOrNull(zarQuote?.rates?.XAU?.rate ?? zarQuote?.rates?.XAU);
    const mznPerOz = numberOrNull(mznQuote?.rates?.XAU?.rate ?? mznQuote?.rates?.XAU);

    let usdToZar = zarPerOz && usdPerOz ? zarPerOz / usdPerOz : null;
    let usdToMzn = mznPerOz && usdPerOz ? mznPerOz / usdPerOz : null;

    if (!usdToZar || !usdToMzn) {
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
      timestamp: usd?.timestamp ? new Date(usd.timestamp * 1000).toISOString() : new Date().toISOString(),
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

async function fetchCommodityPrice(apiKey: string, quote: string): Promise<any> {
  const url =
    `https://api.commoditypriceapi.com/v2/latest` +
    `?apiKey=${encodeURIComponent(apiKey)}` +
    `&symbols=XAU` +
    `&quote=${encodeURIComponent(quote)}`;

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
    return { success: false, error: text, code: response.status };
  }

  if (!response.ok || data?.success === false) {
    return { success: false, ...data, code: data?.code || response.status };
  }

  return data;
}
