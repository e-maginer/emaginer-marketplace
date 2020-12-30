import mongoose from 'mongoose';
import createError from 'http-errors';
// start the replica set database using the command : run-rs -v 4.4.2 --shell
const connString = process.env.MONGO_DB_URL || 'mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs';
    try {
        await mongoose.connect(connString, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        })
    }catch (e) {
        // @todo log the error
        // expose - can be used to signal if message should be sent to the client, defaulting to false when status >= 500
        throw createError(`Error in connecting to database ${e}`,{expose: false});
    }
    const connection = mongoose.connection;
    connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

