import {getFileInfoFromFolder} from "./graphql/GetFilesInFolder";
import {validExtension} from "./fileupload/fileutils";
import {uploadFiles} from "./graphql/FileUploads";
import {AppSettings} from "./settings/AppSettings";
import {initializeGraphQlClient} from "./graphql/MutationLibrary";
import {Command} from "commander";

const fs = require('fs');
const tokenPath = './token.json';

if (fs.existsSync(tokenPath)) {
    const inputsRaw = fs.readFileSync(tokenPath);
    const inputs = JSON.parse(inputsRaw);
    AppSettings.setToken(inputs.token);
    initializeGraphQlClient();
}

//const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\outputsingletile");
// const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\outputscale5");
// const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\outputfull");
// const files = getFileInfoFromFolder("C:\\git\\ortho2obj\\output100jpg");
// const targetFiles = files.filter(f=>validExtension(f.name, ["jpg", "obj", "mtl", "prj", "png", "e57"]));

// for(const file of targetFiles) {
//    console.log(JSON.stringify(file));
// }



const program = new Command();
program
    .name('hxdrupload')
    .description('CLI to convert an Upload content to HxDR')
    .version('1.0.0');


program.command('init')
    .description('Creates a template json file to describe an upload')
    .option('-n, --name <filename>', 'Enter the desired name', 'upload.json')
    .option('-t, --type <type_of_upload>', 'Supported: obj, e57', 'obj')
    .action((options) => {
        produceTemplate(options);
    });

program.command('token')
    .description('Sets the HxDR access token to use for the upload process')
    .option('-v, --value <token>', 'The HxDR access token', 'Your-token-goes-here')
    .action((options) => {
        setToken(options);
    });
program.command('upload')
    .description('Upload the files in the input folder as an asset in HxDR')
    .argument('<jsonfile>', 'The JSON file describing the upload')
     .action(( jsonfile, token, options) => {
         startUpload(jsonfile, token, options);
    });

program.parse();


function produceTemplate( options: any) {
    let assetType = "OBJ_UPLOAD";
    switch (options.type.toLowerCase()) {
        case "las":
            assetType = "LAS_UPLOAD"
            break;
        case "e57":
            assetType = "E57_UPLOAD"
            break;
        default:

    }
    const upload = {
       inputFolder: "Local disk folder containing the assets to upload",
       assetName: "name to use in HxDR for the new asset asset",
       folderName:"Optional, a name for the new folder that will contain the asset, if this name is missing the asset will be placed in the parentFolderId",
       projectId:"ID of the existing project",
       parentFolderId:"ID of the existing folder to place the asset",
       assetType,
    }

    const jsonContent = JSON.stringify(upload, null, 2);
    console.log(jsonContent);

    fs.writeFile(options.name, jsonContent, 'utf8', function (err) {
        if (err) {
            console.log("An error occurred while writing to File ${options.name} .");
            return console.log(err);
        }
        console.log(`JSON ${options.name} file has been saved.`);
    });

}

function setToken(options) {
    const tokenObject = {
        token: options.value
    }

    const jsonContent = JSON.stringify(tokenObject, null, 2);

    fs.writeFile(tokenPath, jsonContent, 'utf8', function (err) {
        if (err) {
            console.log(`An error occurred while writing to File ${tokenPath}.`);
            return console.log(err);
        }
        console.log(`JSON ${tokenPath} file has been saved.`);
    });
}

function startUpload(jsonfile: string, token: string, options: any) {
    if (!fs.existsSync(jsonfile)) {
        console.error(`File does not exist: ${jsonfile}`)
        return;
    }
    const inputsRaw = fs.readFileSync(jsonfile);
    const inputs = JSON.parse(inputsRaw);
    console.log(JSON.stringify(inputs, null, 2));

    if (!fs.existsSync(inputs.inputFolder)) {
        console.error(`Folder does not exist: ${inputs.inputFolder}`)
        return;
    }
    const files = getFileInfoFromFolder(inputs.inputFolder);
    const targetFiles = files.filter(f=>validExtension(f.name, ["jpg", "obj", "mtl", "prj", "png", "e57", "las", "laz"]));

    console.log(`A total of ${targetFiles.length} were found`)

    uploadFiles({
       folderName: inputs.folderName,
       assetName: inputs.assetName,
       files: targetFiles,
       projectId: inputs.projectId,
       parentFolderId: inputs.parentFolderId,
       assetType: inputs.assetType
    }).then(()=>{
         console.log("Program has finished!!");
    });

}
