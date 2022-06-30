import process = require("process");
import { JsonMap } from "@iarna/toml";

import { RPCPlayer, XmlRPCInterface } from "./xmlrpc";
import { isProduction } from "./live";
import { ServerOperator } from "./operator";

export class GameServer {
    private config;
    private servers: ServerOperator;
    name: string;
    login: string;
    xmlrpc: XmlRPCInterface;
    players: RPCPlayer[];
    spectators: RPCPlayer[];
    reservations: Reservation[];

    constructor(operator, config, name, login, xmlrpc) {
        this.servers = operator;
        this.config = config;
        this.name = name;
        this.login = login;
        this.xmlrpc = xmlrpc;
        this.players = [];
        this.spectators = [];
        this.reservations = [];

        this.init();
    }

    private async init() {
        this.xmlrpc.gbx.on("callback", async (method, params) => this.callback(method, params));
        this.xmlrpc.gbx.on("ManiaPlanet.ModeScriptCallback", async (params) => this.script_callback(params[0], JSON.parse(params[1])));

        let players = await this.xmlrpc.getPlayers();
        this.players = players.filter((p) => p.SpectatorStatus === 0);
        this.spectators = players.filter((p) => p.SpectatorStatus !== 0);
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

                this.reservations.splice(this.reservations.findIndex((r) => r.login == player.Login), 1);
                break;
            case "ManiaPlanet.PlayerDisconnect":
                this.forget(params[0]);
                break;
        }
    }

    private async script_callback(method: string, params: any) {
        switch (method) {
            case "FlagRush.Flow.MatchEnd":
                if (!params.Valid) break;
                if (this.players.length >= this.config.split_threshold) {
                    let other = this.servers.askForSplit(this);

                    // If another server was found, server split occurs
                    if (other) {
                        let leaving_players = this.players.slice(this.players.length / 2 + 1);
                        let logins = leaving_players.map((p) => p.Login);
                        other.reserve(logins);
                        await this.xmlrpc.joinServer(logins, other.login, 15000);

                        // TODO XML-RPC event to notify gamemode
                    }
                }
                break;
        }
    }

    private forget(login: string) {
        this.players.splice(this.players.findIndex((p) => p.Login == login), 1);
        this.spectators.splice(this.spectators.findIndex((p) => p.Login == login), 1);
    }

    public reserve(logins: string[]) {
        let now = Date.now();
        let reserves: Reservation[] = logins.map((login) => {
            return { login, expire: now + this.config.reserve_ttl * 1000 };
        });
        this.reservations.push(...reserves);
        this.updateReservations();
    }

    public updateReservations() {
        let now = Date.now();

        // Remove expired reservations and duplicate logins
        this.reservations = this.reservations.filter((r, index) => {
            return r.expire > now
                && this.reservations.slice(index + 1).find((r2) => r.login === r2.login) === undefined
        });
    }
}

type Reservation = {
    login: string,
    expire: number
}

export async function loadServers(config: JsonMap): Promise<ServerOperator> {
    let env = process.env;
    let operator = new ServerOperator(config);
    let promises = [];
    Object.entries(config.server).forEach((server) => {
        let [name, serverconfig] = server;
        let { dev, login, host, port, username, password, password_env } = serverconfig;
        if (password_env) {
            password = env[password_env];
        }
        if (dev === isProduction()) return; // Don't load dev servers in production, and vice versa

        promises.push(XmlRPCInterface.connect(host, port, username, password).then((xmlrpc) => {
            console.log(`connection to '${name}' succeeded`);
            operator.register(new GameServer(operator, config, name, login, xmlrpc));
        }));
    })
    await Promise.all(promises);
    return operator;
}
