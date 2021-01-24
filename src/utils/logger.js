import winston from "winston";

export default function createLogger() {
    const logger =  winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'Emaginer'},
       /* transports: [
            //  level: Level of messages that this transport should log (default: level set on parent logger)
            new winston.transports.File({ filename: 'EM-error.log', level: 'error'}),
            new winston.transports.File({ filename: 'EM-combined.log'})
        ]*/
    })
    if(process.env.NODE_ENV === 'development'){
        logger.add(new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )

        }))
    }
    return logger;
}