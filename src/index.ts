import express = require("express");
import { parse } from "@iarna/toml";
import { createReadStream } from "fs";
import { isProduction } from "./live";
import { loadServers } from "./server";

const app = express();
const port = 8000;

async function init() {
    console.log(`express server started on port ${port}`);
    let config = await parse.stream(createReadStream("config.toml"));

    let servers = await loadServers(config);
    console.log("xmlrpc connected");
}

console.log(`running in ${isProduction() ? 'production' : 'development'} mode`);
app.listen(port, init);