import http from 'k6/http'
import {check, sleep, group, fail}  from 'k6';

export const options =
{
    vus:1,
    iterations: 1,
}
const URL_BASE = 'https://quickpizza.grafana.com';
export default function()
{
    const hitLanding = http.get(`${URL_BASE}/`);



check(hitLanding,{'Correctly reached landing page':(sc)=>sc.status === 200});
console.log(`Landing page responded: ${hitLanding.status}`)
}