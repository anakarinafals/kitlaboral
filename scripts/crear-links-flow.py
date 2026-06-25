import hmac
import hashlib
import urllib.parse
import urllib.request
import json

API_KEY     = '4F31F915-7D4A-4274-92DB-863E800ELED4'
SECRET_KEY  = '72302f7f169a8c33ef4701b2ce9b712061394fb6'
WEBHOOK_URL = 'https://hook.us2.make.com/onvlhlxvefegwxdnndpc1uj8xohm4msr'
SUCCESS_URL = 'https://www.kitlaboral.cl/gracias.html'

productos = [
    {'subject': 'Kit Onboarding',  'amount': 21990},
    {'subject': 'Kit Liquidacion', 'amount': 35990},
    {'subject': 'Kit Contratos',   'amount': 45990},
    {'subject': 'Pack Completo',   'amount': 87990},
]

def firmar(params):
    cadena = ''.join(k + str(params[k]) for k in sorted(params.keys()))
    return hmac.new(SECRET_KEY.encode('utf-8'), cadena.encode('utf-8'), hashlib.sha256).hexdigest()

def crear_link(producto):
    params = {
        'apiKey':          API_KEY,
        'subject':         producto['subject'],
        'amount':          producto['amount'],
        'urlConfirmacion': WEBHOOK_URL,
        'urlReturn':       SUCCESS_URL,
    }
    params['sign'] = firmar(params)

    data = urllib.parse.urlencode(params).encode('utf-8')
    req = urllib.request.Request(
        'https://www.flow.cl/api/paymentLink/create',
        data=data,
        method='POST'
    )
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise Exception(f"HTTP {e.code}: {body}")

print('Creando links de pago con webhook...\n')
for p in productos:
    try:
        resultado = crear_link(p)
        if 'url' in resultado:
            print(f"✅ {p['subject']}")
            print(f"   {resultado['url']}\n")
        else:
            print(f"❌ {p['subject']}: {resultado}\n")
    except Exception as e:
        print(f"❌ {p['subject']}: {e}\n")
