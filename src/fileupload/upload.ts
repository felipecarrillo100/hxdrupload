import fetch  from "cross-fetch";
import fs from "fs";
import {ETAGCHUNK, URLCHUNK} from "../hxdrlib/MutationLibrary";
import {fetchRetry} from "../fetchutils/fetchretry";
import {loadFileChunkSync} from "./fileutils";
const mime = require('mime');

export function uploadFileInChunks(urlChunks:URLCHUNK[], file: string, chunkSize: number, counter: number) {
    return new Promise<ETAGCHUNK[]>(resolve=>{
        const mime_type = mime.getType(file)

        function processChunk(url: string, chunk: any, part: number) {
            return new Promise<ETAGCHUNK>(resolve => {
                fetchRetry(url, 100, 5, {
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
        let offset = 0;
        const filePointer = fs.openSync(file, 'r');
        for (let i=0; i<counter; ++i) {
            const chunk = loadFileChunkSync({filePointer, chunkSize, start: offset, size:chunkSize})
            const bytesRead = chunk.length;
            offset += bytesRead;
            const urlChunk = urlChunks.find(urlChunk => urlChunk.part === i + 1);
            const promise = processChunk(urlChunk.url, chunk, urlChunk.part);
            promisesToChunks.push(promise);
        }
        fs.close(filePointer);
        Promise.all(promisesToChunks).then((etags:ETAGCHUNK[])=>{
            resolve(etags);
        })
    })

}
