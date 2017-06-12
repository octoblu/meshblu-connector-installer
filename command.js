#!/usr/bin/env node
const dashdash = require("dashdash")
const path = require("path")
const chalk = require("chalk")
const ora = require("ora")
const { MeshbluConnectorInstaller } = require("./src/installer")

const CLI_OPTIONS = [
  {
    name: "version",
    type: "bool",
    help: "Print connector version and exit.",
  },
  {
    names: ["help", "h"],
    type: "bool",
    help: "Print this help and exit.",
  },
  {
    names: ["connector-path"],
    type: "string",
    env: "MESHBLU_CONNECTOR_PATH",
    help: "Path to connector package.json and assets",
    helpArg: "PATH",
    default: ".",
  },
  {
    names: ["cert-password"],
    type: "string",
    env: "MESHBLU_CONNECTOR_CERT_PASSWORD",
    help: "Password to unlock .p12 certificate",
    helpArg: "PASSWORD",
  },
]

class MeshbluConnectorInstallerMacOSCommand {
  constructor(options) {
    if (!options) options = {}
    var { argv, cliOptions } = options
    if (!cliOptions) cliOptions = CLI_OPTIONS
    if (!argv) return this.die(new Error("MeshbluConnectorInstallerMacOSCommand requires options.argv"))
    this.argv = argv
    this.cliOptions = cliOptions
    this.parser = dashdash.createParser({ options: this.cliOptions })
  }

  parseArgv({ argv }) {
    try {
      var opts = this.parser.parse(argv)
    } catch (e) {
      return {}
    }

    if (opts.help) {
      console.log(`usage: meshblu-connector-installer-macos [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`)
      process.exit(0)
    }

    if (opts.version) {
      console.log(this.packageJSON.version)
      process.exit(0)
    }

    return opts
  }

  async run() {
    const options = this.parseArgv({ argv: this.argv })
    const { connector_path, cert_password } = options
    var errors = []
    if (!connector_path) errors.push(new Error("MeshbluConnectorInstallerMacOSCommand requires --connector-path or MESHBLU_CONNETOR_PATH"))
    if (!cert_password) errors.push(new Error("MeshbluConnectorInstallerMacOSCommand requires --cert-password or MESHBLU_CONNECTOR_CERT_PASSWORD"))

    if (errors.length) {
      console.log(`usage: meshblu-connector-installer-macos [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`)
      errors.forEach(error => {
        console.error(chalk.red(error.message))
      })
      process.exit(1)
    }

    const spinner = ora("Building package").start()

    const installer = new MeshbluConnectorInstaller({ connectorPath: path.resolve(connector_path), spinner, certPassword: cert_password })
    try {
      await installer.build()
    } catch (error) {
      console.error(error.stack)
      return spinner.fail(error.message)
    }
    spinner.succeed("Ship it!")
  }

  die(error) {
    console.error("Meshblu Connector Installer MacOs Command: error: %s", error.message)
    process.exit(1)
  }
}

const command = new MeshbluConnectorInstallerMacOSCommand({ argv: process.argv })
command.run().catch(error => {
  console.error(error)
})
