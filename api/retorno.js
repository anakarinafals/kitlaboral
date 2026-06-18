// Flow devuelve al comprador a esta URL mediante POST tras el pago.
// Un archivo estático (gracias.html) no acepta POST y daría error 405,
// así que recibimos el POST acá y redirigimos al navegador (GET) a la
// página de gracias.
module.exports = async function handler(req, res) {
  return res.redirect(303, '/gracias.html');
};
