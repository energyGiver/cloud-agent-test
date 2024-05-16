import { MiddlewareConsumer, Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { AgentController } from "./app/agent.controller";
import { DidCommService } from "./infrastructures/did-comm.service";

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        { provide: "DidCommService", useClass: DidCommService },
    ],
    controllers: [AgentController]
})
export class AgentModule {
    configure(consumer: MiddlewareConsumer) {
        const { } = consumer;
    }
}
