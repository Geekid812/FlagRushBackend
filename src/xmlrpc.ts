import { GbxClient } from "@evotm/gbxclient";

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

    public async joinServer(logins: string[], serverlogin: string, delay: number) {
        let manialink = `
        <manialink version="3" name="FlagRushBackend_JoinServer">
        <script><!--
        sleep(${delay});
        OpenLink("#qjoin=${serverlogin}@Trackmania", CMlScript::LinkType::ManialinkBrowser);
        --></script>
        </manialink>
        `;
        await this.gbx.call("SendDisplayManialinkPageToLogin", logins.join(","), manialink, 0, false);
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