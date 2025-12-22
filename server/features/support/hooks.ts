import { Before, After, Status } from '@cucumber/cucumber';
import * as fs from 'fs';
import * as path from 'path';

// Store paths of temporary files created during the scenario
const tempFiles: Set<string> = new Set();

/**
 * Register a file path to be cleaned up after the scenario ends.
 * @param filePath Absolute or relative path to the file.
 */
export function registerArtifact(filePath: string) {
    // Resolve to absolute path to ensure correct deletion
    const absolutePath = path.resolve(filePath);
    tempFiles.add(absolutePath);
}

// Hook to run after each scenario
After(async function (scenario) {
    if (tempFiles.size > 0) {
        console.log(`[Clean Testing] Cleaning up ${tempFiles.size} temporary artifacts...`);
        for (const file of tempFiles) {
            try {
                if (fs.existsSync(file)) {
                    await fs.promises.unlink(file);
                    console.log(`  Deleted: ${file}`);
                }
            } catch (err) {
                console.error(`  Failed to delete: ${file}`, err);
            }
        }
        // Clear the set for the next scenario
        tempFiles.clear();
    }
});

// Optional: Before hook to ensure temp directory exists if needed
Before(async function () {
    const tempDir = path.resolve('server/temp/test_artifacts');
    if (!fs.existsSync(tempDir)) {
        await fs.promises.mkdir(tempDir, { recursive: true });
    }
});
