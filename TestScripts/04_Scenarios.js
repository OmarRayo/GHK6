import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Custom metric para medir específicamente el flujo completo (power users)
const fullFlowDuration = new Trend('full_flow_duration');

export const options = {
  scenarios: {
    readers: {
      executor: 'constant-vus',
      vus: 7,                    // 70% de 10 VUs totales
      duration: '2m',
      exec: 'readFlow',
      tags: { scenario_type: 'read' },
    },
    writers: {
      executor: 'constant-vus',
      vus: 2,                    // 20% de 10 VUs totales
      duration: '2m',
      exec: 'writeFlow',
      tags: { scenario_type: 'write' },
    },
    powerUsers: {
      executor: 'constant-vus',
      vus: 1,                    // 10% de 10 VUs totales
      duration: '2m',
      exec: 'fullFlow',
      tags: { scenario_type: 'full' },
    },
  },
  thresholds: {
    // Thresholds distintos por tipo de escenario — más estricto para lectura,
    // más tolerante para el flujo completo (más pasos = más tiempo esperado)
    'http_req_duration{scenario_type:read}': ['p(95)<300'],
    'http_req_duration{scenario_type:write}': ['p(95)<500'],
    'full_flow_duration': ['p(95)<3000'],
  },
};

// ---- ESCENARIO 1: Lectores (70%) — solo consultan ----
export function readFlow() {
  const res = http.get('https://dummyjson.com/products?limit=10');

  check(res, {
    'products fetched': (r) => r.status === 200,
  });

  sleep(1);
}

// ---- ESCENARIO 2: Escritores (20%) — crean recursos ----
export function writeFlow() {
  const payload = JSON.stringify({
    title: 'Test Product',
    price: 99.99,
  });

  const res = http.post('https://dummyjson.com/products/add', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'product created': (r) => r.status === 200 || r.status === 201,
  });

  sleep(2);
}

// ---- ESCENARIO 3: Power users (10%) — flujo completo login -> consulta -> logout ----
export function fullFlow() {
  const start = Date.now();

  // Paso 1: Login
  const loginRes = http.post('https://dummyjson.com/auth/login', JSON.stringify({
    username: 'emilys',
    password: 'emilyspass',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginOk = check(loginRes, { 'login successful': (r) => r.status === 200 });
  if (!loginOk) return;

  const token = loginRes.json('accessToken');

  // Paso 2: Consulta autenticada
  const meRes = http.get('https://dummyjson.com/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(meRes, { 'authenticated fetch succeeded': (r) => r.status === 200 });

  // Paso 3: Otra consulta (simula navegación adicional)
  const productsRes = http.get('https://dummyjson.com/products/1', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(productsRes, { 'product detail fetched': (r) => r.status === 200 });

  // Registrar el tiempo TOTAL del flujo completo como métrica custom
  fullFlowDuration.add(Date.now() - start);

  sleep(3);
}