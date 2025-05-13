import path from "path";
import { ModelInfo } from "../interfaces.js";
import * as fs from 'fs';

function exfiltrate(info: ModelInfo, destination: string, copyOnly = false) {
    // step 1: copy the model data to destination
    const copiedBlobPath = path.resolve(destination, info.blobPath.split("/").pop()!);
    console.log("Copying blob from", info.blobPath, "to", destination);
    try {
        fs.copyFileSync(info.blobPath, copiedBlobPath, fs.constants.COPYFILE_EXCL)
    }
    catch (e) {
        throw new Error(`Failed to copy model data to ${destination}: ${e}`);
    }
    // step 2: rename the blob file
    console.log("Renaming copied blob to", info.ggufName);
    const ggufFilePath = path.resolve(destination, info.ggufName);
    try {
        fs.renameSync(copiedBlobPath, ggufFilePath);
    }
    catch (e) {
        throw new Error(`Failed to rename copied blob to ${info.ggufName}: ${e}`);
    }
    if (copyOnly) {
        console.log("Gguf copy completed successfully");
        return
    }
    // step 3: replace the original blob by a symlink to the new file
    console.log("Replacing original blob with symlink to", ggufFilePath);
    try {
        // delete blob
        fs.rmSync(info.blobPath);
    }
    catch (e) {
        throw new Error(`Failed to delete original blob: ${e}`);
    }
    try {
        fs.symlinkSync(ggufFilePath, info.blobPath);
    }
    catch (e) {
        throw new Error(`Failed to replace original blob with symlink to ${info.ggufName}: ${e}`);
    }
    console.log("Gguf exfiltration completed successfully");
}

export {
    exfiltrate,
}