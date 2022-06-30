import { GameServer } from "./server";


export class ServerOperator {
    private config;
    servers: GameServer[];

    constructor(config) {
        this.config = config;
        this.servers = [];
    }

    public register(server: GameServer) {
        this.servers.push(server);
    }

    public unregister(server: GameServer) {
        this.servers.splice(this.servers.indexOf(server), 1);
    }

    public askForSplit(from: GameServer): GameServer {
        let player_count = from.players.length;
        return this.servers.find((server) => {
            server.updateReservations();
            let max_receivable_players = this.config.split_threshold - server.players.length - server.reservations.length;
            return player_count / 2 < max_receivable_players;
        })
    }
}