import {check,sleep} from 'k6';
import http from 'k6/http';
export const options =
{
    vus: 5,
    duration: '15s',

}
const BASE_URL="https://dummyjson.com/products";
export default function ()
{
    const goToDummy = http.get(BASE_URL);
    check(goToDummy,
            {
                "Validate Get Call Status is 200":(g200)=> g200.status === 200,
                "Validate response time is under 500":(gtr)=> gtr.timings.duration <= 500 
            }
        );
    //check(variable a evaluar,{'nombre de la validacion':(x nuevo nombre de la misma variable)=> evaluacion logica});
    sleep(2);
}