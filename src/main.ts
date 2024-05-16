import { config } from "@config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { json } from "body-parser";
import rTracer from "cls-rtracer";
import rateLimit from "express-rate-limit";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";

import { AppModule } from "./app.module";
import { BadRequestExceptionFilter } from "./common/filters/bad-request-exception.filter";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { errorStream, logger } from "./config/modules/winston";

async function bootstrap() {
    try {
        const app = await NestFactory.create<NestExpressApplication>(
            AppModule,
            {}
        );
        app.useGlobalPipes(new ValidationPipe());
        app.useGlobalFilters(new BadRequestExceptionFilter());
        app.useGlobalInterceptors(new TimeoutInterceptor());
        app.use(helmet());

        app.use(rTracer.expressMiddleware());

        app.use(json({ limit: "50mb" }));

        // const mqService =
        //     await NestFactory.createMicroservice<MicroserviceOptions>(
        //         AppModule,
        //         {
        //             transport: Transport.RMQ,
        //             options: {
        //                 urls: ["amqp://localhost:5672"],
        //                 queue: "cats_queue",
        //                 queueOptions: {
        //                     durable: false
        //                 }
        //             }
        //         }
        //     );

        // Swagger
        const swagger = JSON.parse(
            fs.readFileSync(__dirname + "/../public/swagger.json", "utf8")
        );
        SwaggerModule.setup("api-doc", app, swagger as OpenAPIObject);

        // CORS
        const corsWhiteList = "*";
        app.enableCors({
            origin: (origin, callback) => {
                if (
                    corsWhiteList.indexOf("*") !== -1 ||
                    corsWhiteList.indexOf(origin) !== -1
                ) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed"));
                }
            },
            allowedHeaders:
                "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe, authorization",
            methods: "GET, PUT, POST, DELETE, UPDATE, OPTIONS",
            credentials: true
        });

        // rateLimit
        app.use(
            rateLimit({
                windowMs: 1000 * 60 * 60, // an hour
                max: config.rateLimitMax, // limit each IP to 100 requests per windowMs
                message:
                    "⚠️  Too many request created from this IP, please try again after an hour"
            })
        );

        app.use(
            morgan("tiny", {
                skip(req, res) {
                    return res.statusCode < 400;
                },
                stream: errorStream
            })
        );

        app.use("*", (req, res, next) => {
            const query = req.query.query || req.body.query || "";
            if (query.length > 2000) {
                throw new Error("Query too large");
            }
            next();
        });

        app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        scriptSrc: ["'self'", "'unsafe-inline'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        imgSrc: ["'self'", "data:"],
                        connectSrc: [
                            "'self'",
                            "http://localhost:8000",
                            "http://127.0.0.1:8000"
                        ]
                    }
                }
            })
        );

        await app.listen(config.port, () => {
            !config.isProduction
                ? logger.info(
                      `🚀  Server ready at http://${config.host}:${config.port}`,
                      { context: "BootStrap" }
                  )
                : logger.info(
                      `🚀  Server is listening on port ${config.port}`,
                      { context: "BootStrap" }
                  );

            !config.isProduction &&
                logger.info(
                    `🚀  Subscriptions ready at ws://${config.host}:${config.port}`,
                    { context: "BootStrap" }
                );
        });
    } catch (error: any) {
        logger.error(`❌  Error starting server, ${error.message}`, {
            context: "BootStrap"
        });
        process.exit();
    }
}

bootstrap();
