import winston from "winston";
import {dirname,join} from 'path';
import { fileURLToPath } from "url";

// export a function (substack pattern) that represents the single responsibility of the module honoring the small surface area principle.
// This is convenient and encourage the single-responsibility principle and
// expose only one clear interface, which provides an entry point for the module.
export default function createLogger(module) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const { combine, timestamp, simple, label } = winston.format;
    /* todo:
        add DailyRotateFile transport
        replace synch with async for logging in a file
        externalize logging level to conf file
        add the request route/path and verb to the logging
        use Winston to log messages from Morgan https://coralogix.com/log-analytics-blog/complete-winston-logger-guide-with-hands-on-examples/
     *
     */

    const logger =  winston.createLogger({
        level: process.env.LOGGING_LEVEL,
        format: combine(
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            label({ label:module }),
            winston.format.json()
        ),
        defaultMeta: { service: 'Emaginer'},
        transports: [
            //  level: Level of messages that this transport should log (default: level set on parent logger.js)
            // we keep default as explicitly setting the level to 'info' is not working so this file transport inherit its
            // log level from the logger configuration
            new winston.transports.File({ filename: join(__dirname,'..','..','logs','EM-combined.log'), }),
            new winston.transports.File({ filename: join(__dirname,'..','..','logs','EM-error.log') , level: 'error'})
        ]
    })
    if(process.env.NODE_ENV === 'development'){
        logger.add(new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                simple()
            )

        }))
    }
    return logger;
}