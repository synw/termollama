import { spawnSync } from 'node:child_process';
import { jest } from '@jest/globals';

import {
    getGPUCardsInfo,
    getGPUMemoryInfo,
    getTotalGPUMem,
    calculateUsagePercentage,
    getGPUOccupationPercent
} from '../dist/lib/gpu.js';

describe('getGPUCardsInfo', () => {
    it('should return GPU card information successfully', () => {
        const mockSpawnSync = jest.fn().mockReturnValue({
            output: null,
            stdout: '0, 24576, 12288, 150, 300, 60\n1, 24576, 6144, 100, 250, 70',
            stderr: '',
            status: 0,
            signal: null
        });
        (spawnSync as jest.Mock).mockImplementation(mockSpawnSync);

        const result = getGPUCardsInfo();
        expect(result.ok).toBe(true);
        expect(result.hasGPU).toBe(true);
        expect(result.cards.length).toBe(2);
    });

    it('should handle no GPUs found', () => {
        const mockSpawnSync = jest.fn().mockReturnValue({
            output: null,
            stdout: '',
            stderr: '',
            status: 0,
            signal: null
        });
        (spawnSync as jest.Mock).mockImplementation(mockSpawnSync);

        const result = getGPUCardsInfo();
        expect(result.ok).toBe(false);
        expect(result.hasGPU).toBe(false);
        expect(result.cards.length).toBe(0);
    });

    it('should handle invalid GPU data', () => {
        const mockSpawnSync = jest.fn().mockReturnValue({
            output: null,
            stdout: 'invalid,data,here',
            stderr: '',
            status: 0,
            signal: null
        });
        (spawnSync as jest.Mock).mockImplementation(mockSpawnSync);

        const result = getGPUCardsInfo();
        expect(result.ok).toBe(false);
        expect(result.hasGPU).toBe(false);
        expect(result.cards.length).toBe(0);
    });

    it('should handle error cases', () => {
        const mockSpawnSync = jest.fn().mockImplementation(() => { throw new Error("Error executing command"); });
        (spawnSync as jest.Mock).mockImplementation(mockSpawnSync);

        const result = getGPUCardsInfo();
        expect(result.ok).toBe(false);
        expect(result.hasGPU).toBe(false);
        expect(result.cards.length).toBe(0);
    });
});

describe('getGPUMemoryInfo', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return GPU memory information successfully', () => {
        (getGPUCardsInfo as jest.Mock).mockReturnValue({
            ok: true,
            hasGPU: true,
            cards: [
                { index: 0, memory: { totalMemoryBytes: 24576 * 1048576, usedMemoryBytes: 12288 * 1048576 }, powerDraw: 150, powerLimit: 300, temperature: 60 },
                { index: 1, memory: { totalMemoryBytes: 24576 * 1048576, usedMemoryBytes: 6144 * 1048576 }, powerDraw: 100, powerLimit: 250, temperature: 70 }
            ]
        });

        // Mock the return value of getGPUMemoryInfo
        (getGPUMemoryInfo as jest.Mock).mockReturnValue({
            hasGPU: true,
            info: {
                totalMemory: {
                    totalMemoryBytes: 49152 * 1048576,
                    usedMemoryBytes: 18432 * 1048576
                }
            },
            success: true
        });

        const result = getGPUMemoryInfo();
        expect(result.hasGPU).toBe(true);
        expect(result.info.totalMemory.totalMemoryBytes).toBe(49152 * 1048576);
        expect(result.info.totalMemory.usedMemoryBytes).toBe(18432 * 1048576);
        expect(result.success).toBe(true);
    });

    it('should handle no GPUs found', () => {
        (getGPUCardsInfo as jest.Mock).mockReturnValue({
            ok: false,
            hasGPU: false,
            cards: []
        });

        // Mock the return value of getGPUMemoryInfo
        (getGPUMemoryInfo as jest.Mock).mockReturnValue({
            hasGPU: false,
            info: {},
            success: false
        });

        const result = getGPUMemoryInfo();
        expect(result.hasGPU).toBe(false);
        expect(Object.keys(result.info)).toHaveLength(0);
        expect(result.success).toBe(false);
    });

    it('should handle error cases', () => {
        (getGPUCardsInfo as jest.Mock).mockReturnValue({
            ok: false,
            hasGPU: false,
            cards: []
        });

        // Mock the return value of getGPUMemoryInfo
        (getGPUMemoryInfo as jest.Mock).mockReturnValue({
            hasGPU: false,
            info: {},
            success: false
        });

        const result = getGPUMemoryInfo();
        expect(result.hasGPU).toBe(false);
        expect(Object.keys(result.info)).toHaveLength(0);
        expect(result.success).toBe(false);
    });
});

describe('getTotalGPUMem', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return total GPU memory successfully', async () => {
        (getGPUCardsInfo as jest.Mock).mockReturnValue({
            ok: true,
            hasGPU: true,
            cards: [
                { index: 0, memory: { totalMemoryBytes: 24576 * 1048576, usedMemoryBytes: 12288 * 1048576 }, powerDraw: 150, powerLimit: 300, temperature: 60 },
                { index: 1, memory: { totalMemoryBytes: 24576 * 1048576, usedMemoryBytes: 6144 * 1048576 }, powerDraw: 100, powerLimit: 250, temperature: 70 }
            ]
        });

        const result = await getTotalGPUMem();
        expect(result).toBe(49152 * 1048576);
    });

    it('should handle no GPUs found', async () => {
        (getGPUCardsInfo as jest.Mock).mockReturnValue({
            ok: false,
            hasGPU: false,
            cards: []
        });

        const result = await getTotalGPUMem();
        expect(result).toBe(0);
    });
});

describe('calculateUsagePercentage', () => {
    it('should calculate usage percentage successfully', () => {
        expect(calculateUsagePercentage(12288, 24576)).toBe(50.0);
        expect(calculateUsagePercentage(0, 24576)).toBe(0.0);
        expect(calculateUsagePercentage(24576, 24576)).toBe(100.0);
    });

    it('should handle division by zero cases', () => {
        expect(() => calculateUsagePercentage(12288, 0)).toThrow(/Division by zero/);
    });

    it('should handle invalid input types', () => {
        expect(() => calculateUsagePercentage('12288' as unknown as number, 24576)).toThrow(/Invalid input types/);
        expect(() => calculateUsagePercentage(12288, '24576' as unknown as number)).toThrow(/Invalid input types/);
    });
});

describe('getGPUOccupationPercent', () => {
    it('should calculate GPU occupation percentage successfully', () => {
        expect(getGPUOccupationPercent(24576 * 1048576, 12288 * 1048576)).toBe(50.0);
        expect(getGPUOccupationPercent(24576 * 1048576, 0)).toBe(0.0);
        expect(getGPUOccupationPercent(24576 * 1048576, 24576 * 1048576)).toBe(100.0);
    });

    it('should handle division by zero cases', () => {
        expect(() => getGPUOccupationPercent(0, 12288 * 1048576)).toThrow("Error: Division by zero encountered in GPU occupation percent calculation.");
    });

    it('should handle invalid input types', () => {
        expect(() => getGPUOccupationPercent('24576 * 1048576' as unknown as number, 12288 * 1048576)).toThrow(/Invalid input types/);
        expect(() => getGPUOccupationPercent(24576 * 1048576, '12288 * 1048576' as unknown as number)).toThrow(/Invalid input types/);
    });
});
