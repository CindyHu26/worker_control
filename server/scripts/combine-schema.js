
const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '../prisma/schema');
const outputFile = path.join(__dirname, '../prisma/schema.prisma');

async function main() {
    console.log('Reading schema files from:', schemaDir);
    const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.prisma'));

    // Ensure config.prisma is first if it exists, or handling generator/datasource ordering
    // Actually, Prisma schema order doesn't strictly matter for model references, 
    // but datasource/generator might need to be at top for readability/convention.
    // We will just alphabetical sort, as Prisma parser handles blocks fine.

    files.sort((a, b) => {
        if (a === 'config.prisma') return -1;
        if (b === 'config.prisma') return 1;
        return a.localeCompare(b);
    });

    let combined = '';

    for (const file of files) {
        console.log('Adding:', file);
        const content = fs.readFileSync(path.join(schemaDir, file), 'utf8');
        combined += `\n// --- ${file} ---\n`;
        combined += content;
        combined += '\n'; // Ensure newline
    }

    fs.writeFileSync(outputFile, combined);
    console.log('wrote to:', outputFile);
}

main();
