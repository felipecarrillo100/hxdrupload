import fetch  from "cross-fetch";
import fs from "fs";
import {ETAGCHUNK, URLCHUNK} from "../graphql/MutationLibrary";
const mime = require('mime');

export function uploadFileInChunks(urlchunks:URLCHUNK[], file: string, chunkSize: number, counter: number) {
    return new Promise<ETAGCHUNK[]>(resolve=>{
        const buffer = fs.readFileSync(file);
        const mime_type = mime.getType(file)

        function processChunk(url: string, chunk: any, part: number) {
            return new Promise(resolve => {
                fetch(url, {
                    method: 'PUT',
                    body: chunk,
                    headers: {
                        "Accept":"*/*",
                        "Accept-Encoding":"gzip, deflate, br",
                        "Accept-Language": "en,es;q=0.9,en-US;q=0.8,nl;q=0.7,uk;q=0.6",
                        "Access-Control-Request-Headers": "content-type,x-multipart-chunk",
                        "Access-Control-Request-Method":"PUT",
                        "Connection":"keep-alive",
                        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
                        "Content-Length": chunk.length,
                        "Content-Type": mime_type
                    }
                }).then(response=>{
                    if (response.ok) {
                        response.text().then(data=>{
                            const etagQuoted = response.headers.get("etag") as string;
                            const etag = etagQuoted.replace(/"/g, "")
                            const result: ETAGCHUNK = {part, etag};
                            resolve(result);
                        })
                    }
                });
            })
        }

        const promisesToChunks = [];
        for (let i=0; i<counter; ++i) {
            const urlChunk = urlchunks.find(urlchunk => urlchunk.part === i+1);
            const start = i * chunkSize;
            const end = start + chunkSize ;
            const chunk = buffer.subarray(start, end);
            const promise = processChunk(urlChunk.url, chunk, urlChunk.part);
            promisesToChunks.push(promise);
        }
        Promise.all(promisesToChunks).then((etags:ETAGCHUNK[])=>{
            resolve(etags);
        })
    })

}
