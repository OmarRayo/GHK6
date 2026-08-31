import http from 'k6/http';
import { check } from 'k6';

export default function () {
    const res = http.get('https://dummyjson.com/auth/me', {
        cookies: {},
        // sin Authorization, sin haber llamado nunca a /auth/login antes
    });

    check(res, { 'unauthenticated request status': (r) => r.status === 200 });
    console.log(`Status: ${res.status}, Body: ${res.body}`);
}