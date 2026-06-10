# HANDOFF — Automatización entrega de productos + ajustes landing
> Sesiones: 2026-06-02 y 2026-06-08/09

---

## ✅ LO QUE SE COMPLETÓ

### Sesión 2026-06-02
- **SPF, DKIM, DMARC** configurados en Cloudflare para `kitlaboral.cl` → correos llegan a bandeja de entrada, no spam
- **Nombre remitente** cambiado a `KitLaboral` en Zoho Mail
- **Primer post de LinkedIn** publicado (texto del handoff anterior)
- **Segundo post de LinkedIn** publicado (enfocado en los 3 productos)

### Sesión 2026-06-08
- **Precios actualizados** en la landing:
  - Pack Completo: $15.990 (antes $87.990)
  - Kit Contratos: $9.990 (antes $45.990)
  - Kit Liquidación: $8.990 (antes $35.990)
  - Kit Onboarding: $6.990 (antes $21.990)
  - Ahorro pack: $9.980 (antes $15.980)

- **Serverless Functions creadas en `/api`:**
  - `api/crear-pago.js` — recibe `?producto=xxx`, llama a Flow `payment/create` con `urlConfirmacion` apuntando a la función de confirmación, redirige al cliente a pagar
  - `api/confirmar-pago.js` — recibe webhook de Flow, verifica firma HMAC-SHA256 (parámetro `s`), consulta `payment/getStatus`, envía correo de entrega vía Zoho SMTP

- **Botones de compra en index.html** cambiados de links directos de Flow a `/api/crear-pago?producto=xxx`

- **Variables de entorno configuradas en Vercel:**
  - `FLOW_API_KEY` ✅
  - `FLOW_SECRET_KEY` ✅
  - `ZOHO_USER` = contacto@kitlaboral.cl ✅
  - `ZOHO_PASS` ✅

---

## 🔴 PROBLEMA PENDIENTE — Error 500 en /api/crear-pago

Al hacer clic en un botón de compra, el servidor responde `500 Error al conectar con Flow`.

**Log de Vercel muestra:**
```
GET 500 www.kitlaboral.cl /api/crear-pago
(node:4) [DEP0169] DeprecationWarning: 'url.parse()' behavi...
```

El `DEP0169` es solo un warning de deprecación de Node.js (no es el error). El error real está truncado en el log — hay que expandirlo para ver la causa completa.

**Hipótesis más probable:** El API Key de Flow tiene una `L` en `863E800ELED4` que podría estar causando error 107 ("The parameters are not signed") — el mismo problema que se tuvo en sesiones anteriores al intentar usar la API de Flow.

**Lo que hay que hacer en la próxima sesión:**
1. En Vercel → Logs → clic en la línea roja del error → copiar el mensaje completo
2. Si el error dice `code: 107` → el problema es el API Key de Flow
   - Ir a flow.cl → Configuración → Datos de integración → **Generar nueva clave**
   - Actualizar `FLOW_API_KEY` y `FLOW_SECRET_KEY` en Vercel Environment Variables
   - Hacer un nuevo deploy (o esperar que Vercel lo tome)
3. Si el error es otro → analizar y corregir

---

## 📁 ARCHIVOS RELEVANTES

```
kit-laboral/
├── index.html              # Landing — botones apuntan a /api/crear-pago
├── gracias.html            # Página de éxito post-pago
├── package.json            # Dependencia: nodemailer
├── api/
│   ├── crear-pago.js       # Crea pago en Flow, redirige al cliente
│   └── confirmar-pago.js   # Webhook Flow → verifica firma → envía email
└── docs/handoffs/
    ├── HANDOFF_sesion2.md  # Handoff sesión anterior
    └── HANDOFF_automatizacion_entrega.md  # Este archivo
```

---

## 🔗 LINKS DE DESCARGA POR PRODUCTO (Google Drive)

Ya configurados en `confirmar-pago.js`. Los archivos deben estar compartidos como "cualquiera con el link puede ver":

**Kit Onboarding ($6.990):**
- Doc 1: `1m2RyzeKXd-HLXeAxE_GLg86XfhMCr-MdtP1weR7MXqk`
- Doc 2: `1UFEanUdSuJea0frYIsAMJu1Eiz-ugD6jIcOrHjB5p3s`

**Kit Liquidación ($8.990):**
- Sheet: `13j1qssGftiSiP-nwWj5eCX_tsMsLnH8Dqf7b9LBbvoo`

**Kit Contratos ($9.990):**
- Doc 1: `1GTiwdNjSaq2VCOhYJzK6hQJM8e_Su1WgxkeNh4BmoEo`
- Doc 2: `1LXzc4QqGlxChvL5QeME4aJ39zeyy6ytOxo1wG2BeHSk`

**Pack Completo ($15.990):** todos los anteriores.

---

## 🔧 ESTADO TÉCNICO ACTUAL

| Componente | Estado |
|---|---|
| Landing `www.kitlaboral.cl` | ✅ Activa con nuevos precios |
| Correo `contacto@kitlaboral.cl` | ✅ Zoho Mail, SPF/DKIM/DMARC OK |
| Flow (pagos) | ✅ Cuenta configurada |
| Serverless functions | ✅ Desplegadas en Vercel |
| Flujo completo de compra | 🔴 Error 500 — API Key Flow pendiente de verificar |
| Variables de entorno Vercel | ✅ 4 variables configuradas |
| GitHub | ✅ Commit `f47123a` en main |
| Make.com | ⏸ Escenario creado pero abandonado en favor de serverless |

---

## ⏭ PRÓXIMOS PASOS

1. **Resolver error 500** (ver sección arriba)
2. **Verificar flujo completo**: compra de prueba → correo llega con links → links descargan correctamente
3. **Verificar que los archivos de Google Drive** estén compartidos como "cualquiera con el link"
4. **Planificar posts LinkedIn de junio** (quedó pendiente)
5. **MercadoLibre** — subir los kits como productos digitales
6. **Instagram Reels** con Canva

---

**Última actualización:** 2026-06-09  
**Estado:** 🟡 Infraestructura lista, error en API Flow pendiente de resolver
