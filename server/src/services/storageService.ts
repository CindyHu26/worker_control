
import { Client } from 'minio';
import archiver from 'archiver';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const minioClient = new Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin'
});

const BUCKET_NAME = 'worker-documents';

export const storageService = {
    async init() {
        try {
            const exists = await minioClient.bucketExists(BUCKET_NAME);
            if (!exists) {
                await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
                console.log(`Bucket ${BUCKET_NAME} created successfully`);
            }
        } catch (error) {
            console.error('Error initializing MinIO:', error);
        }
    },

    async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string) {
        // Simple upload logic for future use
        const objectName = `${Date.now()}-${fileName}`;
        await minioClient.putObject(BUCKET_NAME, objectName, fileBuffer, fileBuffer.length, {
            'Content-Type': mimeType
        });
        return {
            bucketName: BUCKET_NAME,
            storageKey: objectName
        };
    },

    async getPresignedUrl(objectName: string, expirySeconds = 3600) {
        return await minioClient.presignedGetObject(BUCKET_NAME, objectName, expirySeconds);
    },

    async streamBatchAsZip(attachmentIds: string[], res: Response) {
        // Fetch attachment metadata from DB
        const attachments = await prisma.attachment.findMany({
            where: {
                id: { in: attachmentIds }
            }
        });

        if (attachments.length === 0) {
            throw new Error('No valid attachments found');
        }

        // Set Headers for Download
        const zipName = `documents-${Date.now()}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);

        // Create Zip Archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Best compression
        });

        // Error handling for archive
        archive.on('error', (err) => {
            console.error('Archiver Error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to create zip archive' });
            } else {
                res.end();
            }
        });

        // Pipe archive data to response
        archive.pipe(res);

        // Append files to archive
        for (const attachment of attachments) {
            try {
                // Get stream from MinIO
                const dataStream = await minioClient.getObject(BUCKET_NAME, attachment.filePath);

                // Append stream to zip with original filename
                archive.append(dataStream, { name: attachment.fileName });
            } catch (error) {
                console.error(`Failed to stream file ${attachment.fileName}:`, error);
                // Continue with other files if one fails, or could create an error log text file in zip
                archive.append(Buffer.from(`Error downloading file: ${error}`), { name: `ERROR-${attachment.fileName}.txt` });
            }
        }

        // Finalize
        await archive.finalize();
    }
};
