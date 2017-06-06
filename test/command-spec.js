const assert = require("assert")
const { MeshbluConnectorInstallerCommand } = require("../")

describe("MeshbluConnectorInstallerCommand", function() {
  describe("when constructed", function() {
    it("should not throw an error", function() {
      let error = null
      try {
        new MeshbluConnectorInstallerCommand({ argv: [] })
      } catch (_error) {
        error = _error
      }
      assert.equal(error, null)
    })
  })
})
