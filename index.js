const dashdash = require("dashdash")
const path = require("path")
const util = require("util")
const fs = require("fs")
const chalk = require("chalk")
const packageJSON = require("./package.json")
const { Packager } = require("./src/packager")
const { CodeSigner } = require("./src/codesigner")
const { DMGer } = require("./src/dmger")

const CLI_OPTIONS = [
  {
    names: ["version", "v"],
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
    names: ["output-path"],
    type: "string",
    env: "MESHBLU_CONNECTOR_OUTPUT_PATH",
    help: "Deploy path where assets are located. Defaults to current directory/installer",
    helpArg: "PATH",
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

    if (!opts.deploy_path) {
      opts.deploy_path = path.join(process.cwd(), "deploy")
    }

    opts.deploy_path = path.resolve(opts.deploy_path)

    if (!opts.output_path) {
      opts.output_path = path.join(process.cwd(), "installer")
    }

    opts.output_path = path.resolve(opts.output_path)

    if (opts.help) {
      console.log(`usage: meshblu-connector-installer [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true })}`)
      process.exit(0)
    }

    if (opts.version) {
      console.log(packageJSON.version)
      process.exit(0)
    }

    return opts
  }

  async run() {
    const options = this.parseArgv({ argv: this.argv })
    const { type, title, deploy_path, cert_password, output_path } = options
    const outputPath = output_path
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

    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath)

    try {
      await this.buildInstaller({ type, title, deployPath, outputPath })
    } catch (error) {
      this.die(error)
    }

    try {
      await this.signInstaller({ type, outputPath, certPassword })
    } catch (error) {
      this.die(error)
    }

    try {
      await this.createDMG({ title, outputPath })
    } catch (error) {
      this.die(error)
    }
  }

  buildInstaller({ type, title, deployPath, outputPath }) {
    const packager = new Packager({ type, title, deployPath, outputPath })
    return packager.package()
  }

  signInstaller({ type, outputPath, certPassword }) {
    const filePath = path.join(outputPath, "Installer.pkg")
    const codeSigner = new CodeSigner({ certPassword, filePath, outputPath })
    return codeSigner.sign()
  }

  createDMG({ title, outputPath }) {
    const dmger = new DMGer({ title, outputPath })
    return dmger.create()
  }

  die(error) {
    console.error("Meshblu Connector Installer Command: error: %s", error.message)
    process.exit(1)
  }
}

module.exports.MeshbluConnectorInstallerCommand = MeshbluConnectorInstallerCommand
