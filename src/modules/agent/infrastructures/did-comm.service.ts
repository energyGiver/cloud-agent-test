import { Injectable } from "@nestjs/common";
import { messages, websocket } from "infra-did-comm-js";
import { VCRequirement } from "infra-did-comm-js/dist/src/websocket";

@Injectable()
export class DidCommService {
    private mnemonic =
        "bamboo absorb chief dog box envelope leisure pink alone service spin more";
    private did =
        "did:infra:01:5EX1sTeRrA7nwpFmapyUhMhzJULJSs9uByxHTc6YTAxsc58z";
    private agent: websocket.InfraDIDCommAgent;

    constructor() {
        this.agent = new websocket.InfraDIDCommAgent(
            "https://ws-server.infrablockchain.net",
            this.did,
            this.mnemonic,
            "VERIFIER",
            "wss://did.stage.infrablockspace.net"
        );
        this.agent.setDIDConnectedCallback(this.connectCallback);
    }

    private connectCallback(peerDID: string): void {
        console.log(`${peerDID} connected`);
    }

    public getDID(): string {
        return this.did;
    }

    public async initCreatingConnectRequestMessage(
        context: messages.Context
    ): Promise<string> {
        try {
            this.agent.init();

            const currentTime = Math.floor(Date.now() / 1000);
            const connectRequestMessage =
                await websocket.createConnectRequestMessage(
                    this.agent,
                    currentTime,
                    context
                );

            return connectRequestMessage.encode(
                messages.CompressionLevel.MINIMAL
            );
        } catch (error: any) {
            throw error;
        }
    }

    public async initWithConnectRequest(encoded: string): Promise<any> {
        try {
            await this.agent.initReceivingConnectRequest(encoded);
            if (this.agent.isDIDConnected) {
                return "Connected";
            }
        } catch (error: any) {
            throw error;
        }
    }

    public async requestVP(vcRequirements: VCRequirement[]): Promise<any> {
        try {
            // if (this.agent.isDIDConnected) {
            await this.agent.sendVPReq(vcRequirements);
            // } else {
            //     console.error("DID not connected");
            // }
        } catch (error: any) {
            throw error;
        }
    }
}
