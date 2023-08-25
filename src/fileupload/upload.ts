import fetch  from "cross-fetch";
import fs from "fs";
import {ETAGCHUNK, URLCHUNK} from "../graphql/MutationLibrary";

export function uploadFileInChunks(urlchunks:URLCHUNK[], file: string, chunkSize: number, counter: number) {
    return new Promise<ETAGCHUNK[]>(resolve=>{
        const buffer = fs.readFileSync(file);
        function processChunk(url: string, chunk: any, part: number) {
            return new Promise(resolve => {
                fetch(url, {
                    method: 'PUT',
                    body: chunk,
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
