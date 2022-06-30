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

        // Try to split with a server that can recieve half that server's players
        return this.servers.find((server) => {
            server.updateReservations();
            let max_receivable_players = this.config.split_threshold - server.players.length - server.reservations.length;
            return server != from && player_count / 2 < max_receivable_players;
        })
    }

    public askForMerge(from: GameServer): GameServer {
        let player_count = from.players.length;

        // Try to merge with a server that has players and make sure it's under the split threshold
        return this.servers.find((server) => {
            server.updateReservations();
            return server != from
                && player_count + server.players.length + server.reservations.length < this.config.split_threshold
                && server.players.length > 0;
        });
    }
}