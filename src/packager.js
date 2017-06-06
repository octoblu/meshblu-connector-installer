const fs = require("fs")
const path = require("path")
const createPackage = require("@octoblu/osx-pkg")

class Packager {
  constructor({ type, title, deployPath, outputPath }) {
    this.type = type
    this.title = title
    this.deployPath = deployPath
    this.outputPath = outputPath
  }

  package() {
    const installerPath = path.join(this.outputPath, "Installer.pkg")
    const installLocation = `/Library/MeshbluConnectors/${this.type}`
    const opts = {
      dir: this.deployPath,
      installLocation: installLocation,
      identifier: `.com.octoblu.connectors.${this.type}.pkg`,
      title: this.title,
    }

    return new Promise((resolve, reject) => {
      const stream = createPackage(opts)
      stream.pipe(fs.createWriteStream(installerPath))
      stream.on("end", resolve)
      stream.on("error", reject)
    })
  }
}

module.exports.Packager = Packager
