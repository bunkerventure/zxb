# zxb

zxb is a build tool for projects, similar to shuttle, but implemented in zx and typescript.

## Installation

To install zxb in a project run the following command:

```bash
curl https://raw.githubusercontent.com/bunkerventure/zxb/main/install.sh | bash
```

## Usage

To run an action, use the following command:

```bash
./zxb <action-name>
```

Fx you can run `./zxb help` to see a list of available actions.

## Development of actions

To develop actions, you can use the following commands:

```bash
cd <actions-package-directory>
npm link
cd <service with zxb>
./zxb dev link <package-name>
```

## Development of zxb runtime

To develop zxb runtime, you can use the following commands:

```bash
./zxb dev link zxb [zxb-actions-packages...]
```

This will link zxb and any zxb-actions-packages to the local node_modules directory.
