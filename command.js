#!/usr/bin/env node

const { MeshbluConnectorInstallerCommand } = require("./index")
const command = new MeshbluConnectorInstallerCommand({ argv: process.argv })
command.run()
