import process = require("process");
import { JsonMap } from "@iarna/toml";

import { XmlRPCInterface } from "./xmlrpc";
import { isProduction } from "./live";

export type GameServer = {
    name: string,
    login: string,
    xmlrpc: XmlRPCInterface
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
            servers.push({ name, login, xmlrpc });
        }));
    })
    await Promise.all(promises);
    return servers;
}
