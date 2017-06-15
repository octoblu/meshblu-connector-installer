const fs = require("fs-extra")
const Promise = require("bluebird")
const glob = Promise.promisify(require("glob"))
const parseTemplate = require("json-templates")
const path = require("path")
const createPackage = require("@octoblu/osx-pkg")
const { DMGCodeSigner } = require("./dmg-codesigner")
const { PKGCodeSigner } = require("./pkg-codesigner")
const { DMGer } = require("./dmger")
const debug = require("debug")("meshblu-connector-installer-macos")

class MeshbluConnectorInstaller {
  constructor({ connectorPath, spinner, certPassword, destinationPath }) {
    this.connectorPath = path.resolve(connectorPath)
    this.spinner = spinner
    this.certPassword = certPassword
    this.packageJSON = fs.readJsonSync(path.join(this.connectorPath, "package.json"))
    this.type = this.packageJSON.name
    this.version = this.packageJSON.version
    this.arch = "macos"
    this.target = this.getTarget()
    this.macosPackageName = `${this.type}_${this.version}-${this.arch}`
    this.deployPath = path.join(this.connectorPath, "deploy", this.target)
    this.deployCachePath = path.join(this.deployPath, ".cache")
    this.deployInstallersPath = path.join(this.deployPath, "installers")
    this.installerPKGPath = path.join(this.deployCachePath, "Installer.pkg")
    this.installerDMGPath = path.join(this.deployInstallersPath, this.macosPackageName + ".dmg")
    this.destinationPath = destinationPath || `/Library/MeshbluConnectors/${this.type}`
    this.templateData = {
      type: this.type,
      version: this.version,
      arch: this.arch,
      description: this.packageJSON.description,
    }
  }

  build() {
    return this.copyTemplates().then(() => this.copyAssets()).then(() => this.buildPackage()).then(() => this.signPackage()).then(() => this.createDMG())
    // .then(() => this.signDMG())
  }

  getTarget() {
    let { arch, platform } = process
    if (platform === "darwin") platform = "macos"
    if (platform === "win32") platform = "win"
    if (arch === "ia32") arch = "x86"
    if (arch === "arm") arch = "armv7"

    const nodeVersion = "8"
    return `node${nodeVersion}-${platform}-${arch}`
  }

  copyAssets() {
    this.spinner.text = "Copying pkg assets"
    const destination = path.join(this.deployCachePath, this.macosPackageName)
    const source = path.join(this.deployPath, "bin")
    debug("copy pkg assets", { source, destination })
    return fs
      .pathExists(source)
      .then(exists => {
        if (!exists) {
          return Promise.reject(new Error(`Source path does not exist: ${source}`))
        }
        return fs.ensureDir(destination)
      })
      .then(() => fs.copy(source, destination))
  }

  buildPackage() {
    this.spinner.text = "Building package"
    debug("building package")
    const opts = {
      dir: path.join(this.deployCachePath, this.macosPackageName),
      installLocation: this.destinationPath,
      identifier: `.com.octoblu.connectors.${this.type}.pkg`,
      title: this.type,
    }

    return new Promise((resolve, reject) => {
      const stream = createPackage(opts)
      stream.pipe(fs.createWriteStream(this.installerPKGPath))
      stream.on("end", resolve)
      stream.on("error", reject)
    })
  }

  signPackage() {
    this.spinner.text = "Signing package"
    debug("signing package")
    const codeSigner = new PKGCodeSigner({
      certPassword: this.certPassword,
      filePath: this.installerPKGPath,
      cachePath: this.deployCachePath,
    })
    return codeSigner.sign()
  }

  signDMG() {
    this.spinner.text = "Signing DMG"
    debug("signing dmg")
    const codeSigner = new DMGCodeSigner({
      certPassword: this.certPassword,
      filePath: this.installerDMGPath,
      cachePath: this.deployCachePath,
    })
    return codeSigner.sign()
  }

  createDMG() {
    this.spinner.text = "Creating DMG"
    debug("creating dmg")
    const dmger = new DMGer({
      title: this.type,
      installerPKGPath: this.installerPKGPath,
      installerDMGPath: this.installerDMGPath,
    })
    return dmger.create()
  }

  copyTemplates() {
    this.spinner.text = "Processing templates"
    debug("coping templates")
    const packageTemplatePath = path.resolve(path.join(this.connectorPath, ".installer", "macos", "templates", "**/*"))
    const defaultTemplatePath = path.resolve(path.join(__dirname, "..", "templates", "**/*"))
    return this.findTemplatesFromPaths([packageTemplatePath, defaultTemplatePath]).each(templates => {
      return this.processTemplates(templates)
    })
  }

  findTemplatesFromPaths(templatePaths) {
    return Promise.map(templatePaths, templatePath => {
      return glob(templatePath, { nodir: true })
    })
  }

  processTemplates(templates) {
    return Promise.map(templates, template => {
      const filename = path.basename(template)
      if (filename.indexOf("_") == 0) {
        return this.processTemplate(template)
      }
      return this.copyFile(template)
    })
  }

  getFilePath(file) {
    const fileRegex = new RegExp(`${path.sep}templates${path.sep}(.*)$`)
    const matches = file.match(fileRegex)
    const filePartial = matches[matches.length - 1]
    const filePath = path.join(this.deployCachePath, this.macosPackageName, filePartial)
    const { base, dir } = path.parse(filePath)
    const newBase = base.replace(/^_/, "")
    return path.join(dir, newBase)
  }

  processTemplate(file) {
    const template = parseTemplate(fs.readFileSync(file, "utf-8"))
    const results = template(this.templateData)
    const filePath = this.getFilePath(file)
    return fs.outputFile(filePath, results)
  }

  copyFile(file) {
    const filePath = this.getFilePath(file)
    const fileDirPath = path.dirname(filePath)
    return fs.ensureDir(fileDirPath).then(() => {
      return fs.copy(file, filePath, { overwrite: true })
    })
  }
}

module.exports.MeshbluConnectorInstaller = MeshbluConnectorInstaller
