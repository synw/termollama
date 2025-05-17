import { checkbox } from '@inquirer/prompts';
import ora from 'ora';
import { selectModelCtx } from './ctx.js';
import { getGPUMemoryInfo, gpuTotalStats } from "./lib/bars/gpus.js";
import { modelsMemChart } from './lib/models.js';
import { ollama } from './state.js';
import { ollamaPs } from './lib/ps.js';

async function load(filters: Array<string>) {
    const { isRunning, models } = await ollamaPs();
    if (!isRunning) {
        console.warn("No instance of Ollama is running");
        return
    }
    const res = await ollama.list();
    //console.log("FILTERS", filters);
    const runningModels = models.map(m => m.model);
    let rawData = res.models.sort((a, b) => a.size - b.size).map(m => m.model);
    const data = new Array<string>();
    rawData.forEach((row) => {
        if (!runningModels.includes(row)) {
            data.push(row)
        }
    });
    const filteredChoices: Array<{ name: string, value: string }> = [];
    const allModelsChoices: Array<{ name: string, value: string }> = [];
    data.forEach(m => {
        const c = {
            name: m,
            value: m,
        };
        allModelsChoices.push(c);
        for (const f of filters) {
            if (m.includes(f)) {
                filteredChoices.push(c)
                return
            }
        }
    });
    let choices = allModelsChoices;
    if (filters.length > 0) {
        if (filteredChoices.length == 0) {
            console.warn("No models found matching query", filters.join(" "));
        } else {
            choices = filteredChoices
        }
    }
    const answer = await checkbox({
        message: 'Load models?',
        choices: choices,
        pageSize: 10,
        loop: false,
    });
    if (answer.length > 0) {
        for (const m of answer) {
            const mctx = await selectModelCtx();
            const spinner = ora('Loading ' + m).start();
            await ollama.generate({ prompt: "", model: m, options: { num_predict: 1, num_ctx: parseInt(mctx) } });
            //console.log("Loaded", m)
            spinner.stopAndPersist({ text: m, symbol: "+" });
        }
        //console.log(`Loaded ${answer.length} model${answer.length > 1 ? 's' : ''}`)
        const ps = await ollamaPs();
        modelsMemChart(ps.models);
        const { hasGPU, info } = await getGPUMemoryInfo();
        if (hasGPU) {
            gpuTotalStats(info)
        }
    } else {
        console.warn("No model loaded")
    }
}

export { load };
