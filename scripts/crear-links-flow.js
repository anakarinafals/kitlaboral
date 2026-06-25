const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

// ── Configura estas variables ──────────────────────────────────────────────
const API_KEY      = '4F31F915-7D4A-4274-92DB-863E800ELED4';
const SECRET_KEY   = '72302f7f169a8c33ef4701b2ce9b712061394fb6';
const WEBHOOK_URL  = 'https://hook.us2.make.com/onvlhlxvefegwxdnndpc1uj8xohm4msr';  // la URL del webhook que generó Make
const SUCCESS_URL  = 'https://www.kitlaboral.cl/gracias.html';
// ──────────────────────────────────────────────────────────────────────────

const productos = [
  { subject: 'Kit Onboarding',    amount: 21990 },
  { subject: 'Kit Liquidación',   amount: 35990 },
  { subject: 'Kit Contratos',     amount: 45990 },
  { subject: 'Pack Completo',     amount: 87990 },
];

function firmar(params) {
  const cadena = Object.keys(params).sort().map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', SECRET_KEY).update(cadena).digest('hex');
}

function crearLink(producto) {
  return new Promise((resolve, reject) => {
    const params = {
      apiKey:           API_KEY,
      subject:          producto.subject,
      amount:           producto.amount,
      currency:         'CLP',
      urlConfirmacion:  WEBHOOK_URL,
      urlReturn:        SUCCESS_URL,
    };
    params.sign = firmar(params);

    const body = querystring.stringify(params);

    const options = {
      hostname: 'www.flow.cl',
      path:     '/api/paymentLink/create',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.url) {
            resolve({ producto: producto.subject, url: json.url });
          } else {
            reject(new Error(`Error en ${producto.subject}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Respuesta inválida para ${producto.subject}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Creando links de pago con webhook...\n');
  for (const producto of productos) {
    try {
      const resultado = await crearLink(producto);
      console.log(`✅ ${resultado.producto}`);
      console.log(`   ${resultado.url}\n`);
    } catch (err) {
      console.log(`❌ ${err.message}\n`);
    }
  }
}

main();
