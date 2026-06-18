const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

module.exports = async function handler(req, res) {
  const API_KEY = process.env.FLOW_API_KEY;
  const SECRET_KEY = process.env.FLOW_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return res.status(200).json({
      ok: false,
      error: 'Variables de entorno no encontradas',
      FLOW_API_KEY: API_KEY ? 'presente' : 'FALTA',
      FLOW_SECRET_KEY: SECRET_KEY ? 'presente' : 'FALTA',
    });
  }

  const params = {
    apiKey:          API_KEY,
    commerceOrder:   `TEST-${Date.now()}`,
    subject:         'Test KitLaboral',
    amount:          1000,
    currency:        'CLP',
    urlConfirmacion: 'https://kitlaboral.cl/api/confirmar-pago',
    urlReturn:       'https://kitlaboral.cl/gracias.html',
  };

  const str = Object.keys(params).sort().map(k => k + params[k]).join('');
  params.sign = crypto.createHmac('sha256', SECRET_KEY).update(str).digest('hex');

  const body = querystring.stringify(params);

  const result = await new Promise(resolve => {
    const req2 = https.request(
      {
        hostname: 'www.flow.cl',
        path: '/api/payment/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      r => {
        let data = '';
        r.on('data', c => (data += c));
        r.on('end', () => resolve({ status: r.statusCode, body: data }));
      }
    );
    req2.on('error', e => resolve({ status: 0, body: e.message }));
    req2.write(body);
    req2.end();
  });

  let flowResponse;
  try { flowResponse = JSON.parse(result.body); }
  catch { flowResponse = result.body; }

  return res.status(200).json({
    ok: result.status === 200 && flowResponse.url,
    httpStatus: result.status,
    flowResponse,
    apiKeyPreview: API_KEY.slice(0, 8) + '...',
    secretKeyPreview: SECRET_KEY.slice(0, 6) + '...',
  });
};
