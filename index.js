const dashdash = require("dashdash")
const path = require("path")
const createPackage = require("@octoblu/osx-pkg")
const fs = require("fs")
const chalk = require("chalk")
const { CodeSign } = require("./codesign")

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
    names: ["title"],
    type: "string",
    env: "MESHBLU_CONNECTOR_TITLE",
    help: "Installer title",
    helpArg: "TITLE",
  },
  {
    names: ["type"],
    type: "string",
    env: "MESHBLU_CONNECTOR_TYPE",
    help: "meshblu connector type",
    helpArg: "TYPE",
  },
  {
    names: ["deploy-path"],
    type: "string",
    env: "MESHBLU_CONNECTOR_DEPLOY_PATH",
    help: "Deploy path where assets are located. Defaults to current directory/deploy",
    helpArg: "PATH",
  },
  {
    names: ["cert-password"],
    type: "string",
    env: "MESHBLU_CONNECTOR_CERT_PASSWORD",
    help: "Password to unlock .p12 certificate",
    helpArg: "PASSWORD",
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
    this.parser = dashdash.createParser({ options: this.cliOptions })
  }

  parseArgv({ argv }) {
    try {
      var opts = this.parser.parse(argv)
    } catch (e) {
      return {}
    }

    if (!opts.deployPath) {
      opts.deployPath = path.join(process.cwd(), "deploy")
    }

    opts.deployPath = path.resolve(opts.deployPath)

    if (opts.help) {
      console.log(`usage: meshblu-connector-installer [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true })}`)
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
    const { type, title, deploy_path, cert_password } = options
    const deployPath = deploy_path
    const certPassword = cert_password
    var errors = []
    if (!type) errors.push(new Error("MeshbluConnectorCommand requires --type or MESHBLU_CONNECTOR_TYPE"))
    if (!title) errors.push(new Error("MeshbluConnectorCommand requires --title or MESHBLU_CONNECTOR_TITLE"))
    if (!certPassword) errors.push(new Error("MeshbluConnectorCommand requires --cert-password or MESHBLU_CONNECTOR_CERT_PASSWORD"))

    if (errors.length) {
      console.log(`usage: meshblu-connector-installer [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true })}`)
      errors.forEach(error => {
        console.error(chalk.red(error.message))
      })
      process.exit(1)
    }

    await this.buildInstaller({ type, title, deployPath })
    try {
      await this.signInstaller({ type, deployPath, certPassword })
    } catch (error) {
      console.error(error)
    }
  }

  buildInstaller({ type, title, deployPath }) {
    const installerPath = path.join(deployPath, "Installer.pkg")
    const installLocation = `/Library/MeshbluConnectors/${type}`
    const opts = {
      dir: deployPath,
      installLocation: installLocation,
      identifier: `.com.octoblu.connectors.${type}.pkg`,
      title: title,
    }

    return new Promise((resolve, reject) => {
      const stream = createPackage(opts)
      stream.pipe(fs.createWriteStream(installerPath))
      stream.on("end", resolve)
      stream.on("error", reject)
    })
  }

  signInstaller({ type, deployPath, certPassword }) {
    const filePath = path.join(deployPath, "Installer.pkg")
    const codeSign = new CodeSign({ certPassword, filePath, deployPath })
    return codeSign.sign()
  }

  die(error) {
    console.error("Meshblu Connector Installer Command: error: %s", error.message)
    process.exit(1)
  }
}

module.exports.MeshbluConnectorInstallerCommand = MeshbluConnectorInstallerCommand
