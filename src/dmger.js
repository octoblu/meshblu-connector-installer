const appdmg = require("appdmg")
const path = require("path")
const fs = require("fs-extra")

class DMGer {
  constructor({ installerPKGPath, installerDMGPath, title }) {
    this.installerPKGPath = installerPKGPath
    this.installerDMGPath = installerDMGPath
    this.title = title
  }

  cleanup() {
    return fs.exists(this.installerDMGPath).then(exists => {
      if (!exists) return
      return fs.unlink(this.installerDMGPath)
    })
  }

  prepare() {
    const dirname = path.dirname(this.installerDMGPath)
    return fs.ensureDir(dirname)
  }

  create() {
    return this.cleanup()
      .then(() => {
        return this.prepare()
      })
      .then(() => {
        this.dmgit()
      })
  }

  dmgit() {
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
          path: this.installerPKGPath,
          name: "Install.pkg",
        },
      ],
    }

    return new Promise((resolve, reject) => {
      const dmg = appdmg({ target: this.installerDMGPath, basepath: path.join(__dirname, ".."), specification })
      dmg.on("finish", resolve)
      dmg.on("error", reject)
    })
  }
}

module.exports.DMGer = DMGer
