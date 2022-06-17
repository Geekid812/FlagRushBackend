import express = require("express");
import { XmlRPCInterface } from "./xmlrpc";

const app = express();
const port = 8000;

async function init() {
    console.log(`express server started on port ${port}`);
    let xmlrpc = await XmlRPCInterface.connect();
    console.log("xmlrpc connected");
}

app.listen(port, init);