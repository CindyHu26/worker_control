const fs = require('fs');
try {
    let output = '';
    const prismaPath = require.resolve('@prisma/client');
    output += 'Resolved @prisma/client: ' + prismaPath + '\n';
    const prismaPackage = require('@prisma/client/package.json');
    output += 'Version: ' + prismaPackage.version + '\n';

    const { PrismaClient } = require('@prisma/client');
    const client = new PrismaClient();
    const model = client._dmmf.datamodel.models.find(m => m.name === 'Deployment');
    output += 'DMMF Datamodel for Deployment: ' + JSON.stringify(model, null, 2) + '\n';

    fs.writeFileSync('prisma_debug_out.txt', output);
} catch (e) {
    fs.writeFileSync('prisma_debug_out.txt', 'Error: ' + e.message + '\n' + e.stack);
}
