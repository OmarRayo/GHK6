import {sleep, check} from 'k6';
import http from 'k6/http';

export const options = 
{
    vus:1,
    iterations: 1,
    thresholds: 
    {
        'http_req_duration': ['p(95)<300']
    }
}

export default function ()
{
    const BASE_URL= "https://dummyjson.com/";
    const loginPath ="auth/login";
    const authPath = "auth/me";
    const login = http.post(`${BASE_URL}${loginPath}`,
        JSON.stringify({username: 'emilys', password: 'emilyspass'}),
        { 
            headers: 
            { 
                'Content-Type': 'application/json' 
            } 
        }
        
    
    );
    
    check(login,{"Validate Login correctly executed":(rc)=>rc.status===200});
    //check(variable a evaluar,{'nombre de la validacion':(x nuevo nombre de la misma variable)=> evaluacion logica});
    const authToken = login.json('accessToken');
    console.log(`here---------${authToken}`);
    const loginChk = http.get(`${BASE_URL}${authPath}`,
        { 
            headers: 
            { 
                //'Authorization':`Bearer ${authToken}` ,
                'Content-Type': 'application/json' 
            },
            cookies: {}, 
        }
        
    
    );
    check(loginChk,{"Validate correlated token works":(rc2)=>rc2.status===200});
    //console.log(`Login response body: ${login.body}`);
 

}