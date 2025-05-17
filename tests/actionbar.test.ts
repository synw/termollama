import { ServeOptions } from '../src/interfaces';
import { serve } from '../src/serve';

describe('serve', () => {
    it('should set OLLAMA_FLASH_ATTENTION when --flash-attention is provided', async () => {
        const options = { flashAttention: true } as ServeOptions;
        await serve(options);
        expect(process.env.OLLAMA_FLASH_ATTENTION).toBe('1');
    });

    it('should set CUDA_VISIBLE_DEVICES when --gpu is provided', async () => {
        const options = { gpu: [0, 1] };
        await serve(options as ServeOptions);
        expect(process.env.CUDA_VISIBLE_DEVICES).toBe('0,1');
    });
});