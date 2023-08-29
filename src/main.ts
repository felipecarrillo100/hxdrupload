import {getFileInfoFromFolder} from "./graphql/GetFilesInFolder";
import {validExtension} from "./fileupload/fileutils";
import {uploadFiles} from "./graphql/FileUploads";
import {AppSettings} from "./settings/AppSettings";
import {initializeGraphQlClient} from "./graphql/MutationLibrary";

const fs = require('fs');

const inputsRaw = fs.readFileSync('./assets/token.json');
const inputs = JSON.parse(inputsRaw);
AppSettings.setToken(inputs.token);

initializeGraphQlClient();

//const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\outputsingletile");
// const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\outputscale5");
// const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\outputfull");
const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\output100jpg");

const targetFiles = files.filter(f=>validExtension(f.name, ["jpg", "obj", "mtl", "prj", "png"]));

for(const file of targetFiles) {
   console.log(JSON.stringify(file));
}

uploadFiles({
   folderName:"newfolder18",
   assetName: "obj100jpg",
   files: targetFiles,
   projectId:"301dd3ab-76cc-4ac7-9786-a8bc015d2cad",
   parentFolderId:"647dc49f-4696-4660-941e-8eb4ed66dccf"
});

console.log("Program has finished!!");
