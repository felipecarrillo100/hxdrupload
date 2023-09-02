import fs from "fs";
import {ETAGCHUNK, URLCHUNK} from "./MutationLibrary";
import {fetchRetry} from "../fetchutils/fetchretry";
import {loadFileChunkSync} from "../fileutils/fileutils";
const mime = require('mime');

export function uploadChunk(options:{url: string, chunk: any, part: number, mime_type: string}) {
    return new Promise<ETAGCHUNK>((resolve, reject) => {
        fetchRetry(options.url, 100, 5, {
            method: 'PUT',
            body: options.chunk,
            headers: {
                "Accept":"*/*",
                "Accept-Encoding":"gzip, deflate, br",
                "Accept-Language": "en,es;q=0.9,en-US;q=0.8,nl;q=0.7,uk;q=0.6",
                "Access-Control-Request-Headers": "content-type,x-multipart-chunk",
                "Access-Control-Request-Method":"PUT",
                "Connection":"keep-alive",
                "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
                "Content-Length": options.chunk.length,
                "Content-Type": options.mime_type
            }
        }).then(response=>{
            if (response.ok) {
                response.text().then(()=>{
                    const etagQuoted = response.headers.get("etag") as string;
                    const etag = etagQuoted.replace(/"/g, "")
                    const result: ETAGCHUNK = {part: options.part, etag};
                    resolve(result);
                })
            } else {
                reject();
            }
        }, ()=>{
            reject();
        });
    })
}
export function uploadFileInChunks(urlChunks:URLCHUNK[], file: string, chunkSize: number, counter: number) {
    return new Promise<ETAGCHUNK[]>(resolve=>{
        const mime_type = mime.getType(file)

        const promisesToChunks = [];
        let offset = 0;
        const filePointer = fs.openSync(file, 'r');
        for (let i=0; i<counter; ++i) {
            const chunk = loadFileChunkSync({filePointer, chunkSize, start: offset, size:chunkSize})
            const bytesRead = chunk.length;
            offset += bytesRead;
            const urlChunk = urlChunks.find(urlChunk => urlChunk.part === i + 1);
            const promise = uploadChunk({url:urlChunk.url, chunk, part:urlChunk.part, mime_type});
            promisesToChunks.push(promise);
        }
        fs.close(filePointer);
        Promise.all(promisesToChunks).then((etags:ETAGCHUNK[])=>{
            resolve(etags);
        })
    })

}
