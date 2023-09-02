import fetch2  from "cross-fetch";

export function fetch(url: string, options: any) {
    // You can show
    // console.log(url);
    // console.log(options);
    return fetch2(url,options);
}
