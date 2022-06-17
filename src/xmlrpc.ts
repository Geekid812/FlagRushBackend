import { GbxClient } from "@evotm/gbxclient";


export class XmlRPCInterface {
    gbx: GbxClient;

    constructor(client: GbxClient) {
        this.gbx = client;
    }

    public static async connect(host: string = "127.0.0.1", port: number = 5000, name: string = "SuperAdmin", pass: string = "SuperAdmin"): Promise<XmlRPCInterface> {
        const client = new GbxClient();
        await client.connect(host, port);
        await client.call("Authenticate", name, pass);
        
        return new XmlRPCInterface(client);
    }
}