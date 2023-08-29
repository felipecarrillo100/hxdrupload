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



export async function uploadFiles(options: {
    folderName: string;
    assetName: string;
    files: FilesInFolder[],
    projectId: string;
    parentFolderId: string;
}) {
    const folderName = options.folderName;
    const assetName = options.assetName;
    const files = options.files;

    const createFolderResult = await createFolder({
        name: folderName,
        projectId: options.projectId,
        parentFolderId: options.parentFolderId
    });

    // Expects: __typename===FolderOutput
    if (createFolderResult.data.createFolderV2.__typename === "FolderErrorDuplicateNameOutput") {
        console.log("Folder already exists!");
    }
    if (createFolderResult.data.createFolderV2.__typename === "FolderErrorOperationNotAllowedOutput"){
        console.log("Create folder not allowed!");
        return;
    }
    const folderId = createFolderResult.data.createFolderV2.id;
    console.log(`Folder id: ${folderId}`);


    const createAssetResult = await createAsset({
        // folderId: folderId,
        folderId: options.parentFolderId,
        name: assetName,
        assetType: "OBJ_UPLOAD",
        // assetType: "COARSE_REGISTRATION_UPLOAD",
        });

    // Expects: __typename===GroupedAssetOutput
    if (createAssetResult.data.createAssetV2.__typename === "AssetErrorDuplicateNameOutput") {
        console.log("Asset with that name already exists!");
        return;
    }

    if (createAssetResult.data.createAssetV2.__typename === "AssetErrorOperationNotAllowedOutput"){
        console.log("Create asset not allowed!");
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

