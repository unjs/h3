# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.13](https://github.com/nuxt-contrib/h2/compare/v0.0.12...v0.0.13) (2020-12-05)


### Bug Fixes

* enable debug by default ([010cdfe](https://github.com/nuxt-contrib/h2/commit/010cdfe32ce80b2453489f8839c5f3d946d027a1))

### [0.0.12](https://github.com/nuxt-contrib/h2/compare/v0.0.11...v0.0.12) (2020-11-23)


### Features

* allow chaining use statements ([#9](https://github.com/nuxt-contrib/h2/issues/9)) ([e30ea79](https://github.com/nuxt-contrib/h2/commit/e30ea7911ed378866f2c61b0ece3f332e113e821)), closes [#5](https://github.com/nuxt-contrib/h2/issues/5)


### Bug Fixes

* correctly expose route and middleware types ([#10](https://github.com/nuxt-contrib/h2/issues/10)) ([bb6cd4c](https://github.com/nuxt-contrib/h2/commit/bb6cd4c6971fc269d6a313ebc07910898b32f178)), closes [#11](https://github.com/nuxt-contrib/h2/issues/11) [#11](https://github.com/nuxt-contrib/h2/issues/11)
* ensure correct url is used when used as a sub-app ([0e4770a](https://github.com/nuxt-contrib/h2/commit/0e4770af89757c274b1d3e6d7c54b973a7bf9bef))
* mark app._handle as private to avoid sub-app detection ([1439f35](https://github.com/nuxt-contrib/h2/commit/1439f354a7e9238113f6d8bc7687df8a5fe7bd10))

### [0.0.11](https://github.com/nuxt-contrib/h2/compare/v0.0.10...v0.0.11) (2020-11-21)


### Features

* `useAsync` ([236e979](https://github.com/nuxt-contrib/h2/commit/236e97953ac014dffa8977c4bf8cd6f2fa369eb7))
* custom matcher and improved docs ([1c4f9d1](https://github.com/nuxt-contrib/h2/commit/1c4f9d138dde212486d1aa7acb0e2df9a8cb8aca))

### [0.0.10](https://github.com/nuxt-contrib/h2/compare/v0.0.9...v0.0.10) (2020-11-20)


### Features

* rewrite with much sexier API ([0d3680e](https://github.com/nuxt-contrib/h2/commit/0d3680eacab44d6a40c10b94cfba2036afc571d9))

### [0.0.9](https://github.com/nuxt-contrib/h2/compare/v0.0.8...v0.0.9) (2020-11-20)


### Features

* createError ([1a80bd9](https://github.com/nuxt-contrib/h2/commit/1a80bd9432b0585a474d6888e7035636307eead8))


### Bug Fixes

* throw 404 only when writableEnded is not set ([1c42a07](https://github.com/nuxt-contrib/h2/commit/1c42a07e3ecc175c96dff026967298a107314f5e))

### [0.0.8](https://github.com/nuxt-contrib/h2/compare/v0.0.7...v0.0.8) (2020-11-19)


### Bug Fixes

* don't log 404 ([541ede0](https://github.com/nuxt-contrib/h2/commit/541ede03edc6526b953c8a0bb7f31f0dc5fc21d3))

### [0.0.7](https://github.com/nuxt-contrib/h2/compare/v0.0.6...v0.0.7) (2020-11-19)

### [0.0.6](https://github.com/nuxt-contrib/h2/compare/v0.0.5...v0.0.6) (2020-11-19)


### Features

* add debug option to app ([b0891cd](https://github.com/nuxt-contrib/h2/commit/b0891cd13d4a7b8ed0fb981ae878185c6728b618))

### [0.0.5](https://github.com/nuxt-contrib/h2/compare/v0.0.4...v0.0.5) (2020-11-19)


### Features

* expose unsafeHandle ([f1245f1](https://github.com/nuxt-contrib/h2/commit/f1245f13c1a4ec1f9e1ecb4b0b73c50047ee4d3a))

### [0.0.4](https://github.com/nuxt-contrib/h2/compare/v0.0.3...v0.0.4) (2020-11-19)


### Features

* rewrite promisify logic ([a40aa81](https://github.com/nuxt-contrib/h2/commit/a40aa81aa80da3ba418061338bcaa6286357ab67))


### Bug Fixes

* keep top level trailing slash ([2fb92ef](https://github.com/nuxt-contrib/h2/commit/2fb92efdf462f3c4098af3cac6594599839f7cde))
* stop middleware when writableEnded flag is set ([d87d8e5](https://github.com/nuxt-contrib/h2/commit/d87d8e5f7a426409565d1a008b8231c793ec61ef))

### [0.0.3](https://github.com/nuxt-contrib/h2/compare/v0.0.2...v0.0.3) (2020-11-19)


### Features

* improve error util ([5504f4e](https://github.com/nuxt-contrib/h2/commit/5504f4e53dfb19cceb6580b00077f8c80d0b5dc5))

### [0.0.2](https://github.com/nuxt-contrib/h2/compare/v0.0.1...v0.0.2) (2020-11-19)


### Bug Fixes

* remove dependency on process.env ([eb018f5](https://github.com/nuxt-contrib/h2/commit/eb018f5e23a5f797a4b5d24fdbfe591994c39aef))

### 0.0.1 (2020-11-18)


### Features

* de-default loazy handles ([0cb8c0c](https://github.com/nuxt-contrib/h2/commit/0cb8c0c74647278806a53f7920f8678bb47749e5))
* update docs and caller utility ([0ef0020](https://github.com/nuxt-contrib/h2/commit/0ef0020da1931b8c08344008253703b91b318559))


### Bug Fixes

* **app:** handle returning promise ([2169f92](https://github.com/nuxt-contrib/h2/commit/2169f92142d2e92e143913fff945628f17203779))
* **writable:** set writableEnded and writableFinished ([7058fdc](https://github.com/nuxt-contrib/h2/commit/7058fdcf38a31edd1ce2afe4b05eb0b050adea78))
