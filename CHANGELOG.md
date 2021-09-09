# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.1](https://github.com/unjs/h3/compare/v0.3.0...v0.3.1) (2021-09-09)


### Bug Fixes

* return 'false' and 'null' values as JSON strings ([#33](https://github.com/unjs/h3/issues/33)) ([5613c54](https://github.com/unjs/h3/commit/5613c54e8a5d6681c29fa172f533381cf11a8fd3))

## [0.3.0](https://github.com/unjs/h3/compare/v0.2.12...v0.3.0) (2021-07-27)


### ⚠ BREAKING CHANGES

* `useAsync` is removed. use `use` instead

### Features

* automatically promisify legacyMiddlware with `use` ([2805d4c](https://github.com/unjs/h3/commit/2805d4cc42d22c22c7798a41514aca5cceeb8e19)), closes [#27](https://github.com/unjs/h3/issues/27)
* handle returned errors (closes [#28](https://github.com/unjs/h3/issues/28)) ([991fcff](https://github.com/unjs/h3/commit/991fcff606b659035d5a23bd4ae97d3750e730cd))

### [0.2.12](https://github.com/unjs/h3/compare/v0.2.11...v0.2.12) (2021-07-02)


### Features

* **pkg:** add exports field ([998d872](https://github.com/unjs/h3/commit/998d8723870650a742bdeefb57c1d9acfc407692))

### [0.2.11](https://github.com/unjs/h3/compare/v0.2.10...v0.2.11) (2021-06-23)


### Bug Fixes

* createError fallback to statusMessage ([#25](https://github.com/unjs/h3/issues/25)) ([2f792f5](https://github.com/unjs/h3/commit/2f792f5cf64d87aeb41e387bae6cfad1112b3d05))

### [0.2.10](https://github.com/unjs/h3/compare/v0.2.9...v0.2.10) (2021-04-21)


### Bug Fixes

* fallback for setImmediate ([6cf61f6](https://github.com/unjs/h3/commit/6cf61f601d206a9d3cdcf368cb700ebd5c2e22de))

### [0.2.9](https://github.com/unjs/h3/compare/v0.2.8...v0.2.9) (2021-04-06)


### Bug Fixes

* resolve handle when send was called ([fb58e5b](https://github.com/unjs/h3/commit/fb58e5b274272ba55df4bb38b874a688b617d541))

### [0.2.8](https://github.com/unjs/h3/compare/v0.2.7...v0.2.8) (2021-03-27)


### Bug Fixes

* **app:** custom options passed to useAsync ([3c328a4](https://github.com/unjs/h3/commit/3c328a4dc0dbc215d2da82cd0abc1e8ede006665))

### [0.2.7](https://github.com/unjs/h3/compare/v0.2.6...v0.2.7) (2021-03-27)

### [0.2.6](https://github.com/unjs/h3/compare/v0.2.5...v0.2.6) (2021-03-27)

### [0.2.5](https://github.com/unjs/h3/compare/v0.2.4...v0.2.5) (2021-02-19)

### [0.2.4](https://github.com/unjs/h3/compare/v0.2.3...v0.2.4) (2021-01-22)


### Bug Fixes

* always restore req.url for each layer to avoid mutation ([aae5787](https://github.com/unjs/h3/commit/aae57876a1bad3972bec86cee385db308ac69764))

### [0.2.3](https://github.com/unjs/h3/compare/v0.2.2...v0.2.3) (2021-01-20)


### Bug Fixes

* improve internal error handling ([b38d450](https://github.com/unjs/h3/commit/b38d450e39101104333f33516d75869cd2427f9d))

### [0.2.2](https://github.com/unjs/h3/compare/v0.2.1...v0.2.2) (2021-01-20)


### Bug Fixes

* capture stacktrace from createError ([1441784](https://github.com/unjs/h3/commit/14417846554f81f44ae677bfd609517dcfd3c291))
* handle thrown errors by each layer ([62fd25a](https://github.com/unjs/h3/commit/62fd25a572de72a1f555b8f43e5e4798c392b74b))

### [0.2.1](https://github.com/unjs/h3/compare/v0.2.0...v0.2.1) (2021-01-12)

## [0.2.0](https://github.com/unjs/h3/compare/v0.0.15...v0.2.0) (2020-12-15)


### ⚠ BREAKING CHANGES

* rename useBodyJSON to useBody and unexposed cached value

### Features

* `useCookie`, `useCookies` and `setCookie` utilities ([088f413](https://github.com/unjs/h3/commit/088f413434a619a9888bfd9d1b189e56a7d00124)), closes [#17](https://github.com/unjs/h3/issues/17)
* appendHeader utility ([84be904](https://github.com/unjs/h3/commit/84be9040e2c52b625a47591e8f5107793da29f72))
* rename useBodyJSON to useBody and unexposed cached value ([d8d39a0](https://github.com/unjs/h3/commit/d8d39a0eefbc22c8d3af8e7dcee5ee8964da07e3))

### [0.0.15](https://github.com/unjs/h3/compare/v0.0.14...v0.0.15) (2020-12-12)


### Features

* add request and response utils ([#15](https://github.com/unjs/h3/issues/15)) ([648e9b9](https://github.com/unjs/h3/commit/648e9b9ceff3a8658a7e3705164d5139e6f95c99))
* custom error handler ([ad3515f](https://github.com/unjs/h3/commit/ad3515f0da8bb37d3f82a6527c459aa86a63e338))


### Bug Fixes

* don't override internal flag ([a5ee318](https://github.com/unjs/h3/commit/a5ee31888101cbe7458d7a63527d0cf07845d2a6))
* hide 404 error ([38fb027](https://github.com/unjs/h3/commit/38fb027bb5a2d3d369f7d3e333edc1342cf32914))
* preserve error message in console ([3002b27](https://github.com/unjs/h3/commit/3002b27aace50cf6d39c289b8500bb92a065fe7a))

### [0.0.14](https://github.com/unjs/h3/compare/v0.0.13...v0.0.14) (2020-12-05)


### Bug Fixes

* **app:** handle buffer ([09c9c6d](https://github.com/unjs/h3/commit/09c9c6da5bcd00ff49e815cae3c74893d4b4806d))
* **utils:** avoid setting falsy type ([df5e92b](https://github.com/unjs/h3/commit/df5e92b07ca2c096fb078c0deff50b613245c0db))

### [0.0.13](https://github.com/unjs/h3/compare/v0.0.12...v0.0.13) (2020-12-05)


### Bug Fixes

* enable debug by default ([010cdfe](https://github.com/unjs/h3/commit/010cdfe32ce80b2453489f8839c5f3d946d027a1))

### [0.0.12](https://github.com/unjs/h3/compare/v0.0.11...v0.0.12) (2020-11-23)


### Features

* allow chaining use statements ([#9](https://github.com/unjs/h3/issues/9)) ([e30ea79](https://github.com/unjs/h3/commit/e30ea7911ed378866f2c61b0ece3f332e113e821)), closes [#5](https://github.com/unjs/h3/issues/5)


### Bug Fixes

* correctly expose route and middleware types ([#10](https://github.com/unjs/h3/issues/10)) ([bb6cd4c](https://github.com/unjs/h3/commit/bb6cd4c6971fc269d6a313ebc07910898b32f178)), closes [#11](https://github.com/unjs/h3/issues/11) [#11](https://github.com/unjs/h3/issues/11)
* ensure correct url is used when used as a sub-app ([0e4770a](https://github.com/unjs/h3/commit/0e4770af89757c274b1d3e6d7c54b973a7bf9bef))
* mark app._handle as private to avoid sub-app detection ([1439f35](https://github.com/unjs/h3/commit/1439f354a7e9238113f6d8bc7687df8a5fe7bd10))

### [0.0.11](https://github.com/unjs/h3/compare/v0.0.10...v0.0.11) (2020-11-21)


### Features

* `useAsync` ([236e979](https://github.com/unjs/h3/commit/236e97953ac014dffa8977c4bf8cd6f2fa369eb7))
* custom matcher and improved docs ([1c4f9d1](https://github.com/unjs/h3/commit/1c4f9d138dde212486d1aa7acb0e2df9a8cb8aca))

### [0.0.10](https://github.com/unjs/h3/compare/v0.0.9...v0.0.10) (2020-11-20)


### Features

* rewrite with much sexier API ([0d3680e](https://github.com/unjs/h3/commit/0d3680eacab44d6a40c10b94cfba2036afc571d9))

### [0.0.9](https://github.com/unjs/h3/compare/v0.0.8...v0.0.9) (2020-11-20)


### Features

* createError ([1a80bd9](https://github.com/unjs/h3/commit/1a80bd9432b0585a474d6888e7035636307eead8))


### Bug Fixes

* throw 404 only when writableEnded is not set ([1c42a07](https://github.com/unjs/h3/commit/1c42a07e3ecc175c96dff026967298a107314f5e))

### [0.0.8](https://github.com/unjs/h3/compare/v0.0.7...v0.0.8) (2020-11-19)


### Bug Fixes

* don't log 404 ([541ede0](https://github.com/unjs/h3/commit/541ede03edc6526b953c8a0bb7f31f0dc5fc21d3))

### [0.0.7](https://github.com/unjs/h3/compare/v0.0.6...v0.0.7) (2020-11-19)

### [0.0.6](https://github.com/unjs/h3/compare/v0.0.5...v0.0.6) (2020-11-19)


### Features

* add debug option to app ([b0891cd](https://github.com/unjs/h3/commit/b0891cd13d4a7b8ed0fb981ae878185c6728b618))

### [0.0.5](https://github.com/unjs/h3/compare/v0.0.4...v0.0.5) (2020-11-19)


### Features

* expose unsafeHandle ([f1245f1](https://github.com/unjs/h3/commit/f1245f13c1a4ec1f9e1ecb4b0b73c50047ee4d3a))

### [0.0.4](https://github.com/unjs/h3/compare/v0.0.3...v0.0.4) (2020-11-19)


### Features

* rewrite promisify logic ([a40aa81](https://github.com/unjs/h3/commit/a40aa81aa80da3ba418061338bcaa6286357ab67))


### Bug Fixes

* keep top level trailing slash ([2fb92ef](https://github.com/unjs/h3/commit/2fb92efdf462f3c4098af3cac6594599839f7cde))
* stop middleware when writableEnded flag is set ([d87d8e5](https://github.com/unjs/h3/commit/d87d8e5f7a426409565d1a008b8231c793ec61ef))

### [0.0.3](https://github.com/unjs/h3/compare/v0.0.2...v0.0.3) (2020-11-19)


### Features

* improve error util ([5504f4e](https://github.com/unjs/h3/commit/5504f4e53dfb19cceb6580b00077f8c80d0b5dc5))

### [0.0.2](https://github.com/unjs/h3/compare/v0.0.1...v0.0.2) (2020-11-19)


### Bug Fixes

* remove dependency on process.env ([eb018f5](https://github.com/unjs/h3/commit/eb018f5e23a5f797a4b5d24fdbfe591994c39aef))

### 0.0.1 (2020-11-18)


### Features

* de-default loazy handles ([0cb8c0c](https://github.com/unjs/h3/commit/0cb8c0c74647278806a53f7920f8678bb47749e5))
* update docs and caller utility ([0ef0020](https://github.com/unjs/h3/commit/0ef0020da1931b8c08344008253703b91b318559))


### Bug Fixes

* **app:** handle returning promise ([2169f92](https://github.com/unjs/h3/commit/2169f92142d2e92e143913fff945628f17203779))
* **writable:** set writableEnded and writableFinished ([7058fdc](https://github.com/unjs/h3/commit/7058fdcf38a31edd1ce2afe4b05eb0b050adea78))
