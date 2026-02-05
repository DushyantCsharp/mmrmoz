async function handler(req: any, res: any) {
  const apiKey = process.env.METALPRICE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing METALPRICE_API_KEY' });
    return;
  }

  const url =
    `https://api.metalpriceapi.com/v1/latest` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&base=USD&currencies=XAU,ZAR,MZN`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).json({ error: text || 'Upstream error' });
      return;
    }

    const data = await response.json();
    const rates = data?.rates || {};
    const xauRate = Number(rates.XAU);
    const usdToZar = Number(rates.ZAR);
    const usdToMzn = Number(rates.MZN);

    if (!xauRate || !usdToZar || !usdToMzn) {
      res.status(502).json({ error: 'Invalid rates from upstream' });
      return;
    }

    // MetalpriceAPI returns rates relative to base (USD).
    // For metals, XAU is typically oz per USD, so invert to get USD/oz.
    const usdPerOz = xauRate < 1 ? 1 / xauRate : xauRate;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({
      timestamp: data?.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
      usdPerOz,
      usdToZar,
      usdToMzn
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}

module.exports = handler;
