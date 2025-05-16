import { checkbox, input } from '@inquirer/prompts';
import { ModelResponse } from 'ollama';
import { ps } from './lib/ps.js';
import { ollama } from './state.js';

async function keepAlive(models: Array<ModelResponse>) {
    const runningModels = models.map(m => m.model);
    const choices: Array<{ name: string, value: string }> = [];
    runningModels.forEach((m) => {
        choices.push({
            name: m,
            value: m,
        })
    });
    const answer = await checkbox({
        message: 'Select models',
        choices: choices,
    });
    if (answer.length > 0) {
        for (const m of answer) {
            const val = await input({ message: `Keep alive ${m}:` });
            console.log(" Setting keep alive to", val, "for", m);
            // @ts-ignore
            const res = await ollama.generate({ prompt: "", model: m, keep_alive: val, options: { num_predict: 1 } });
            //console.log("r", res);
        }
        //console.log(`Unloaded ${answer.length} model${answer.length > 1 ? 's' : ''}`);
        await new Promise(resolve => setTimeout(resolve, 250));
        await ps();
    } else {
        console.log("No models selected")
    }
}

export { keepAlive };
