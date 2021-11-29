import mongoose from 'mongoose';

const secretCodeSchema = new mongoose.Schema({
        email: {
            type: String,
            required: true
        },
        code: {
            type: String,
            required: true,
        },
        dateCreated: {
            type: Date,
            default: Date.now,
            //todo use the package ms various time formats to milliseconds https://www.npmjs.com/package/ms
            expires: 600
        }
    }, {
        timestamps: true
    }
);

export default mongoose.model('SecretCode', secretCodeSchema);