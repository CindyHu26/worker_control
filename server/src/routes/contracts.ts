
import express from 'express';
import multer from 'multer';
import { contractService } from '../services/contractService';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create a contract (with optional file)
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const {
            employerId,
            contractNumber,
            type,
            startDate,
            endDate,
            serviceFee,
            signedDate,
            status,
            notes
        } = req.body;

        // Convert date strings to Date objects
        const contractData = {
            employerId,
            contractNumber,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            serviceFee: serviceFee ? Number(serviceFee) : 0,
            signedDate: signedDate ? new Date(signedDate) : null,
            status,
            notes,
        };

        const result = await contractService.createContract(contractData, file ? {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype
        } : undefined);

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating contract:', error);
        res.status(500).json({ error: 'Failed to create contract' });
    }
});

// Get contracts by employer
router.get('/employer/:employerId', async (req, res) => {
    try {
        const contracts = await contractService.getContractsByEmployer(req.params.employerId);
        res.json(contracts);
    } catch (error) {
        console.error('Error fetching contracts:', error);
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
});

// Update contract
router.patch('/:id', async (req, res) => {
    try {
        // Extract only fields that are allowed to be updated or exist in body
        const {
            contractNumber,
            type,
            startDate,
            endDate,
            serviceFee,
            signedDate,
            status,
            notes
        } = req.body;

        const updateData: any = {};
        if (contractNumber !== undefined) updateData.contractNumber = contractNumber;
        if (type !== undefined) updateData.type = type;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);
        if (serviceFee !== undefined) updateData.serviceFee = Number(serviceFee);
        if (signedDate !== undefined) updateData.signedDate = signedDate ? new Date(signedDate) : null;
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        const contract = await contractService.updateContract(req.params.id, updateData);
        res.json(contract);
    } catch (error) {
        console.error('Error updating contract:', error);
        res.status(500).json({ error: 'Failed to update contract' });
    }
});

// Delete contract
router.delete('/:id', async (req, res) => {
    try {
        await contractService.deleteContract(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting contract:', error);
        res.status(500).json({ error: 'Failed to delete contract' });
    }
});

export const contractsRouter = router;
