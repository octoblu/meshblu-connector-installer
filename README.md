# meshblu-connector-installer-macos

Generate Meshblu Connector Installer for macOS

## Installation

```bash
npm install --global meshblu-connector-installer-macos
```

or

```bash
npm install --save-dev meshblu-connector-installer-macos
```

## Usage

```bash
meshblu-connector-installer-macos --help
```

```txt
usage: meshblu-connector-installer [OPTIONS]
options:
    -v, --version             Print connector version and exit.
    -h, --help                Print this help and exit.
    --title=TITLE             Installer title. Environment:
                              MESHBLU_CONNECTOR_TITLE=TITLE
    --type=TYPE               meshblu connector type. Environment:
                              MESHBLU_CONNECTOR_TYPE=TYPE
    --output-path=PATH        Deploy path where assets are located. Defaults to
                              current directory/installer. Environment:
                              MESHBLU_CONNECTOR_OUTPUT_PATH=PATH
    --deploy-path=PATH        Deploy path where assets are located. Defaults to
                              current directory/deploy. Environment:
                              MESHBLU_CONNECTOR_DEPLOY_PATH=PATH
    --cert-password=PASSWORD  Password to unlock .p12 certificate. Environment:
                              MESHBLU_CONNECTOR_CERT_PASSWORD=PASSWORD
```
