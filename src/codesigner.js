const UUID = require("uuid")
const Promise = require("bluebird")
const exec = Promise.promisify(require("child_process").exec)
const path = require("path")
const fs = require("fs")
const axios = require("axios")

class CodeSigner {
  constructor({ certPassword, filePath, cachePath }) {
    this.filePath = filePath
    this.cachePath = cachePath
    this.certPassword = certPassword
    this.keychainName = UUID.v4()
    this.keychainPassword = UUID.v4()
    this.macosCertPath = path.join(this.cachePath, "AppleWWDRCA.cer")
    this.appCertPath = path.join(this.cachePath, "app.p12")
    this.identity = "Developer ID Application: Octoblu Inc. (JLSZ8Q5945)"
  }

  sign() {
    // sorry!
    return this.downloadCerts()
      .then(() => this.createKeychain())
      .then(() => this.importMacOSCert())
      .then(() => this.importAppCert())
      .then(() => this.signFile())
      .finally(() => this.deleteKeychain())
      .finally(() => this.unlinkFiles())
  }

  unlinkFiles() {
    const unlinkIfExists = file => {
      if (fs.existsSync(file)) fs.unlinkSync(file)
    }
    unlinkIfExists(this.macosCertPath)
    unlinkIfExists(this.appCertPath)
  }

  createKeychain() {
    return exec(`security create-keychain -p ${this.keychainPassword} ${this.keychainName}`)
  }

  deleteKeychain() {
    return exec(`security delete-keychain ${this.keychainName}`)
  }

  downloadCerts() {
    return Promise.all([this.downloadMacOSCert(), this.downloadAppCert()])
  }

  downloadMacOSCert() {
    return this.downloadCert({
      url: "https://developer.apple.com/certificationauthority/AppleWWDRCA.cer",
      filePath: this.macosCertPath,
    })
  }

  downloadAppCert() {
    return this.downloadCert({
      url: "https://s3-us-west-2.amazonaws.com/meshblu-connector/certs/MeshbluConnectorMacCert.p12",
      filePath: this.appCertPath,
    })
  }

  downloadCert({ url, filePath }) {
    return axios({
      method: "get",
      url,
      responseType: "stream",
    }).then(function(response) {
      return new Promise((resolve, reject) => {
        const stream = response.data
        stream.pipe(fs.createWriteStream(filePath))
        stream.on("end", resolve)
        stream.on("error", reject)
      })
    })
  }

  importMacOSCert() {
    return exec(`security import ${this.macosCertPath} -k ${this.keychainName} -T /usr/bin/codesign`)
  }

  importAppCert() {
    return exec(`security import ${this.appCertPath} -k ${this.keychainName} -P "${this.certPassword}" -T /usr/bin/codesign -T /usr/bin/productbuild`)
  }

  signFile() {
    return exec(`codesign --deep --force --keychain ${this.keychainName} --sign "${this.identity}" ${this.filePath}`)
  }
}

module.exports.CodeSigner = CodeSigner
