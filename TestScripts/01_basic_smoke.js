// 01_basic_smoke.js
// -----------------------------------------------------------------------------
// CONCEPTO: Smoke Test básico
// Objetivo: validar que la app responde y que el endpoint principal funciona
// antes de correr algo más pesado. Equivalente a un "single thread run" en
// LoadRunner/JMeter antes de escalar VUs.
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep } from 'k6';

// options: define cómo se ejecuta el test (aquí, 1 VU, 1 iteración)
export const options = {
  vus: 1,
  iterations: 2,
};

const BASE_URL = 'https://quickpizza.grafana.com';

export default function () {
  // Endpoint público que genera una recomendación de pizza
 
  
  const loginResponse = http.post
  (
    `${BASE_URL}/api/users/token/login`,
    
    JSON.stringify({username: 'default', password: '12345678'}),
    { 
      headers: 
        { 
          'Content-Type': 'application/json' 
        } 
      }
      
  );

 const getToken = loginResponse.json('token');
 const resCode = loginResponse.status;

 console.log(resCode);
 
 check(loginResponse,
  {'Validating response status code to be 200':(sc)=> sc.status.toString()==='200'});
 console.log(loginResponse.body);
 sleep(1); // think time simple
}