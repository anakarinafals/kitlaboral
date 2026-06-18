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

  function callFlow(hostname) {
    return new Promise(resolve => {
      const req2 = https.request(
        {
          hostname,
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
          r.on('end', () => {
            try { resolve({ status: r.statusCode, body: JSON.parse(data) }); }
            catch { resolve({ status: r.statusCode, body: data }); }
          });
        }
      );
      req2.on('error', e => resolve({ status: 0, body: e.message }));
      req2.write(body);
      req2.end();
    });
  }

  const [prod, sandbox] = await Promise.all([
    callFlow('www.flow.cl'),
    callFlow('sandbox.flow.cl'),
  ]);

  return res.status(200).json({
    apiKeyLen: API_KEY.length,
    secretKeyLen: SECRET_KEY.length,
    apiKeyHasWhitespace: /\s/.test(API_KEY),
    secretKeyHasWhitespace: /\s/.test(SECRET_KEY),
    produccion: { httpStatus: prod.status, flowResponse: prod.body },
    sandbox:    { httpStatus: sandbox.status, flowResponse: sandbox.body },
  });
};
