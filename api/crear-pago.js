const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const PRODUCTOS = {
  'pack-completo':      { subject: 'Pack Completo',                     amount: 24990 },
  'pack-contratacion':  { subject: 'Pack Contratacion',                 amount: 19990 },
  'pack-sueldos':       { subject: 'Pack Sueldos y Personal',           amount: 14990 },
  'pack-inicio-pro':    { subject: 'Pack Inicio Pro',                   amount: 19990 },
  'kit-onboarding':     { subject: 'Kit Onboarding',                    amount: 9900 },
  'kit-liquidacion':    { subject: 'Kit Liquidacion de Sueldo',         amount: 9900 },
  'kit-contratos':      { subject: 'Kit Contratos de Trabajo',          amount: 9900 },
  'kit-vacaciones':     { subject: 'Control de Vacaciones y Ausencias', amount: 9900 },
  'kit-reclutamiento':  { subject: 'Kit Reclutamiento y Seleccion',     amount: 9900 },
  'sistema-rrhh':       { subject: 'Sistema RRHH KitLaboral',           amount: 27990 },
};

// Cupones de descuento. montoFijo = deja el producto en ese precio.
// porcentaje = descuenta ese % del precio original.
// Para agregar uno: ej. LANZAMIENTO: { porcentaje: 20 }
const CUPONES = {};

function firmar(params) {
  const str = Object.keys(params).sort().map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', process.env.FLOW_SECRET_KEY).update(str).digest('hex');
}

function flowPost(path, params) {
  return new Promise((resolve, reject) => {
    params.s = firmar(params);
    const body = querystring.stringify(params);
    const req = https.request(
      {
        hostname: 'www.flow.cl',
        path: `/api${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
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
    req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  const producto = PRODUCTOS[req.query.producto];
  if (!producto) {
    return res.status(400).json({ error: 'Producto no válido.' });
  }

  const email = (req.query.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Ingresa un correo válido.' });
  }

  // Aplicar cupón si viene uno (el monto se calcula acá en el servidor, seguro)
  let amount = producto.amount;
  const cupon = (req.query.cupon || '').trim().toUpperCase();
  if (cupon) {
    const desc = CUPONES[cupon];
    if (!desc) {
      return res.status(400).json({ error: 'Cupón no válido.' });
    }
    amount = desc.montoFijo != null
      ? desc.montoFijo
      : Math.round(producto.amount * (100 - desc.porcentaje) / 100);
  }

  const base = `https://${req.headers.host}`;

  try {
    const pago = await flowPost('/payment/create', {
      apiKey:          process.env.FLOW_API_KEY,
      commerceOrder:   `KL-${Date.now()}`,
      subject:         producto.subject,
      amount,
      currency:        'CLP',
      email,
      urlConfirmation: `${base}/api/confirmar-pago`,
      urlReturn:       `${base}/api/retorno`,
    });

    if (pago.url && pago.token) {
      return res.status(200).json({ url: `${pago.url}?token=${pago.token}` });
    }

    console.error('Respuesta Flow inesperada:', pago);
    // 1620 = Flow considera el correo inválido o no entregable.
    if (pago.code === 1620) {
      return res.status(400).json({
        error: 'Ese correo no parece válido o no puede recibir mensajes. Revísalo e inténtalo de nuevo.',
      });
    }
    return res.status(502).json({ error: 'No pudimos iniciar el pago. Intenta nuevamente en unos minutos.' });
  } catch (err) {
    console.error('Error Flow:', err.message);
    return res.status(500).json({ error: 'No pudimos conectar con el sistema de pago. Intenta nuevamente en unos minutos.' });
  }
};
