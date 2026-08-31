// 07_anon_auth_vs_correlation.js
// -----------------------------------------------------------------------------
// CONCEPTO: Autenticación anónima (token fijo) vs Correlación real
//
// Descubrimos vía DevTools que QuickPizza tiene DOS flujos de auth:
//
//   A) POST /api/users/token/authenticate  (sin body)
//      -> Siempre regresa el mismo usuario "default" con el mismo token fijo
//         "abcdef0123456789". Es una sesión de invitado/anónima.
//         NO hay nada que correlacionar aquí: el valor es constante.
//
//   B) POST /api/users  ->  POST /api/users/token/login
//      -> Requiere que TÚ generes un username/password único, y el token
//         que regresa es distinto en cada corrida. AQUÍ SÍ hay correlación
//         real: debes capturar el token de la respuesta y reenviarlo.
//
// Este script corre ambos flujos para que compares la diferencia en
// consola y entiendas cuándo un dato necesita correlación y cuándo no.
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

const BASE_URL = 'https://quickpizza.grafana.com';

function randomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += charset[Math.floor(Math.random() * charset.length)];
  }
  return res;
}

export default function () {
  // ---------------------------------------------------------------------
  // FLUJO A: Auth anónima — sin correlación, el token siempre es el mismo
  // ---------------------------------------------------------------------
  group('A. Auth con usuario "default" precargado (credenciales conocidas)', function () {
    // Descubrimos en la propia UI de login que existe un usuario de fabrica:
    // username: default / password: 12345678
    // Probemos autenticar con ese usuario usando el mismo endpoint de login
    // que usamos para usuarios registrados por nosotros.
    const res = http.post(
      `${BASE_URL}/api/users/token/login`,
      JSON.stringify({ username: 'default', password: '12345678' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log(`[Default] status: ${res.status}`);
    console.log(`[Default] body: ${res.body}`);

    check(res, { 'status 200': (r) => r.status === 200 });

    const defaultToken = res.json('token');
    const defaultUser = res.json('username');

    console.log(`[Default] usuario: ${defaultUser} | token: ${defaultToken}`);
    // Si esto funciona, el token deberia salir como "abcdef0123456789"
    // (el mismo que vimos en DevTools) - confirmando que es un usuario
    // fijo, no un mecanismo "anonimo" separado.
  });

  // ---------------------------------------------------------------------
  // FLUJO B: Auth real — AQUI SI hay correlacion genuina
  // ---------------------------------------------------------------------
  group('B. Auth real (token dinamico, con correlacion)', function () {
    const username = `${randomString(10)}@example.com`;
    const password = 'Testing123!';
    const tokenHard = 'abcdef0123456789';
    // Paso 1: registrar usuario nuevo
    const registerRes = http.post(
      `${BASE_URL}/api/users`,
      JSON.stringify({ username, password }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(registerRes, { 'usuario creado (201)': (r) => r.status === 201 });

    // Paso 2: login y CORRELACION del token real
    const loginRes = http.post(
      `${BASE_URL}/api/users/token/login`,
      JSON.stringify({ username, password }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(loginRes, { 'login 200': (r) => r.status === 200 });

    // *** Esto es correlacion real: el valor CAMBIA cada vez que corres
    // el script, porque depende del usuario que acabas de crear. ***
    const realToken = loginRes.json('token');

    console.log(`[Real] usuario: ${username} | token: ${realToken}`);

    //check(realToken, {'${realtoken} token real es distinto al anonimo': (t) => t !== 'abcdef0123456789',});
    check(realToken, 
        {[`Token: ${realToken} - es distinto al anonimo: ${tokenHard}`]: (t) => t !== tokenHard,});

});
}
