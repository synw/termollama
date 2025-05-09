import color from "ansi-colors";
import { keyPressDetection } from "./lib/utils.js";
import { KeyPress } from './interfaces.js';

async function actionBar() {
    const txt = `${color.dim("Keys:")} ${color.bold("m")} memory, ${color.bold("l")} load, ${color.bold("u")} unload, ${color.bold("k")} keep alive, ${color.bold("c")} set context window`;
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

export {
    actionBar,
}