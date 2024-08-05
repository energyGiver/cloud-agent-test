import { Injectable } from "@nestjs/common";
import * as comm from "infra-did-comm-js";
import { VerifiablePresentation } from "infra-did-js";

@Injectable()
export class DidCommService {
    private mnemonic =
        "bamboo absorb chief dog box envelope leisure pink alone service spin more";
    private did =
        "did:infra:01:5EX1sTeRrA7nwpFmapyUhMhzJULJSs9uByxHTc6YTAxsc58z";
    private agent: comm.InfraDIDCommAgent;

    constructor() {
        this.agent = new comm.InfraDIDCommAgent(
            "https://ws-server.infrablockchain.net",
            this.did,
            this.mnemonic,
            "VERIFIER",
            "wss://did.stage.infrablockspace.net"
        );
        this.agent.setDIDConnectedCallback(this.connectCallback);
        this.agent.setVPVerifyCallback(this.VPVerifyCallback);
        this.agent.init();
    }

    private connectCallback(peerDID: string): void {
        console.log(`${peerDID} connected`);
    }

    private VPVerifyCallback(VP: VerifiablePresentation): boolean {
        console.log("VPVerifyCallback", VP)
        return true;
    }

    public getDID(): string {
        return this.did;
    }

    public async initCreatingConnectRequestMessage(
        context: comm.Context
    ): Promise<string> {
        try {
            this.agent.init();

            const currentTime = Math.floor(Date.now() / 1000);
            const connectRequestMessage =
                await comm.createConnectRequestMessage(
                    this.agent,
                    currentTime,
                    context
                );

            return connectRequestMessage.encode(
                comm.CompressionLevel.MINIMAL
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

    public async requestVP(vcRequirements: comm.VCRequirement[]): Promise<any> {
        try {
            await this.agent.sendVPReq(vcRequirements);
        } catch (error: any) {
            throw error;
        }
    }
}
