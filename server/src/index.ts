import app from './app';
import dotenv from 'dotenv';
import { initScheduler } from './services/scheduler';
import { addressService } from './services/addressService';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Init Address Translation Service
addressService.loadAddressDatasets();

// Init Cron Jobs
initScheduler();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
