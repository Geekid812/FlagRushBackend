import { GbxClient } from "@evotm/gbxclient";
import { DisplayMatchInfo } from "./manialink";

// Use the same version as PyPlanet
const apiVersion = '2013-04-16';

export class XmlRPCInterface {
    gbx: GbxClient;

    constructor(client: GbxClient) {
        this.gbx = client;
    }

    public static async connect(host: string = "127.0.0.1", port: number = 5000, name: string = "SuperAdmin", pass: string = "SuperAdmin"): Promise<XmlRPCInterface> {
        const client = new GbxClient();
        await client.connect(host, port);
        await client.call("Authenticate", name, pass);
        await client.multicall([
            ["SetApiVersion", apiVersion],
            ["EnableCallbacks", true]
        ]);
        await client.callScript("XmlRpc.EnableCallbacks", "true");

        return new XmlRPCInterface(client);
    }

    public async getPlayers(): Promise<RPCPlayer[]> {
        let res: RPCPlayer[] = await this.gbx.call("GetPlayerList", -1, 0);

        // Filter out the server account
        return res.filter((p) => p.PlayerId !== 0);
    }

    public joinServer(logins: string[], serverlogin: string, delay: number) {
        setTimeout(async () => {
            try {
                await this.gbx.call("SendOpenLinkToLogin", logins.join(","), `#qjoin=${serverlogin}@Trackmania`, 1);
            } catch (e) {
                if (e.faultString == "Login unknown.") return;
                throw e;
            }
        }, delay);
    }

    public joinServerAsSpectator(logins: string[], serverlogin: string, delay: number) {
        setTimeout(async () => {
            try {
                await this.gbx.call("SendOpenLinkToLogin", logins.join(","), `#qspectate=${serverlogin}@Trackmania`, 1);
            } catch (e) {
                if (e.faultString == "Login unknown.") return;
                throw e;
            }
        }, delay);
    }

    public async sendMatchInfo(logins: string[], info: string) {
        let manialink = DisplayMatchInfo(info);
        await this.gbx.call("SendDisplayManialinkPageToLogin", logins.join(","), manialink, 30000, false);
    }
}

export type RPCPlayer = {
    Login: string,
    NickName: string,
    PlayerId: number,
    TeamId: number,
    SpectatorStatus: number,
    LadderRanking: number,
    Flags: number,
    LadderScore: number
}