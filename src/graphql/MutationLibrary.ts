import {CreateClient} from "./GraphqlClient";
import {
    CompleteAsset,
    CreateAsset,
    CreateFileInAsset,
    CreateFolder, DeleteFolder,
    FileUploadURL,
    FinalizeAsset
} from "./graphql.mutations";

export interface ETAGCHUNK {
    "part": number;
    "etag": string;
}

export interface URLCHUNK {
    "part": number;
    "url": string;
}

let client = null;

export function initializeGraphQlClient() {
    client =  CreateClient();
}

export function createFolder(params: {
    name: string;
    projectId: string;
    parentFolderId: string;
}) {
    return client.mutate({
        mutation: CreateFolder,
        variables: {
            "params": params
        }
    });
}

export function createAsset(params: {
    folderId: string;
    name: string;
    assetType: string;
}) {
    return client.mutate({
        mutation: CreateAsset,
        variables: {
            params: params
        }
    });
}

export function addFileToAsset(parameters: {
    "groupedAssetId": string;
    "fileName": string;
    "fileSize": number;
}) {
    return  client.mutate({
        mutation: CreateFileInAsset,
        variables: {
            "groupedAssetId": parameters.groupedAssetId,
            "fileName": parameters.fileName,
            "fileSize": parameters.fileSize
        }
    });
}

export function FileUploadSignedUrl( parameters: {fileId: string, partNumber: number}) {
    return  client.mutate({
        mutation: FileUploadURL,
        variables: {
            "chunkIndex": parameters.partNumber,
            "fileId": parameters.fileId
        }
    });
}


export async function CompleteChunkUpload(params: {fileId: string; multipartUploadsETags: ETAGCHUNK[]}) {
    return  client.mutate({
        mutation: CompleteAsset,
        variables: {
            params: params
        }
    });
}

export async function TriggerPipeline(assetId: string) {
    return  client.mutate({
        mutation: FinalizeAsset,
        variables: {
            assetId: assetId
        }
    });
}

export async function deleteFolder(parameters:{id:string; projectId: string;}) {
    return  client.mutate({
        mutation: DeleteFolder,
        variables: {
            "id": parameters.id,
            "projectId": parameters.projectId
        }
    });
}