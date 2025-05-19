import { formatFileSize, getTimeHumanizedUntil } from '../src/lib/utils';
import { findModel } from '../src/gguf/utils';

describe('getTimeHumanizedUntil', () => {
    it('should return "0" for past dates', () => {
        const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
        expect(getTimeHumanizedUntil(pastDate)).toBe("0");
    });

    it('should return human-readable duration for future dates', () => {
        const futureDate = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now
        expect(getTimeHumanizedUntil(futureDate)).toBe("1 hour");
    });
});

describe('formatFileSize', () => {
    it('should format bytes to KB', () => {
        expect(formatFileSize(1024)).toBe('1 KiB');
    });

    it('should format bytes to MB', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1 MiB');
    });

    it('should format bytes to GB with decimals', () => {
        expect(formatFileSize(1024 * 1024 * 1024 + 512 * 1024 * 1024, 2)).toBe('1.5 GiB');
    });
});

describe('findModel', () => {
    it('should find a model in the registry data', () => {
        const registriesData = [
            {
                name: "registry.ollama.ai",
                path: "/path/to/registry",
                modelFamilies: [
                    {
                        name: "qwen3",
                        path: "/path/to/qwen3",
                        models: [
                            { name: "0.6b", path: "/path/to/qwen3/0.6b" }
                        ]
                    }
                ]
            }
        ];
        const query = ["qwen3", "0.6b"];
        const result = findModel(registriesData, query);
        expect(result.found).toBe(true);
        expect(result.model.name).toBe("0.6b");
    });

    it('should not find a model if the family does not exist', () => {
        const registriesData = [
            {
                name: "registry.ollama.ai",
                path: "/path/to/registry",
                modelFamilies: []
            }
        ];
        const query = ["qwen3", "0.6b"];
        const result = findModel(registriesData, query);
        expect(result.found).toBe(false);
    });
});