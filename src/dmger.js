const appdmg = require("appdmg")
const path = require("path")
const fs = require("fs")

class DMGer {
  constructor({ outputPath, title }) {
    this.outputPath = outputPath
    this.title = title
  }

  create() {
    const installerPKGPath = path.join(this.outputPath, "Installer.pkg")
    const installerDMGPath = path.join(this.outputPath, "Installer.dmg")

    if (fs.existsSync(installerDMGPath)) fs.unlinkSync(installerDMGPath)

    const specification = {
      title: this.title,
      background: "resources/background.png",
      icon: "resources/drive-icon.icns",
      "icon-size": 128,
      format: "UDZO",
      window: {
        width: 512,
        height: 512,
      },
      contents: [
        {
          x: 256,
          y: 200,
          type: "file",
          path: installerPKGPath,
          name: this.title + ".pkg",
        },
      ],
    }

    return new Promise((resolve, reject) => {
      const dmg = appdmg({ target: installerDMGPath, basepath: path.join(__dirname, ".."), specification })
      dmg.on("finish", resolve)
      dmg.on("error", reject)
    })
  }
}

module.exports.DMGer = DMGer
