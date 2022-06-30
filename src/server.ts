import process = require("process");
import { JsonMap } from "@iarna/toml";

import { RPCPlayer, XmlRPCInterface } from "./xmlrpc";
import { isProduction } from "./live";

export class GameServer {
    name: string;
    login: string;
    xmlrpc: XmlRPCInterface;
    players: RPCPlayer[];
    spectators: RPCPlayer[];

    constructor(name, login, xmlrpc) {
        this.name = name;
        this.login = login;
        this.xmlrpc = xmlrpc;
        this.players = [];
        this.spectators = [];

        xmlrpc.gbx.on("callback", async (method, params) => this.callback(method, params));
        this.init();
    }

    private async init() {
        let players = await this.xmlrpc.getPlayers();
        this.players = players.filter((p) => p.SpectatorStatus === 0);
        this.spectators = players.filter((p) => p.SpectatorStatus !== 0);
        console.log(this.players, this.spectators);
    }

    private async callback(method: string, params: any) {
        switch (method) {
            case "ManiaPlanet.PlayerInfoChanged":
                let player: RPCPlayer = params[0];
                this.forget(player.Login);

                if (player.SpectatorStatus === 0) {
                    this.players.push(player);
                } else {
                    this.spectators.push(player);
                }
                break;
            case "ManiaPlanet.PlayerDisconnect":
                this.forget(params[0]);
                break;
        }
    }

    private forget(login: string) {
        this.players.splice(this.players.findIndex((p) => p.Login == login), 1);
        this.spectators.splice(this.spectators.findIndex((p) => p.Login == login), 1);
    }
}

export async function loadServers(config: JsonMap): Promise<GameServer[]> {
    let env = process.env;
    let servers = [];
    let promises = [];
    Object.entries(config.server).forEach((server) => {
        let [name, config] = server;
        let { dev, login, host, port, username, password, password_env } = config;
        if (password_env) {
            password = env[password_env];
        }
        if (dev === isProduction()) return; // Don't load dev servers in production, and vice versa

        promises.push(XmlRPCInterface.connect(host, port, username, password).then((xmlrpc) => {
            console.log(`connection to '${name}' succeeded`);
            servers.push(new GameServer(name, login, xmlrpc));
        }));
    })
    await Promise.all(promises);
    return servers;
}
