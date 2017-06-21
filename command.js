#!/usr/bin/env node
const OctoDash = require("octodash")
const path = require("path")
const ora = require("ora")
const packageJSON = require("./package.json")
const { MeshbluConnectorInstaller } = require("./src/installer")

const CLI_OPTIONS = [
  {
    names: ["connector-path"],
    type: "string",
    required: true,
    env: "MESHBLU_CONNECTOR_PATH",
    help: "Path to connector package.json and assets",
    helpArg: "PATH",
    default: ".",
    completionType: "file",
  },
  {
    names: ["destination-path"],
    type: "string",
    required: true,
    env: "MESHBLU_DESTINATION_PATH",
    help: "Path for bin files to be placed in installer",
    helpArg: "PATH",
    completionType: "file",
  },
  {
    names: ["cert-password"],
    type: "string",
    required: true,
    env: "MESHBLU_CONNECTOR_CERT_PASSWORD",
    help: "Password to unlock .p12 certificate",
    helpArg: "PASSWORD",
  },
]

class MeshbluConnectorInstallerMacOSCommand {
  constructor({ argv, cliOptions = CLI_OPTIONS } = {}) {
    this.octoDash = new OctoDash({
      argv,
      cliOptions,
      name: packageJSON.name,
      version: packageJSON.version,
    })
  }

  async run() {
    const { connectorPath, certPassword, destinationPath } = this.octoDash.parseOptions()
    const spinner = ora("Building package").start()
    const installer = new MeshbluConnectorInstaller({
      connectorPath: path.resolve(connectorPath),
      destinationPath,
      certPassword,
      spinner,
    })
    try {
      await installer.build()
    } catch (error) {
      console.error(error.stack)
      return spinner.fail(error.message)
    }
    spinner.succeed("Ship it!")
  }
}

const command = new MeshbluConnectorInstallerMacOSCommand({ argv: process.argv })
command.run().catch(error => {
  console.error(error)
})
