const path = require('path');
const fs = require('fs');


export interface FilesInFolder {
    name: string;
    extension: string;
    fileSizeInBytes: number;
    path: string;
}
export const getFileInfoFromFolder = (route) => {
    const files = fs.readdirSync(route, 'utf8');
    route += "\\";
    const response = [] as FilesInFolder[];
    for (let file of files) {
        const extension = path.extname(file);
        const fullPath = route + file;
        const fileSizeInBytes = fs.statSync(fullPath).size;
        response.push({ name: file, extension, fileSizeInBytes, path:fullPath });
    }
    return response;
}

