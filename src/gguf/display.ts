import color from "ansi-colors";
import { ModelInfo, OllamaRegistry } from "../interfaces.js";
import { formatFileSize } from "../lib/utils.js";

function displayRegistries(registriesData: Array<OllamaRegistry>) {
    registriesData.forEach((r) => {
        console.log("\n--------- ", color.dim("Registry"), r.name, "---------");
        displayRegistryModels(r);
    });
}

function displayRegistryModels(registryData: OllamaRegistry) {
    console.log(color.bold(registryData.name));
    registryData.modelFamilies.forEach(mf => {
        const nmodels = mf.models.length;
        console.log("  ", color.blueBright(mf.name), `(${nmodels} model${nmodels > 1 ? 's' : ''})`);
        mf.models.forEach((m) => {
            console.log("    -", m.name)
        });
    });
}

function displayModel(model: ModelInfo) {
    console.log(color.dim("Model"), color.bold(model.name), color.dim("found in registry"), model.registry);
    console.log(" ", color.dim("size:"), formatFileSize(model.size));
    console.log(" ", color.dim("quant:"), model.quant);
    console.log(" ", color.dim("blob:"), model.blobPath);
    const link = `ln -s ${model.blobPath} ${model.ggufName}`;
    console.log(" ", color.dim("link:"), link);
}

function displayTemplate(model: ModelInfo) {
    console.log(color.dim("Model"), color.bold(model.name), color.dim("found in registry"), model.registry);
    if (model?.params) {
        console.log(color.blueBright(" Params:"));
        console.log(JSON.parse(model.params.trim()));
    }
    console.log(color.blueBright(" Template:"));
    console.log(model.template);
}

export {
    displayRegistries,
    displayRegistryModels,
    displayModel,
    displayTemplate,
}

