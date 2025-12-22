const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    default: {
        requireModule: ['ts-node/register'],
        require: ['features/step_definitions/*.ts', 'features/support/*.ts'],
        format: ['progress-bar', 'summary'],
        paths: ['features/**/*.feature']
    }
}
