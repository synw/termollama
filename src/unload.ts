import { checkbox } from '@inquirer/prompts';
import { ModelResponse } from 'ollama';
import ora from 'ora';
import { execute } from "./lib/execute.js";
import { ollamaPs } from './lib/ps.js';
import { modelsMemChart } from './lib/models.js';
import { getGPUMemoryInfo, gpuTotalStats } from './lib/bars/gpus.js';

async function unload(models: Array<ModelResponse>) {
    const runningModels = models.map(m => m.model);
    const choices: Array<{ name: string, value: string }> = [];
    runningModels.forEach((m) => {
        choices.push({
            name: m,
            value: m,
        })
    });
    const answer = await checkbox({
        message: 'Unload models?',
        choices: choices,
    });
    if (answer.length > 0) {
        for (const m of answer) {
            const spinner = ora('Unloading ' + m).start();
            await execute("ollama", ["stop", m], { onStdout: (t) => null });
            spinner.stopAndPersist({ text: m, symbol: "-" });
        }
        //console.log(`Unloaded ${answer.length} model${answer.length > 1 ? 's' : ''}`);
        await new Promise(resolve => setTimeout(resolve, 350));
        const { models } = await ollamaPs();
        modelsMemChart(models);
        const { hasGPU, info } = await getGPUMemoryInfo();
        if (hasGPU) {
            gpuTotalStats(info)
        }
    } else {
        console.log("No models unloaded")
    }
}

export { unload };
