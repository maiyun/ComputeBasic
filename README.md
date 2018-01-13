# ComputeBasic

[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/litert/http/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/yunbookf/ComputeBasic.svg)](https://github.com/yunbookf/ComputeBasic/issues)
[![GitHub Releases](https://img.shields.io/github/release/yunbookf/ComputeBasic.svg)](https://github.com/yunbookf/ComputeBasic/releases "Stable Release")
[![GitHub Pre-Releases](https://img.shields.io/github/release/yunbookf/ComputeBasic/all.svg)](https://github.com/yunbookf/ComputeBasic/releases "Pre-Release")

ComputeBasic is a simple scripting language for amateurs, compiled as JavaScript.

# Installation

## Direct <script> Include

Simply download and include with a script tag. ComputeBasic will be registered as a global variable.

> Don’t use the minified version during development. You will miss out on all the nice warnings for common mistakes!

```html
<!-- Development Version -->
<script src="cb.js"></script>
<!-- Production Version -->
<script src="cb.min.js"></script>
```

### CDN

Recommended: https://cdn.jsdelivr.net/npm/computebasic, which will reflect the latest version as soon as it is published to npm. You can also browse the source of the npm package at https://cdn.jsdelivr.net/npm/computebasic/.

Also available on [unpkg](https://unpkg.com/computebasic).

## NPM

In the Node.js environment, you can install directly using NPM:

```sh
$ npm i computebasic --save
```

Or install the developing (unstable) version for newest features:

```sh
$ npm i computebasic@dev --save
```

## License

This library is published under [Apache-2.0](./LICENSE) license.