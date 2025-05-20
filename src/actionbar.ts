import color from "ansi-colors";
import { keyPressDetection } from "./lib/utils.js";
import { KeyPress, StateOptions } from './interfaces.js';
import { load } from "./load.js";
import { unload } from "./unload.js";
import { ollamaPsOrQuit } from "./lib/ps.js";
import { modelsMemChart } from "./lib/models.js";

async function actionBar() {
    const txt = `${color.dim("Keys:")} ${color.bold("m")} memory, ${color.bold("l")} load, ${color.bold("u")} unload`;
    const clearLine = () => {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
    };
    let kp = "";
    const end = new Promise((resolve) => {
        const onKeyPress = async (k: KeyPress) => {
            clearLine();
            kp = k.name;
            resolve(kp);
        };
        process.stdout.write(txt);
        keyPressDetection(onKeyPress, clearLine, 5000);
    });
    await end;
    return kp;
}

async function processAction(options: StateOptions) {
    const k = await actionBar();
    switch (k) {
        case "l":
            await load([], {});
            break;
        case "u":
            await unload(await ollamaPsOrQuit());
            break
        case "m":
            modelsMemChart(await ollamaPsOrQuit());
            await processAction(options);
            break
        default:
            process.exit(0)
    }
}

export {
    actionBar,
    processAction,
}