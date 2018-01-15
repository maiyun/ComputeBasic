# ComputeBasic

[![License](https://img.shields.io/github/license/yunbookf/ComputeBasic.svg)](https://github.com/litert/http/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/yunbookf/ComputeBasic.svg)](https://github.com/yunbookf/ComputeBasic/issues)
[![GitHub Releases](https://img.shields.io/github/release/yunbookf/ComputeBasic.svg)](https://github.com/yunbookf/ComputeBasic/releases "Stable Release")
[![GitHub Pre-Releases](https://img.shields.io/github/release/yunbookf/ComputeBasic/all.svg)](https://github.com/yunbookf/ComputeBasic/releases "Pre-Release")

ComputeBasic is a simple scripting language for amateurs, compiled as JavaScript.

# Installation

## Systemjs

You need to reference Systemjs first and then import the index.js file like this:

```html
<script src="//cdn.jsdelivr.net/npm/systemjs@0/dist/system.js"></script>
<script>
    SystemJS.config({
        packages: {
            './dist': {
                defaultExtension: 'js'
            }
        }
    });
    SystemJS.import('./dist/index');
</script>
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

# Test

Test in the browser, visit "test/index.html". Test in Nodejs, please execute "node test.node.js" in the "dist" directory.

# License

This library is published under [Apache-2.0](./LICENSE) license.