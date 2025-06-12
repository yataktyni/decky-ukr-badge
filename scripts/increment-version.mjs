import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

async function incrementVersion() {
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    let [major, minor, patch] = packageJson.version.split('.').map(Number);

    patch++;
    if (patch > 9) {
        patch = 0;
        minor++;
        if (minor > 9) {
            minor = 0;
            major++;
        }
    }

    const newVersion = `${major}.${minor}.${patch}`;
    packageJson.version = newVersion;

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');

    console.log(newVersion);
}

incrementVersion().catch(error => {
    console.error('Error incrementing version:', error);
    process.exit(1);
}); 