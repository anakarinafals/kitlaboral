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
    urlConfirmation: 'https://kitlaboral.cl/api/confirmar-pago',
    urlReturn:       'https://kitlaboral.cl/gracias.html',
  };

  const str = Object.keys(params).sort().map(k => k + params[k]).join('');

  const isValidHex = /^[0-9a-fA-F]+$/.test(SECRET_KEY) && SECRET_KEY.length % 2 === 0;

  function makeBody(useHexKey) {
    const p = { ...params };
    const key = useHexKey ? Buffer.from(SECRET_KEY, 'hex') : SECRET_KEY;
    p.sign = crypto.createHmac('sha256', key).update(str).digest('hex');
    return querystring.stringify(p);
  }

  function callFlow(body) {
    return new Promise(resolve => {
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

  const [stringKey, hexKey] = await Promise.all([
    callFlow(makeBody(false)),
    isValidHex ? callFlow(makeBody(true)) : Promise.resolve({ status: 0, body: 'no es hex válido' }),
  ]);

  return res.status(200).json({
    secretKeyIsValidHex: isValidHex,
    conClaveString: { httpStatus: stringKey.status, flowResponse: stringKey.body },
    conClaveHex:    { httpStatus: hexKey.status,    flowResponse: hexKey.body },
  });
};
