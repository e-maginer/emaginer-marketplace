import mongoose from 'mongoose';
import createError from 'http-errors';
// start the replica set database using the command : run-rs -v 4.4.2 --shell --keep --dbpath /Users/tmuhader/Dev/mongodb-data
(async function() {
    const connString = process.env.MONGO_DB_URL || 'mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019?replicaSet=rs';
    try {
        await mongoose.connect(connString, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        })
    } catch (e) {
        // @todo log the error
        // expose - can be used to signal if message should be sent to the client, defaulting to false when status >= 500
        throw createError(`Error in connecting to database ${e}`, {expose: false});
    }
    const connection = mongoose.connection;
    connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
})();
