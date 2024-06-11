import { Controller, Get, HttpCode, Inject, Query } from "@nestjs/common";
import { config } from "@src/config";
import * as comm from "infra-did-comm-js";
import * as qrcode from "qrcode";

import { VCRequirement } from "infra-did-comm-js/dist/src/websocket";
import { DidCommService } from "../infrastructures/did-comm.service";

const issuerDID =
    "did:infra:01:5EX1sTeRrA7nwpFmapyUhMhzJULJSs9uByxHTc6YTAxsc58z";

@Controller("agent")
export class AgentController {
    constructor(
        @Inject("DidCommService")
        private readonly didCommService: DidCommService
    ) {}

    @Get("static")
    @HttpCode(200)
    async getStaticConnectionInfo(): Promise<any> {
        try {
            const result = {
                did: this.didCommService.getDID(),
                serviceEndpoint: `${config.serverEndpoint}/agent`,
                context: comm.messages.Context.fromJson({
                    domain: "newnal",
                    action: "connect"
                })
            };
            const data = Buffer.from(JSON.stringify(result)).toString("base64");
            const qrCodeDataURL = await qrcode.toDataURL(data);
            return `<img src="${qrCodeDataURL}" alt="QR Code" />`;
        } catch (error) {
            throw error;
        }
    }

    @Get("connect-request")
    async getConnectRequest(): Promise<any> {
        try {
            const context = comm.messages.Context.fromJson({
                domain: "newnal",
                action: "connect"
            });
            const result =
                await this.didCommService.initCreatingConnectRequestMessage(
                    context
                );

            const qrCodeDataURL = await qrcode.toDataURL(result);
            return `<img src="${qrCodeDataURL}" alt="QR Code" />`;
        } catch (error) {
            throw error;
        }
    }

    @Get()
    @HttpCode(200)
    async receive(@Query("data") data: string): Promise<any> {
        try {
            const res = await this.didCommService.initWithConnectRequest(data);
            return res;
        } catch (error) {
            throw error;
        }
    }

    @Get("vp-submit")
    async postConnectRequest(): Promise<any> {
        try {
            const context = comm.messages.Context.fromJson({
                domain: "newnal",
                action: "connect"
            });
            const vcRequirement: VCRequirement[] = [
                {
                    vcType: "https://schema.org",
                    issuer: "did:infra:01:5EX1sTeRrA7nwpFmapyUhMhzJULJSs9uByxHTc6YTAxsc58z"
                }
            ];

            await this.didCommService.requestVP(vcRequirement);
            return "OK";
        } catch (error) {
            throw error;
        }
    }
}
