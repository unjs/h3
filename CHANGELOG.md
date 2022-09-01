# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## main (v0.7.18..main)


### 📦 Build

  - Hotfix for unbuild issue (1564761)

### ❤️  Contributors

- Pooya Parsa

## main (v0.7.17..main)


### 🚀 Enhancements

  - Add `H3Event`, `H3Response` and `H3Headers` (#119)

### 🩹 Fixes

  - **sendRedirect:** Avoid double encoding (04b432c)

### 🏡 Chore

  - Update deps and use changelogen (2c08445)
  - Update vitest setup (77eded0)

### ❤️  Contributors

- Daniel Roe
- Pooya Parsa

### [0.7.17](https://github.com/unjs/h3/compare/v0.7.16...v0.7.17) (2022-08-30)


### Bug Fixes

* **sendRedirect:** always encode location uri ([01476ac](https://github.com/unjs/h3/commit/01476acb98a248d36544573febb562d2cd5fee09))

### [0.7.16](https://github.com/unjs/h3/compare/v0.7.15...v0.7.16) (2022-08-23)


### Bug Fixes

* `context` type for `CompatibilityRequestProps` ([#164](https://github.com/unjs/h3/issues/164)) ([984a42b](https://github.com/unjs/h3/commit/984a42b99d6204b40b942861d72592b53139b4d6))
* added missing patch router method ([#166](https://github.com/unjs/h3/issues/166)) ([dff2211](https://github.com/unjs/h3/commit/dff22112d89c8f556301172ae8ee2720b036dae9))

### [0.7.15](https://github.com/unjs/h3/compare/v0.7.14...v0.7.15) (2022-08-10)


### Bug Fixes

* **createError:** preserve original error stack ([#161](https://github.com/unjs/h3/issues/161)) ([8213421](https://github.com/unjs/h3/commit/8213421bfdc816b48c204b727e6df1b52abe8e08))
* don not log errors when `onError` is provided ([#162](https://github.com/unjs/h3/issues/162)) ([ccc9c7e](https://github.com/unjs/h3/commit/ccc9c7e66076aae3d8ba5ba4cf117a68917024f2))

### [0.7.14](https://github.com/unjs/h3/compare/v0.7.13...v0.7.14) (2022-08-08)


### Features

* add utilities for http headers ([#157](https://github.com/unjs/h3/issues/157)) ([272f883](https://github.com/unjs/h3/commit/272f883c3e6413a632e871de3a796d62e6c5da43))
* add utility for router params ([#120](https://github.com/unjs/h3/issues/120)) ([#158](https://github.com/unjs/h3/issues/158)) ([4b83bdf](https://github.com/unjs/h3/commit/4b83bdf83b94da3f66018378d39c5cc24afdf43f))

### [0.7.13](https://github.com/unjs/h3/compare/v0.7.12...v0.7.13) (2022-08-01)


### Features

* send 204 response if null is returned from handler ([#154](https://github.com/unjs/h3/issues/154)) ([dbd465f](https://github.com/unjs/h3/commit/dbd465f644274775de8b4322cb5238171780033c))
* **sendRedirect:** add refresh meta fallback for static generated responses  ([#153](https://github.com/unjs/h3/issues/153)) ([606de3b](https://github.com/unjs/h3/commit/606de3bb3abeacc44debc164d23677853066a4e0))

### [0.7.12](https://github.com/unjs/h3/compare/v0.7.11...v0.7.12) (2022-07-21)


### Bug Fixes

* **isError:** use `__h3_error__` class property to detect error ([968bfee](https://github.com/unjs/h3/commit/968bfeef8ea728497bf432c421bbb73f3e9de6e7))

### [0.7.11](https://github.com/unjs/h3/compare/v0.7.10...v0.7.11) (2022-07-21)


### Features

* **createError:** support `fatal` and `unhandled` ([#148](https://github.com/unjs/h3/issues/148)) ([8579f1c](https://github.com/unjs/h3/commit/8579f1c9b055a38003f05a2592704027fb460778))


### Bug Fixes

* **handleCacheHeaders:** add `max-age` to the final object ([#142](https://github.com/unjs/h3/issues/142)) ([991d099](https://github.com/unjs/h3/commit/991d099c4f43fd034393feb202827399e2cdcd25))

### [0.7.10](https://github.com/unjs/h3/compare/v0.7.9...v0.7.10) (2022-06-17)

### [0.7.9](https://github.com/unjs/h3/compare/v0.7.8...v0.7.9) (2022-06-10)


### Features

* add `H3EventContext` for type augmentation ([#124](https://github.com/unjs/h3/issues/124)) ([5042e92](https://github.com/unjs/h3/commit/5042e92e9ef8b22a143990027ca75454f0560e44))
* **createError:** support string as error source ([#132](https://github.com/unjs/h3/issues/132)) ([8eb9969](https://github.com/unjs/h3/commit/8eb9969ed3077b0dcdfc57754fcb05678ff6ee8b))
* handle error cause ([#131](https://github.com/unjs/h3/issues/131)) ([3c3b6bd](https://github.com/unjs/h3/commit/3c3b6bdc8072a112c7bc2c2fc2c36066a75dd54b))


### Bug Fixes

* **pkg:** add `types` to the exports ([#125](https://github.com/unjs/h3/issues/125)) ([bf8a329](https://github.com/unjs/h3/commit/bf8a329389977e23e27135444a7e2d1b1bde237e))

### [0.7.8](https://github.com/unjs/h3/compare/v0.7.7...v0.7.8) (2022-05-04)


### Bug Fixes

* handle typed `H3Response` ([62aebf8](https://github.com/unjs/h3/commit/62aebf80983042a91e829e99de6e5a807b978682))

### [0.7.7](https://github.com/unjs/h3/compare/v0.7.6...v0.7.7) (2022-05-04)


### Bug Fixes

* disable typecheck for h3 response (resolves [#112](https://github.com/unjs/h3/issues/112)) ([8db0195](https://github.com/unjs/h3/commit/8db0195c28750e9ba3e47648da963c65095402c4))

### [0.7.6](https://github.com/unjs/h3/compare/v0.7.5...v0.7.6) (2022-04-29)


### Bug Fixes

* **types:** nullables object props for response ([#111](https://github.com/unjs/h3/issues/111)) ([182b224](https://github.com/unjs/h3/commit/182b224af53288ba0cec1f81570271cb5457e8ce))

### [0.7.5](https://github.com/unjs/h3/compare/v0.7.4...v0.7.5) (2022-04-27)


### Bug Fixes

* **types:** fix `JSONValue` type ([#106](https://github.com/unjs/h3/issues/106)) ([e9a07cb](https://github.com/unjs/h3/commit/e9a07cbef57df04c104fa169af5fef7f2613daae))

### [0.7.4](https://github.com/unjs/h3/compare/v0.7.3...v0.7.4) (2022-04-14)


### Bug Fixes

* **handleCacheHeaders:** small improvements ([4fb9745](https://github.com/unjs/h3/commit/4fb9745505d5b0c8eea69b67f15b3b1614901869))

### [0.7.3](https://github.com/unjs/h3/compare/v0.7.2...v0.7.3) (2022-04-12)


### Features

* **router:** allow registering multiple methods at once ([#92](https://github.com/unjs/h3/issues/92)) ([c26bd46](https://github.com/unjs/h3/commit/c26bd4682ecf6fc939f47fa8f2f6414278b45b36))

### [0.7.2](https://github.com/unjs/h3/compare/v0.7.1...v0.7.2) (2022-04-08)


### Features

* add generic response type support for eventHandler ([6fcdc22](https://github.com/unjs/h3/commit/6fcdc22dd20df731cd31b99ebac0cdb473541297))


### Bug Fixes

* add missing `PATCH` method to types ([#88](https://github.com/unjs/h3/issues/88)) ([884460b](https://github.com/unjs/h3/commit/884460bffd210de9042cd9ebe3b84d1c07b40a06))

### [0.7.1](https://github.com/unjs/h3/compare/v0.7.0...v0.7.1) (2022-04-07)


### Bug Fixes

* **router:** compatibility matched params ([07930bc](https://github.com/unjs/h3/commit/07930bcfe0f5b09714058b7d5f0e3505c25175ad))

## [0.7.0](https://github.com/unjs/h3/compare/v0.6.0...v0.7.0) (2022-04-07)


### ⚠ BREAKING CHANGES

* move router params to `event.context.params`

* move router params to `event.context.params` ([6fe32e2](https://github.com/unjs/h3/commit/6fe32e27b3f22b6a2ac0db1ab60d40ec1cd8ac51))

## [0.6.0](https://github.com/unjs/h3/compare/v0.5.7...v0.6.0) (2022-04-06)


### ⚠ BREAKING CHANGES

* set default path for `setCookie` to `/`

### Features

* set default path for `setCookie` to `/` ([1bd6a45](https://github.com/unjs/h3/commit/1bd6a45aa463182b2adda48688795e6257cf5f09))

### [0.5.7](https://github.com/unjs/h3/compare/v0.5.6...v0.5.7) (2022-04-06)


### Bug Fixes

* remove `ServerResponse` from `CompatibilityEvent` possibilities ([b285659](https://github.com/unjs/h3/commit/b2856598e1432796ce7aadac2be1c11837f766d8))

### [0.5.6](https://github.com/unjs/h3/compare/v0.5.5...v0.5.6) (2022-04-06)


### Features

* `handleCacheHeaders` utility ([4a71a3f](https://github.com/unjs/h3/commit/4a71a3f02a38d6a35743f55f4c2904801cf2b463))


### Bug Fixes

* add `params` to compatiblity layer for `req` ([63dd55c](https://github.com/unjs/h3/commit/63dd55c629b6a36021c6799365c05512e4b04b6f))

### [0.5.5](https://github.com/unjs/h3/compare/v0.5.4...v0.5.5) (2022-04-04)


### Features

* `dynamicEventHandler` ([ce98257](https://github.com/unjs/h3/commit/ce982571bec238396dcc574134d60e93296ec512))

### [0.5.4](https://github.com/unjs/h3/compare/v0.5.3...v0.5.4) (2022-04-01)


### Bug Fixes

* throw wrapped error with legacy middleware ([27e9477](https://github.com/unjs/h3/commit/27e9477b63b33a54b953067ae4fc2d30fb74bb2e))

### [0.5.3](https://github.com/unjs/h3/compare/v0.5.2...v0.5.3) (2022-03-31)


### Features

* **useBody:** support `application/x-www-form-urlencoded` ([73f090b](https://github.com/unjs/h3/commit/73f090b4a584f6b93299ab4e7f3f73b86727e8c3)), closes [#44](https://github.com/unjs/h3/issues/44)


### Bug Fixes

* initialise `res.req` ([#80](https://github.com/unjs/h3/issues/80)) ([57db02d](https://github.com/unjs/h3/commit/57db02deac3bd190f91838a900d71169fb9ceb18))
* revert back support for legacy middleware ([b3e4f5b](https://github.com/unjs/h3/commit/b3e4f5b2cf27196f0a2c7468dd7e706e12a6da89))

### [0.5.2](https://github.com/unjs/h3/compare/v0.5.1...v0.5.2) (2022-03-31)


### Bug Fixes

* add `[h3]` prefix to console error ([2f4859c](https://github.com/unjs/h3/commit/2f4859c9210e1eb79fc1681942af5a9678e2e8c0))
* improve `writableEnded` guard ([ba5084c](https://github.com/unjs/h3/commit/ba5084c7fce225e09536003f025ff9f46f005e03))
* make console error for thrown unkown errors ([1552219](https://github.com/unjs/h3/commit/1552219cdbd515a47ad9f6b51d4ba6f31ffea0b4))
* skip built-in error handler if `onError` provided ([2c25aa1](https://github.com/unjs/h3/commit/2c25aa10e6d872ba87926e97f77fffcc96f4d203))

### [0.5.1](https://github.com/unjs/h3/compare/v0.5.0...v0.5.1) (2022-03-29)


### Features

* expose nodeHandler and add backward compat with layer as `handle` ([54a944c](https://github.com/unjs/h3/commit/54a944c6dff731c104c0a42964d57ccfd342dec3))
* support lazy event handlers ([333a4ca](https://github.com/unjs/h3/commit/333a4cab3c278d3749c1e3bdfd78b9fc6c4cefe9))
* typecheck handler to be a function ([38493eb](https://github.com/unjs/h3/commit/38493eb9f65ba2a2811ba36379ad0b897a6f6e5a))


### Bug Fixes

* add missing types export ([53f0b58](https://github.com/unjs/h3/commit/53f0b58b66c9d181b2bca40dcfd27305014ff758))
* refine nodeHandler type as we always return promise ([1ba6019](https://github.com/unjs/h3/commit/1ba6019c35c8a76e368859e83790369233a7c301))

## [0.5.0](https://github.com/unjs/h3/compare/v0.4.2...v0.5.0) (2022-03-29)


### ⚠ BREAKING CHANGES

* All `handle` exports and properties are renamed to `handler` with some backward compatibilities.
* Legacy handlers are promisified by default
* opt-in using event format using `defineEventHandler` (#74)

### Features

* **app:** use node handler signuture ([c722091](https://github.com/unjs/h3/commit/c7220910e15b446a1515c37bf42c7824c3eb36b7))
* opt-in using event format using `defineEventHandler` ([#74](https://github.com/unjs/h3/issues/74)) ([cdf9b7c](https://github.com/unjs/h3/commit/cdf9b7c24e9c68b0ba192f5a42c9c95d490cb72a))


### Bug Fixes

* check for null data for stream detection ([#69](https://github.com/unjs/h3/issues/69)) ([70f03fe](https://github.com/unjs/h3/commit/70f03fe548ded7e9628fc717a89e5dd12cdb6007))
* router issue with query params ([#77](https://github.com/unjs/h3/issues/77)) ([#78](https://github.com/unjs/h3/issues/78)) ([229964e](https://github.com/unjs/h3/commit/229964e6ad5d29646feff50461de0dc34cce14c8))
* **router:** req.params compatibility ([1d9fca0](https://github.com/unjs/h3/commit/1d9fca09f1f66e53811a0414ab7f53dbb158d72f))


* use events api for utils with compatibility layer ([#75](https://github.com/unjs/h3/issues/75)) ([2cf0f4b](https://github.com/unjs/h3/commit/2cf0f4b50914dea62d5f1d80dafe6aefdfd1bbd9))

### [0.4.2](https://github.com/unjs/h3/compare/v0.4.1...v0.4.2) (2022-03-16)


### Features

* add stream pipe response ([#68](https://github.com/unjs/h3/issues/68)) ([c3eb8ea](https://github.com/unjs/h3/commit/c3eb8eae05218e853da5ee6f2f9783e8dad14d1a))


### Bug Fixes

* **send:** add explicit return type ([2736b3a](https://github.com/unjs/h3/commit/2736b3ac0e65669e3bbed7766bf0c0a40b7ba25d))

### [0.4.1](https://github.com/unjs/h3/compare/v0.4.0...v0.4.1) (2022-03-11)


### Features

* add `deleteCookie` utility ([#66](https://github.com/unjs/h3/issues/66)) ([dd3c855](https://github.com/unjs/h3/commit/dd3c855f3cfe7b4ae457cd44a6898b28b1892b5a))


### Bug Fixes

* allow returning, number and boolean as well ([#65](https://github.com/unjs/h3/issues/65)) ([9a01465](https://github.com/unjs/h3/commit/9a0146577b6fe9399bfafd7ec531b8be5bb82909))
* use `cookie-es` to avoid esm bundling issues ([ceedbbc](https://github.com/unjs/h3/commit/ceedbbc88e98a49df60d0fd7630abd7d66661092))

## [0.4.0](https://github.com/unjs/h3/compare/v0.3.9...v0.4.0) (2022-03-09)


### ⚠ BREAKING CHANGES

* update repo

### Features

* add router support ([#64](https://github.com/unjs/h3/issues/64)) ([4035cca](https://github.com/unjs/h3/commit/4035cca1ddf0dd65e94a9a5c3d78c0c32098a8d9))


* update repo ([5dd59f1](https://github.com/unjs/h3/commit/5dd59f1ab055d595f58a483edb4bfc82637b47ac))

### [0.3.9](https://github.com/unjs/h3/compare/v0.3.8...v0.3.9) (2022-01-18)


### Bug Fixes

* don't lowercase routes when normalizing layers ([#60](https://github.com/unjs/h3/issues/60)) ([5bb05ce](https://github.com/unjs/h3/commit/5bb05ce584229916881da8a5bbe8012dd003b665))

### [0.3.8](https://github.com/unjs/h3/compare/v0.3.7...v0.3.8) (2021-12-04)


### Bug Fixes

* **useBody:** allow body with `DELETE` method (resolves [#50](https://github.com/unjs/h3/issues/50)) ([bd90f66](https://github.com/unjs/h3/commit/bd90f662d5e73e2c410e1cf432f17cccfef29e57))

### [0.3.7](https://github.com/unjs/h3/compare/v0.3.6...v0.3.7) (2021-12-01)


### Bug Fixes

* unenv uses `req.body` prop ([a31d12f](https://github.com/unjs/h3/commit/a31d12f338184b0ca0351dd96422ccc7044524f0))

### [0.3.6](https://github.com/unjs/h3/compare/v0.3.5...v0.3.6) (2021-12-01)


### Features

* assert method is valid before attempting to read body ([92f67f0](https://github.com/unjs/h3/commit/92f67f076aae2f69d8c9ed05fa94c0dfe38badf2))


### Bug Fixes

* avoid race-condition for calling useBody on same rew ([0633804](https://github.com/unjs/h3/commit/0633804a722bd1d16228fc0187d0e6dea2b15da1))
* handle body with falsy values ([6236fc2](https://github.com/unjs/h3/commit/6236fc24f77c56be7efc5c41573b65a7fca0ad75))

### [0.3.5](https://github.com/unjs/h3/compare/v0.3.4...v0.3.5) (2021-11-24)


### Bug Fixes

* **useBody:** support `req._body` ([0d0cd61](https://github.com/unjs/h3/commit/0d0cd614f78038df3bfe3006be3281b8854bc445))

### [0.3.4](https://github.com/unjs/h3/compare/v0.3.3...v0.3.4) (2021-11-24)


### Features

* `useMethod`/`isMethod`/`assertMethod` ([c45278d](https://github.com/unjs/h3/commit/c45278da64dca61147b54ee05cdbff87dbb14345))
* add `defineHandle` and `defineMiddleware` type helpers ([#47](https://github.com/unjs/h3/issues/47)) ([8260887](https://github.com/unjs/h3/commit/8260887f9efee5521de5c3653df82b24cb692377))

### [0.3.3](https://github.com/unjs/h3/compare/v0.3.2...v0.3.3) (2021-10-14)

### [0.3.2](https://github.com/unjs/h3/compare/v0.3.1...v0.3.2) (2021-10-14)

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
