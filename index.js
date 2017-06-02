const dashdash = require("dashdash")
const path = require("path")

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
    names: ["platform", "p"],
    type: "string",
    env: "MESHBLU_CONNECTOR_INSTALLER_PLATFORM",
    help: "Platform to build for",
    helpArg: "PLATFORM",
  },
]

class MeshbluConnectorInstallerCommand {
  constructor(options) {
    if (!options) options = {}
    var { argv, cliOptions } = options
    if (!cliOptions) cliOptions = CLI_OPTIONS
    if (!argv) return this.die(new Error("MeshbluConnectorInstallerCommand requires options.argv"))
    this.argv = argv
    this.cliOptions = cliOptions
  }

  parseArgv({ argv, options }) {
    var parser = dashdash.createParser({ options })
    try {
      var opts = parser.parse(argv)
    } catch (e) {
      return {}
    }
    if (opts.help) {
      console.log(`usage: meshblu-connector-installer [OPTIONS]\noptions:\n${parser.help({ includeEnv: true })}`)
      process.exit(0)
    }

    if (opts.version) {
      console.log(this.packageJSON.version)
      process.exit(0)
    }

    return opts
  }

  run() {
    const options = this.parseArgv({
      argv: this.argv,
      options: this.cliOptions,
    })
    const { target } = options
    if (!target) return this.die(new Error("MeshbluConnectorCommand requires --target or MESHBLU_CONNECTOR_INSTALLER_TARGET"))
  }

  die(error) {
    console.error("Meshblu Connector Installer Command: error: %s", error.message)
    process.exit(1)
  }
}

module.exports.MeshbluConnectorInstallerCommand = MeshbluConnectorInstallerCommand
