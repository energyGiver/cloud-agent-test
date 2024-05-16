import { LoggingInterceptor } from "@common/interceptors/logging.interceptor";
import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

import { BadRequestExceptionFilter } from "./common/filters/bad-request-exception.filter";
import { AgentModule } from "./modules/agent/agent.module";

@Module({
    imports: [
        AgentModule,
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "public") // index.html for test
        })
    ],
    controllers: [],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor
        },
        {
            provide: APP_FILTER,
            useClass: BadRequestExceptionFilter
        }
    ]
})
export class AppModule {
    constructor() {}
}
