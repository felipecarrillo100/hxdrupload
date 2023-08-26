import {FilesInFolder} from "./GetFilesInFolder";
import {uploadFileInChunks} from "../fileupload/upload";
import {
    addFileToAsset,
    CompleteChunkUpload,
    createAsset,
    createFolder, ETAGCHUNK,
    FileUploadSignedUrl,
    TriggerPipeline, URLCHUNK
} from "./MutationLibrary";

// const MAX_CHUNK_SIZE =  50000000;
// const MAX_CHUNK_SIZE =  10485760;  // 10 MB
const MAX_CHUNK_SIZE =  5242880; // 1 MB


async function addFile(file: FilesInFolder, assetId: string) {
    const addFileResult = await addFileToAsset({
        "groupedAssetId": assetId,
        "fileName": file.name,
        "fileSize": file.fileSizeInBytes
    });

    const fileId = addFileResult.data.addFileV2.id;
    console.log("Add file:" + file.name);
    console.log("Add fileID:" + fileId);

    const oneFile = await uploadFileInParts(fileId, file);
    return oneFile;
}


function uploadFileInParts(fileId: string, file: FilesInFolder) {
    function createPromiseContent(fileId: string, part: number)  {
        return new Promise<URLCHUNK>(resolve => {
            FileUploadSignedUrl({fileId, partNumber:part}).then(r => {
                const url = r.data.multipartUploadURL.uploadUrl;
                const urlChunk = { url, part}
                resolve(urlChunk);
            })
        })
    }
    return new Promise(resolve=>{
        const parts = Math.ceil(file.fileSizeInBytes / MAX_CHUNK_SIZE);

        const promises = [];
        for (let i=0; i<parts; ++i) {
            const promise = createPromiseContent(fileId, i+1);
            promises.push(promise);
        }

        Promise.all(promises).then(urlsChunks=>{
            uploadFileInChunks(urlsChunks, file.path, MAX_CHUNK_SIZE, parts).then(parts=>{
                console.log(JSON.stringify(parts));
                CompleteChunkUpload({fileId, multipartUploadsETags:parts}).then(result=>{
                    console.log("Multipart Completed:"+JSON.stringify(result.data.completeMultipartUpload));
                    resolve(result.data.completeMultipartUpload);
                })
            });
        });
    })
}



export async function uploadFiles(folderName: string, assetName: string, files: FilesInFolder[]) {

    const createFolderResult = await createFolder({
        name: folderName,
        projectId: "301dd3ab-76cc-4ac7-9786-a8bc015d2cad",
        parentFolderId: "647dc49f-4696-4660-941e-8eb4ed66dccf"
    });

    if (createFolderResult.data.createFolderV2.__typename === "FolderErrorDuplicateNameOutput") {
        console.log("Folder already exists!");
    }
    const folderId = createFolderResult.data.createFolderV2.id;
    console.log(`Folder id: ${folderId}`);


    const createAssetResult = await createAsset({
        folderId: folderId,
        name: assetName,
        assetType: "OBJ_UPLOAD",
        // assetType: "COARSE_REGISTRATION_UPLOAD",
        });

    if (createAssetResult.data.createAssetV2.__typename === "AssetErrorDuplicateNameOutput") {
        console.log("Asset with that name already exists!");
        return;
    }

    const assetId = createAssetResult.data.createAssetV2.id;
    console.log(`Asset id: ${assetId}`);


    for (const file of files) {
        const oneFile = await addFile(file, assetId);
        console.log(oneFile)
    }
    const processStarted = await TriggerPipeline(assetId);
    console.log(JSON.stringify(processStarted));
    console.log("Upload completed!!!!");
    return;
}

