const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

// ── Firma HMAC-SHA256 ───────────────────────────────────────────────────────
function firmar(params) {
  const str = Object.keys(params).sort().map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', process.env.FLOW_SECRET_KEY).update(str).digest('hex');
}

// ── Llamada GET a la API de Flow ────────────────────────────────────────────
function flowGet(path, params) {
  return new Promise((resolve, reject) => {
    params.s = firmar(params);
    const req = https.request(
      {
        hostname: 'www.flow.cl',
        path: `/api${path}?${querystring.stringify(params)}`,
        method: 'GET',
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error(data)); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// Flow devuelve al comprador a esta URL mediante POST tras el pago.
// Un archivo estático (gracias.html) no acepta POST y daría error 405, así que
// recibimos el POST acá y redirigimos el navegador (GET) a la página de gracias.
//
// Antes de redirigir consultamos el estado real del pago en Flow para pasarle a
// gracias.html los datos de la transacción (transaction_id y value) que GTM
// necesita para la conversión "Pago confirmado" con deduplicación en Google Ads.
// El transaction_id es el commerceOrder (nuestro ID de orden, estable y único).
module.exports = async function handler(req, res) {
  const token = req.body && req.body.token;

  // Sin token no podemos verificar nada: a gracias.html sin datos de conversión.
  if (!token) {
    return res.redirect(303, '/gracias.html');
  }

  try {
    // getStatus es la fuente de verdad: valida el pago con nuestras credenciales
    // y nos da el monto real cobrado (no confiamos en datos del navegador).
    const pago = await flowGet('/payment/getStatus', {
      apiKey: process.env.FLOW_API_KEY,
      token,
    });

    // Solo emitimos la conversión si el pago está realmente confirmado (status 2).
    if (pago.status === 2) {
      const params = querystring.stringify({
        transaction_id: pago.commerceOrder,
        value:          pago.amount,
        currency:       pago.currency || 'CLP',
      });
      return res.redirect(303, `/gracias.html?${params}`);
    }
  } catch (err) {
    console.error('Error consultando estado en retorno:', err.message);
  }

  // Pago no confirmado (o error): a gracias.html sin datos de conversión.
  return res.redirect(303, '/gracias.html');
};
