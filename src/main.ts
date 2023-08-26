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
const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\outputscale5");

const targetFiles = files.filter(f=>validExtension(f.name, ["jpg", "obj", "mtl", "prj"]));

for(const file of targetFiles) {
   console.log(JSON.stringify(file));
}

uploadFiles("newfolder3", "mynewobj2", targetFiles);

console.log("Program has finished!!");
