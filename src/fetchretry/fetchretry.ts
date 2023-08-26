import fetch  from "cross-fetch";

function wait(delay: number){
    return new Promise((resolve) => setTimeout(resolve, delay));
}

export function fetchRetry(url:string, delay: number, tries: number, fetchOptions = {}) {
    function onError(err){
        let triesLeft = tries - 1;
        if(!triesLeft){
            throw err;
        }
        return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
    }
    return fetch(url,fetchOptions).catch(onError);
}
