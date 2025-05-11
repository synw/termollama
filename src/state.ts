import { Ollama } from 'ollama';

let ollama: Ollama;
let gpus = new Array<number>();

function initState(addr: string = "localhost:11434", https = false) {
    const h = `${https ? 'https' : 'http'}://${addr}`;
    //console.log("Setting host to", h);
    ollama = new Ollama({ host: h })
}

export {
    initState,
    ollama,
    gpus,
}