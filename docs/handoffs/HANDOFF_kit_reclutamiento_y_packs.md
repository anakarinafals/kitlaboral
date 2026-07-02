# Handoff — 2026-07-02 · Kit Reclutamiento, packs y precios nuevos

Sesión de trabajo con Claude Code. Todo lo descrito está **en vivo en kitlaboral.cl** (último merge: `3745448`).

## Qué se hizo hoy

### 1. Nuevo producto: Kit Reclutamiento y Selección ($10.990)
- **3 archivos**: `01_Definir_y_Publicar_el_Cargo.docx`, `02_Entrevistar_y_Cerrar.docx`, `03_Matriz_Comparadora_Candidatos.xlsx`
- Generados con python-docx/openpyxl, estilo corporativo (azul `#1A4A8A`, gris `#2A3142`, dorado `#C9A961`)
- **Las versiones finales (editadas a mano por Ana) viven en su Google Drive**, carpeta `1f6Aew2ubyvlOz0fGNASqzpKBqrI3og14`, compartidas como "cualquiera con el enlace"
- Los .docx/.xlsx originales quedaron en `productos/kit-reclutamiento/` como respaldo — **NO regenerar ni pisar los del Drive**
- Entrega vía `uc?export=download&id=` (son archivos Office directos, no Google Docs); los 3 links probados: descargan sin login
- Contenido: guía del proceso (7 pasos), descriptor de cargo, 3 modelos de aviso, sección legal (Art. 2 CdT, Ley 21.015, Ley 19.628), pauta de entrevista por competencias (13 preguntas), guion de referencias, carta de oferta, correo de rechazo, matriz Excel con ponderaciones + ranking + semáforo

### 2. Catálogo y precios reestructurados
| Producto | ID | Precio |
|---|---|---|
| Los 5 kits individuales (precio único) | `kit-onboarding`, `kit-liquidacion`, `kit-contratos`, `kit-vacaciones`, `kit-reclutamiento` | $10.990 |
| Pack Sueldos y Personal (Liquidación + Vacaciones) | `pack-sueldos` | $15.990 |
| Pack Contratación (Reclutamiento + Contratos + Onboarding) | `pack-contratacion` | $20.990 |
| Pack Inicio Pro (Reclutamiento + Onboarding + Liquidación) | `pack-inicio-pro` | $20.990 |
| Pack Completo (5 kits) ⭐ | `pack-completo` | $25.990 |

**Decisiones de precio (de Ana):**
- Todos los precios subieron +$1.000 para cubrir la comisión de Flow
- Después unificó todos los kits individuales a $10.990
- Tope máximo del completo: $25.990 — NO subirlo (el tráfico llega anclado al precio del Kit Liquidación)
- Resultado: escalera pareja de **+$5.000 por peldaño** ($10.990 → $15.990 → $20.990 → $25.990), sin arbitrajes posibles

**Contexto comercial clave:** el Kit Liquidación es el más buscado en Google Ads ("plantilla de liquidación de sueldos") y el más vendido → es la puerta de entrada del embudo. El objetivo de Ana es **empujar el Pack Completo**.

### 3. Maquinaria de upsell hacia el Pack Completo
- `checkout.html`: recuadro "⭐ Por $X más te llevas los 5 kits" en todo producto ≠ completo, con cambio en un clic. Evento GTM: `upgrade_pack_completo` (campo `desde` = producto de origen)
- Landing: nudges "5 kits por solo $5.000 más" bajo los 2 packs de 3 kits (`nudge_pack_contratacion`, `nudge_pack_inicio_pro`)
- Landing: upsell del Pack Sueldos en la tarjeta del Kit Liquidación (`upsell_liquidacion`)

## Archivos tocados
- `api/crear-pago.js` — objeto PRODUCTOS (fuente de verdad de precios)
- `api/confirmar-pago.js` — objeto ARCHIVOS (links de entrega por subject; los packs se componen con spread)
- `checkout.html` — espejo de PRODUCTOS + upsell
- `index.html` — tarjeta kit 05, sección packs (3 columnas), precios, ahorros, nudges, CTA final
- `productos/kit-reclutamiento/` — respaldo de los 3 archivos del kit

**Regla de coherencia:** el `subject` en crear-pago.js debe existir como key en ARCHIVOS de confirmar-pago.js (sin tildes en los subjects), y el precio de checkout.html debe calzar con crear-pago.js. Hay un cross-check con osascript/JXA en el historial de la sesión (no hay Node local; Vercel lo corre en la nube).

## Pendientes
1. **Compra de prueba real** del Kit Reclutamiento para validar el correo de entrega punta a punta (único tramo no probado — requiere pago real en Flow)
2. **Avisar al esposo de Ana** (maneja Google Ads): actualizar precios en textos de anuncios; puede usar "Todos los kits a $10.990" como mensaje transversal
3. **En ~1 mes, revisar en GTM/Ads**: Pack Contratación vs Pack Inicio Pro comparten 2 de 3 kits — si uno casi no convierte, eliminarlo para simplificar
4. Menor: identidad git autogenerada (`anakarinafals@MacBook-Air-de-Ana.local`) — configurar `git config --global user.email` si molesta
5. Diferido de antes (hasta >50 ventas): entrega 100% privada para no exponer la cuenta de Drive de la dueña

## Commits del día (main)
- `bedd461` — kit reclutamiento + packs Sueldos/Contratación + precios +$1.000
- `3f44c7e` — Pack Inicio Pro
- `2ee7817` — kits unificados a $10.990
- `3745448` — upsell al Pack Completo en checkout y landing
