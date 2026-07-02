const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
const nodemailer = require('nodemailer');

// ── Links de descarga por producto ─────────────────────────────────────────
const ARCHIVOS = {
  'Kit Onboarding': [
    { nombre: 'Kit Onboarding (Documento 1)', url: 'https://docs.google.com/document/d/1m2RyzeKXd-HLXeAxE_GLg86XfhMCr-MdtP1weR7MXqk/export?format=pdf' },
    { nombre: 'Kit Onboarding (Documento 2)', url: 'https://docs.google.com/document/d/1UFEanUdSuJea0frYIsAMJu1Eiz-ugD6jIcOrHjB5p3s/export?format=pdf' },
  ],
  'Kit Liquidacion de Sueldo': [
    { nombre: 'Kit Liquidación de Sueldo', url: 'https://docs.google.com/spreadsheets/d/13j1qssGftiSiP-nwWj5eCX_tsMsLnH8Dqf7b9LBbvoo/export?format=xlsx' },
  ],
  'Kit Contratos de Trabajo': [
    { nombre: 'Kit Contratos de Trabajo (Documento 1)', url: 'https://docs.google.com/document/d/1GTiwdNjSaq2VCOhYJzK6hQJM8e_Su1WgxkeNh4BmoEo/export?format=pdf' },
    { nombre: 'Kit Contratos de Trabajo (Documento 2)', url: 'https://docs.google.com/document/d/1LXzc4QqGlxChvL5QeME4aJ39zeyy6ytOxo1wG2BeHSk/export?format=pdf' },
  ],
  'Control de Vacaciones y Ausencias': [
    { nombre: 'Control de Vacaciones y Ausencias', url: 'https://docs.google.com/spreadsheets/d/1ijg79j9xNol5L0e65LM-yAyVSCpbmv_zd8hoH8FPCpE/export?format=xlsx' },
  ],
  // Archivos .docx/.xlsx subidos directo a Drive (no convertidos a Google Docs),
  // por eso el link de descarga usa uc?export=download en vez de export?format=
  'Kit Reclutamiento y Seleccion': [
    { nombre: 'Kit Reclutamiento — 1. Definir y Publicar el Cargo', url: 'https://drive.google.com/uc?export=download&id=1J5vw-xjhP3xkVjblwLbrW9wfyl234zvR' },
    { nombre: 'Kit Reclutamiento — 2. Entrevistar y Cerrar', url: 'https://drive.google.com/uc?export=download&id=1Uax8BA1fbmk8DnCMRsPHB62bJiQBlaxZ' },
    { nombre: 'Kit Reclutamiento — 3. Matriz Comparadora de Candidatos', url: 'https://drive.google.com/uc?export=download&id=1Tb8gNQtgChhIeaVLkYFBq1JEGJ_bqWMm' },
  ],
};
// Pack Sueldos y Personal: el día a día administrativo (upsell del Kit Liquidación)
ARCHIVOS['Pack Sueldos y Personal'] = [
  ...ARCHIVOS['Kit Liquidacion de Sueldo'],
  ...ARCHIVOS['Control de Vacaciones y Ausencias'],
];
// Pack Inicio Pro: recluta, recibe y paga sueldos (sin contratos ni vacaciones)
ARCHIVOS['Pack Inicio Pro'] = [
  ...ARCHIVOS['Kit Reclutamiento y Seleccion'],
  ...ARCHIVOS['Kit Onboarding'],
  ...ARCHIVOS['Kit Liquidacion de Sueldo'],
];
// Pack Contratacion: el proceso completo de incorporar a alguien
ARCHIVOS['Pack Contratacion'] = [
  ...ARCHIVOS['Kit Reclutamiento y Seleccion'],
  ...ARCHIVOS['Kit Contratos de Trabajo'],
  ...ARCHIVOS['Kit Onboarding'],
];
ARCHIVOS['Pack Completo'] = [
  ...ARCHIVOS['Kit Reclutamiento y Seleccion'],
  ...ARCHIVOS['Kit Contratos de Trabajo'],
  ...ARCHIVOS['Kit Onboarding'],
  ...ARCHIVOS['Kit Liquidacion de Sueldo'],
  ...ARCHIVOS['Control de Vacaciones y Ausencias'],
];

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

// ── Envío de correo vía Zoho SMTP ───────────────────────────────────────────
async function enviarCorreo(destinatario, producto, archivos) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_USER,
      pass: process.env.ZOHO_PASS,
    },
  });

  const linksHtml = archivos
    .map(a => `<p><a href="${a.url}" style="color:#5C6E2E;font-weight:bold;">📥 ${a.nombre}</a></p>`)
    .join('');

  await transporter.sendMail({
    from: `"KitLaboral" <${process.env.ZOHO_USER}>`,
    to: destinatario,
    subject: `Tu ${producto} está listo para descargar`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#5C6E2E;margin-bottom:8px;">¡Tu compra está lista!</h2>
        <p style="margin-bottom:24px;">Gracias por tu compra de <strong>${producto}</strong>. Haz clic en los links para descargar tus archivos:</p>
        <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin-bottom:24px;">
          ${linksHtml}
        </div>
        <p style="color:#666;font-size:14px;">Los links son de descarga directa. Si tienes algún problema, escríbenos a <a href="mailto:contacto@kitlaboral.cl">contacto@kitlaboral.cl</a> o por WhatsApp.</p>
        <p style="color:#5C6E2E;font-weight:bold;margin-top:24px;">Equipo KitLaboral</p>
      </div>
    `,
  });
}

// ── Handler principal ───────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  const token = req.body && req.body.token;
  if (!token) {
    return res.status(400).send('Falta token');
  }

  try {
    // 1. Consultar el estado real del pago en Flow (autenticado con nuestras
    //    credenciales — es la fuente de verdad y valida que el aviso es legítimo)
    const pago = await flowGet('/payment/getStatus', {
      apiKey: process.env.FLOW_API_KEY,
      token,
    });

    // 2. Solo procesar si el pago está confirmado (status 2)
    if (pago.status !== 2) {
      return res.status(200).send('OK');
    }

    const emailCliente = pago.payer;
    const producto = pago.subject;
    const archivos = ARCHIVOS[producto];

    if (!archivos) {
      console.error('Producto desconocido en pago confirmado:', producto);
      return res.status(200).send('OK');
    }

    // 4. Enviar correo con los links de descarga
    await enviarCorreo(emailCliente, producto, archivos);
    console.log(`✅ Correo enviado a ${emailCliente} — ${producto}`);

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Error procesando webhook:', err.message);
    return res.status(500).send('Error interno');
  }
};
