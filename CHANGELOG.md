## [1.20.1](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0...v1.20.1) (2025-12-11)


### 🐞 Bug Fixes

* **skill:** improve ui-ux-pro-max activation for frontend work ([0ffc7dc](https://github.com/claudekit/claudekit-engineer/commit/0ffc7dcdbae422ce89145565cc1c75b4e86b2c07)), closes [#153](https://github.com/claudekit/claudekit-engineer/issues/153)

## [1.20.1-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0...v1.20.1-beta.1) (2025-12-11)


### 🐞 Bug Fixes

* **skill:** improve ui-ux-pro-max activation for frontend work ([0ffc7dc](https://github.com/claudekit/claudekit-engineer/commit/0ffc7dcdbae422ce89145565cc1c75b4e86b2c07)), closes [#153](https://github.com/claudekit/claudekit-engineer/issues/153)

## [1.20.0](https://github.com/claudekit/claudekit-engineer/compare/v1.19.0...v1.20.0) (2025-12-11)


### 🚀 Features

* add hybrid output-type detection for /ck-help ([480ec1c](https://github.com/claudekit/claudekit-engineer/commit/480ec1c2e9f5fe4107964d4f48418d9f408d506b))
* implement cascading config resolution (global → local) ([9a826c8](https://github.com/claudekit/claudekit-engineer/commit/9a826c8f3accf54e1a8cbe2c4948999f364a806e))
* implement hook consolidation with plan name config ([#134](https://github.com/claudekit/claudekit-engineer/issues/134)) ([764e962](https://github.com/claudekit/claudekit-engineer/commit/764e96220b65554affef83459c98fb64c219518e)), closes [#88](https://github.com/claudekit/claudekit-engineer/issues/88)
* **install:** implement bulletproof skills installation with error tracking ([6d47df0](https://github.com/claudekit/claudekit-engineer/commit/6d47df017dd2268cdce94e43eb046b5cce40cf3e))
* **skills:** integrate ui-ux-pro-max as primary frontend skill ([3c3a5c4](https://github.com/claudekit/claudekit-engineer/commit/3c3a5c46a071f5b2b7dd9eab5d8ac946dea71dc4)), closes [#142](https://github.com/claudekit/claudekit-engineer/issues/142)


### 🐞 Bug Fixes

* **hooks:** correct .ckignore path calculation in scout-block ([fd09f6f](https://github.com/claudekit/claudekit-engineer/commit/fd09f6f4d33531a0090571d8684c734ddb358760)), closes [#144](https://github.com/claudekit/claudekit-engineer/issues/144)
* **hooks:** prevent stale plan pollution on fresh sessions ([bd17c53](https://github.com/claudekit/claudekit-engineer/commit/bd17c53daa2d2de499d6e3d284d2ba5d9c402aba)), closes [#146](https://github.com/claudekit/claudekit-engineer/issues/146)
* **install:** add bulletproof error handling and state persistence ([8b1628d](https://github.com/claudekit/claudekit-engineer/commit/8b1628df9ee09ca2bc3e2288a68dc853ad9e7f68))
* **install:** resolve Windows PowerShell detection and state errors ([c4b2c10](https://github.com/claudekit/claudekit-engineer/commit/c4b2c10ec0c6e9e29fee973a66761503054c4d14)), closes [#148](https://github.com/claudekit/claudekit-engineer/issues/148)
* resolve workflow paths from global ~/.claude when local files missing ([9a66e21](https://github.com/claudekit/claudekit-engineer/commit/9a66e21f77375b91ce4e7a8ce5df93245119010b)), closes [#117](https://github.com/claudekit/claudekit-engineer/issues/117)
* **skill:** improve ui-ux-pro-max activation for frontend work ([0ffc7dc](https://github.com/claudekit/claudekit-engineer/commit/0ffc7dcdbae422ce89145565cc1c75b4e86b2c07)), closes [#153](https://github.com/claudekit/claudekit-engineer/issues/153)


### 📚 Documentation

* fix YANGI typo to YAGNI across documentation ([2403f12](https://github.com/claudekit/claudekit-engineer/commit/2403f12c362792084b0d892d29df38752589db7c)), closes [#138](https://github.com/claudekit/claudekit-engineer/issues/138)
* revert documentation changes and restore original content ([bf114ed](https://github.com/claudekit/claudekit-engineer/commit/bf114ed2ae5b24ce2f956a3ac021dd02e6f5b615))


### ♻️ Code Refactoring

* migrate active-plan storage to session state ([942a074](https://github.com/claudekit/claudekit-engineer/commit/942a074980f21bbbbf0868c303aeb04d68b6239e))
* remove opencode for now ([f0b1fba](https://github.com/claudekit/claudekit-engineer/commit/f0b1fba46938ab59621018ce2cbb41c9307efd7b))
* replace hardcoded date formats with {date} placeholder ([fdf035a](https://github.com/claudekit/claudekit-engineer/commit/fdf035a83d21bac55f9322399d2a853ed93be960)), closes [#140](https://github.com/claudekit/claudekit-engineer/issues/140)


### ⚡ Performance Improvements

* **hooks:** optimize token consumption in hook system ([f0007bc](https://github.com/claudekit/claudekit-engineer/commit/f0007bc52b64032c7692576109d7a35a91977f4e)), closes [#150](https://github.com/claudekit/claudekit-engineer/issues/150)
* new command -> `/code:auto` with auto-approval mode activated ([3622168](https://github.com/claudekit/claudekit-engineer/commit/36221682dd0f215b688cb806c7d1172b4b6c3ae7))
* **skill:** enhance chrome-devtools with aria snapshot and ref selection ([d50489f](https://github.com/claudekit/claudekit-engineer/commit/d50489f5ee6d5d3f6c1f331df3dc89aa7f380a98))

## [1.20.0-beta.13](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.12...v1.20.0-beta.13) (2025-12-11)


### 🐞 Bug Fixes

* **skill:** improve ui-ux-pro-max activation for frontend work ([0ffc7dc](https://github.com/claudekit/claudekit-engineer/commit/0ffc7dcdbae422ce89145565cc1c75b4e86b2c07)), closes [#153](https://github.com/claudekit/claudekit-engineer/issues/153)


### 📚 Documentation

* revert documentation changes and restore original content ([bf114ed](https://github.com/claudekit/claudekit-engineer/commit/bf114ed2ae5b24ce2f956a3ac021dd02e6f5b615))

## [1.20.0-beta.12](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.11...v1.20.0-beta.12) (2025-12-10)


### ⚡ Performance Improvements

* **hooks:** optimize token consumption in hook system ([f0007bc](https://github.com/claudekit/claudekit-engineer/commit/f0007bc52b64032c7692576109d7a35a91977f4e)), closes [#150](https://github.com/claudekit/claudekit-engineer/issues/150)

## [1.20.0-beta.11](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.10...v1.20.0-beta.11) (2025-12-09)


### 🐞 Bug Fixes

* **install:** resolve Windows PowerShell detection and state errors ([c4b2c10](https://github.com/claudekit/claudekit-engineer/commit/c4b2c10ec0c6e9e29fee973a66761503054c4d14)), closes [#148](https://github.com/claudekit/claudekit-engineer/issues/148)

## [1.20.0-beta.10](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.9...v1.20.0-beta.10) (2025-12-08)


### 🐞 Bug Fixes

* **hooks:** prevent stale plan pollution on fresh sessions ([bd17c53](https://github.com/claudekit/claudekit-engineer/commit/bd17c53daa2d2de499d6e3d284d2ba5d9c402aba)), closes [#146](https://github.com/claudekit/claudekit-engineer/issues/146)

## [1.20.0-beta.9](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.8...v1.20.0-beta.9) (2025-12-08)


### 🐞 Bug Fixes

* **hooks:** correct .ckignore path calculation in scout-block ([fd09f6f](https://github.com/claudekit/claudekit-engineer/commit/fd09f6f4d33531a0090571d8684c734ddb358760)), closes [#144](https://github.com/claudekit/claudekit-engineer/issues/144)

## [1.20.0-beta.8](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.7...v1.20.0-beta.8) (2025-12-08)


### 🚀 Features

* **skills:** integrate ui-ux-pro-max as primary frontend skill ([3c3a5c4](https://github.com/claudekit/claudekit-engineer/commit/3c3a5c46a071f5b2b7dd9eab5d8ac946dea71dc4)), closes [#142](https://github.com/claudekit/claudekit-engineer/issues/142)

## [1.20.0-beta.7](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.6...v1.20.0-beta.7) (2025-12-07)


### 📚 Documentation

* fix YANGI typo to YAGNI across documentation ([2403f12](https://github.com/claudekit/claudekit-engineer/commit/2403f12c362792084b0d892d29df38752589db7c)), closes [#138](https://github.com/claudekit/claudekit-engineer/issues/138)


### ♻️ Code Refactoring

* replace hardcoded date formats with {date} placeholder ([fdf035a](https://github.com/claudekit/claudekit-engineer/commit/fdf035a83d21bac55f9322399d2a853ed93be960)), closes [#140](https://github.com/claudekit/claudekit-engineer/issues/140)

## [1.20.0-beta.6](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.5...v1.20.0-beta.6) (2025-12-07)


### ♻️ Code Refactoring

* migrate active-plan storage to session state ([942a074](https://github.com/claudekit/claudekit-engineer/commit/942a074980f21bbbbf0868c303aeb04d68b6239e))

## [1.20.0-beta.5](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.4...v1.20.0-beta.5) (2025-12-07)


### 🚀 Features

* **install:** implement bulletproof skills installation with error tracking ([6d47df0](https://github.com/claudekit/claudekit-engineer/commit/6d47df017dd2268cdce94e43eb046b5cce40cf3e))


### 🐞 Bug Fixes

* **install:** add bulletproof error handling and state persistence ([8b1628d](https://github.com/claudekit/claudekit-engineer/commit/8b1628df9ee09ca2bc3e2288a68dc853ad9e7f68))

## [1.20.0-beta.4](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.3...v1.20.0-beta.4) (2025-12-06)


### 🚀 Features

* add hybrid output-type detection for /ck-help ([480ec1c](https://github.com/claudekit/claudekit-engineer/commit/480ec1c2e9f5fe4107964d4f48418d9f408d506b))

## [1.20.0-beta.3](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.2...v1.20.0-beta.3) (2025-12-06)


### 🚀 Features

* implement cascading config resolution (global → local) ([9a826c8](https://github.com/claudekit/claudekit-engineer/commit/9a826c8f3accf54e1a8cbe2c4948999f364a806e))

## [1.20.0-beta.2](https://github.com/claudekit/claudekit-engineer/compare/v1.20.0-beta.1...v1.20.0-beta.2) (2025-12-06)


### 🐞 Bug Fixes

* resolve workflow paths from global ~/.claude when local files missing ([9a66e21](https://github.com/claudekit/claudekit-engineer/commit/9a66e21f77375b91ce4e7a8ce5df93245119010b)), closes [#117](https://github.com/claudekit/claudekit-engineer/issues/117)

## [1.20.0-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.19.1-beta.1...v1.20.0-beta.1) (2025-12-06)


### 🚀 Features

* implement hook consolidation with plan name config ([#134](https://github.com/claudekit/claudekit-engineer/issues/134)) ([764e962](https://github.com/claudekit/claudekit-engineer/commit/764e96220b65554affef83459c98fb64c219518e)), closes [#88](https://github.com/claudekit/claudekit-engineer/issues/88)

## [1.19.1-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.19.0...v1.19.1-beta.1) (2025-12-06)


### ⚡ Performance Improvements

* new command -> `/code:auto` with auto-approval mode activated ([3622168](https://github.com/claudekit/claudekit-engineer/commit/36221682dd0f215b688cb806c7d1172b4b6c3ae7))

## [1.19.0](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0...v1.19.0) (2025-12-05)


### 🚀 Features

* **ai-multimodal:** add stdin support for piped file input ([#123](https://github.com/claudekit/claudekit-engineer/issues/123)) ([76c65b4](https://github.com/claudekit/claudekit-engineer/commit/76c65b4d7603d2ecc4259ab777933f3216dddf78)), closes [#122](https://github.com/claudekit/claudekit-engineer/issues/122)


### 🐞 Bug Fixes

* `/fix:hard` should utilize `/code` ([f673977](https://github.com/claudekit/claudekit-engineer/commit/f673977c9548cfe216edf417efa09737909c1820))
* `aesthetic` skills is deprecated due to inefficiency ([8592d07](https://github.com/claudekit/claudekit-engineer/commit/8592d07bb43b576fbd07b1636fe9ff4d07b3aa98))
* add proper sudo handling for Linux package installation ([#119](https://github.com/claudekit/claudekit-engineer/issues/119)) ([dac980b](https://github.com/claudekit/claudekit-engineer/commit/dac980b220b4b775048905d07b591f1bca2fd039)), closes [#118](https://github.com/claudekit/claudekit-engineer/issues/118)
* added more env context to `dev-rules-reminder` hook ([0bd3e06](https://github.com/claudekit/claudekit-engineer/commit/0bd3e067552aec82388b01d2e2609931d7d8d1dc))
* **ai-multimodal:** print results to stdout and default to free-tier model ([#126](https://github.com/claudekit/claudekit-engineer/issues/126)) ([317c647](https://github.com/claudekit/claudekit-engineer/commit/317c64737690b9115763941e404b7967b0ffc702)), closes [#124](https://github.com/claudekit/claudekit-engineer/issues/124) [#125](https://github.com/claudekit/claudekit-engineer/issues/125)
* **ck-help:** resolve Windows console UTF-8 encoding issue ([acb64ae](https://github.com/claudekit/claudekit-engineer/commit/acb64ae65da4f535d502c034239ea16823ab2b70))


### 📚 Documentation

* shorten descriptions of docs-manager and fullstack-dev agents ([bffdc79](https://github.com/claudekit/claudekit-engineer/commit/bffdc794cfef7ea685c56bf64ee1e8ac817fe7ec))

## [1.19.0-beta.3](https://github.com/claudekit/claudekit-engineer/compare/v1.19.0-beta.2...v1.19.0-beta.3) (2025-12-04)


### 🐞 Bug Fixes

* `/fix:hard` should utilize `/code` ([f673977](https://github.com/claudekit/claudekit-engineer/commit/f673977c9548cfe216edf417efa09737909c1820))
* `aesthetic` skills is deprecated due to inefficiency ([8592d07](https://github.com/claudekit/claudekit-engineer/commit/8592d07bb43b576fbd07b1636fe9ff4d07b3aa98))
* add proper sudo handling for Linux package installation ([#119](https://github.com/claudekit/claudekit-engineer/issues/119)) ([dac980b](https://github.com/claudekit/claudekit-engineer/commit/dac980b220b4b775048905d07b591f1bca2fd039)), closes [#118](https://github.com/claudekit/claudekit-engineer/issues/118)
* added more env context to `dev-rules-reminder` hook ([0bd3e06](https://github.com/claudekit/claudekit-engineer/commit/0bd3e067552aec82388b01d2e2609931d7d8d1dc))

## [1.19.0-beta.2](https://github.com/claudekit/claudekit-engineer/compare/v1.19.0-beta.1...v1.19.0-beta.2) (2025-12-03)


### 🐞 Bug Fixes

* **ai-multimodal:** print results to stdout and default to free-tier model ([#126](https://github.com/claudekit/claudekit-engineer/issues/126)) ([317c647](https://github.com/claudekit/claudekit-engineer/commit/317c64737690b9115763941e404b7967b0ffc702)), closes [#124](https://github.com/claudekit/claudekit-engineer/issues/124) [#125](https://github.com/claudekit/claudekit-engineer/issues/125)

## [1.19.0-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0...v1.19.0-beta.1) (2025-12-03)


### 🚀 Features

* **ai-multimodal:** add stdin support for piped file input ([#123](https://github.com/claudekit/claudekit-engineer/issues/123)) ([76c65b4](https://github.com/claudekit/claudekit-engineer/commit/76c65b4d7603d2ecc4259ab777933f3216dddf78)), closes [#122](https://github.com/claudekit/claudekit-engineer/issues/122)

## [1.18.0-beta.13](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.12...v1.18.0-beta.13) (2025-12-03)


### 🚀 Features

* **ai-multimodal:** add stdin support for piped file input ([#123](https://github.com/claudekit/claudekit-engineer/issues/123)) ([76c65b4](https://github.com/claudekit/claudekit-engineer/commit/76c65b4d7603d2ecc4259ab777933f3216dddf78)), closes [#122](https://github.com/claudekit/claudekit-engineer/issues/122)

## [1.18.0](https://github.com/claudekit/claudekit-engineer/compare/v1.17.1...v1.18.0) (2025-12-03)


### 🚀 Features

* **commands:** add /ck-help command for ClaudeKit usage guide ([#114](https://github.com/claudekit/claudekit-engineer/issues/114)) ([8234cf3](https://github.com/claudekit/claudekit-engineer/commit/8234cf30caf13b1bb012f2aa9d2ff9e7d327d034)), closes [#99](https://github.com/claudekit/claudekit-engineer/issues/99)
* new command: `/git:merge <to> <from>` ([79e45f4](https://github.com/claudekit/claudekit-engineer/commit/79e45f4f3429b6d6907627a07e2468b9d85023df))


### 🐞 Bug Fixes

* `/fix:hard` should ask user for clarifications ([605f6b2](https://github.com/claudekit/claudekit-engineer/commit/605f6b28bf0fa22dc267c6bfae1e1437e14a05b4))
* `/fix:hard` should utilize `/code` ([b144ad9](https://github.com/claudekit/claudekit-engineer/commit/b144ad91e7a9434b3e4fb29b04f9e69407b30486))
* add proper sudo handling for Linux package installation ([#119](https://github.com/claudekit/claudekit-engineer/issues/119)) ([6453335](https://github.com/claudekit/claudekit-engineer/commit/6453335b80d10dc05e60543b17603296d47fae9b)), closes [#118](https://github.com/claudekit/claudekit-engineer/issues/118)
* **ai-multimodal:** auto-detect task from file extension ([#102](https://github.com/claudekit/claudekit-engineer/issues/102)) ([#113](https://github.com/claudekit/claudekit-engineer/issues/113)) ([230d04c](https://github.com/claudekit/claudekit-engineer/commit/230d04cb3f5e61a65089fb3c4605c7c1a1aa3699))
* allow research in `/skill:add` & `/skill:fix` ([3c7d27f](https://github.com/claudekit/claudekit-engineer/commit/3c7d27f19a35060bb554e7c9552c46cb95983c6c))
* detect and warn about broken UV Python installation ([7f58766](https://github.com/claudekit/claudekit-engineer/commit/7f5876649189f21a206591af07da022ad6f9d056))
* handle corrupted venv in skills install script ([b90928f](https://github.com/claudekit/claudekit-engineer/commit/b90928fd71ea0d9038521a358074559d71e53cf0))
* **hooks:** convert ES6 imports to CommonJS for hook compatibility ([#103](https://github.com/claudekit/claudekit-engineer/issues/103)) ([9cd2e08](https://github.com/claudekit/claudekit-engineer/commit/9cd2e082477328bf175af9b198bb6c66a2af2755)), closes [#86](https://github.com/claudekit/claudekit-engineer/issues/86)
* **install:** use command-first detection for npm packages ([#101](https://github.com/claudekit/claudekit-engineer/issues/101)) ([e162508](https://github.com/claudekit/claudekit-engineer/commit/e1625087dd832e136ce0f73aff635c9b930454d9))
* robust venv creation with ensurepip fallback and validation ([b2b81c5](https://github.com/claudekit/claudekit-engineer/commit/b2b81c5846cdc8d8db140ad09259498cd78973dd))
* skills install script fails due to bash arithmetic exit code ([#111](https://github.com/claudekit/claudekit-engineer/issues/111)) ([b498d35](https://github.com/claudekit/claudekit-engineer/commit/b498d35c9f2004388728e77e3c93a80bd5567ed0))
* skills installation fails on macOS and hides pip errors ([#109](https://github.com/claudekit/claudekit-engineer/issues/109)) ([3c83e22](https://github.com/claudekit/claudekit-engineer/commit/3c83e22784ee3c1c9b61f8f82b72144f4192493e)), closes [#108](https://github.com/claudekit/claudekit-engineer/issues/108)
* skills installation fails on macOS and hides pip errors ([#110](https://github.com/claudekit/claudekit-engineer/issues/110)) ([c33167b](https://github.com/claudekit/claudekit-engineer/commit/c33167b26ef8220ebded794f57896fd773c5fb53)), closes [#108](https://github.com/claudekit/claudekit-engineer/issues/108)


### 📚 Documentation

* fix discord link in readme ([049151f](https://github.com/claudekit/claudekit-engineer/commit/049151f5bba097f8728398aaae72f902598c8fcc)), closes [#112](https://github.com/claudekit/claudekit-engineer/issues/112)


### ⚡ Performance Improvements

* `/skill:create` can ask for clarifications ([7f447eb](https://github.com/claudekit/claudekit-engineer/commit/7f447eb267f8115edd0d1b5eb9a1f1c390820ce9))
* new command: `/code:no-test` ([0cf49e4](https://github.com/claudekit/claudekit-engineer/commit/0cf49e4a0f6058de274344228bc8372b817e6358))
* use native `AskUserQuestion` tool for clarifications ([d342b8b](https://github.com/claudekit/claudekit-engineer/commit/d342b8bfb87c3a162870b4f35c794fafc10edd31))

## [1.18.0-beta.12](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.11...v1.18.0-beta.12) (2025-12-02)


### 🐞 Bug Fixes

* add proper sudo handling for Linux package installation ([#119](https://github.com/claudekit/claudekit-engineer/issues/119)) ([6453335](https://github.com/claudekit/claudekit-engineer/commit/6453335b80d10dc05e60543b17603296d47fae9b)), closes [#118](https://github.com/claudekit/claudekit-engineer/issues/118)

## [1.18.0-beta.11](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.10...v1.18.0-beta.11) (2025-12-01)


### 🐞 Bug Fixes

* `/fix:hard` should utilize `/code` ([b144ad9](https://github.com/claudekit/claudekit-engineer/commit/b144ad91e7a9434b3e4fb29b04f9e69407b30486))

## [1.18.0-beta.10](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.9...v1.18.0-beta.10) (2025-12-01)


### 🐞 Bug Fixes

* `/fix:hard` should ask user for clarifications ([605f6b2](https://github.com/claudekit/claudekit-engineer/commit/605f6b28bf0fa22dc267c6bfae1e1437e14a05b4))
* allow research in `/skill:add` & `/skill:fix` ([3c7d27f](https://github.com/claudekit/claudekit-engineer/commit/3c7d27f19a35060bb554e7c9552c46cb95983c6c))


### 📚 Documentation

* fix discord link in readme ([049151f](https://github.com/claudekit/claudekit-engineer/commit/049151f5bba097f8728398aaae72f902598c8fcc)), closes [#112](https://github.com/claudekit/claudekit-engineer/issues/112)


### ⚡ Performance Improvements

* `/skill:create` can ask for clarifications ([7f447eb](https://github.com/claudekit/claudekit-engineer/commit/7f447eb267f8115edd0d1b5eb9a1f1c390820ce9))
* new command: `/code:no-test` ([0cf49e4](https://github.com/claudekit/claudekit-engineer/commit/0cf49e4a0f6058de274344228bc8372b817e6358))

## [1.18.0-beta.9](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.8...v1.18.0-beta.9) (2025-12-01)


### 🚀 Features

* **commands:** add /ck-help command for ClaudeKit usage guide ([#114](https://github.com/claudekit/claudekit-engineer/issues/114)) ([8234cf3](https://github.com/claudekit/claudekit-engineer/commit/8234cf30caf13b1bb012f2aa9d2ff9e7d327d034)), closes [#99](https://github.com/claudekit/claudekit-engineer/issues/99)

## [1.18.0-beta.8](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.7...v1.18.0-beta.8) (2025-12-01)


### 🐞 Bug Fixes

* detect and warn about broken UV Python installation ([7f58766](https://github.com/claudekit/claudekit-engineer/commit/7f5876649189f21a206591af07da022ad6f9d056))

## [1.18.0-beta.7](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.6...v1.18.0-beta.7) (2025-12-01)


### 🐞 Bug Fixes

* robust venv creation with ensurepip fallback and validation ([b2b81c5](https://github.com/claudekit/claudekit-engineer/commit/b2b81c5846cdc8d8db140ad09259498cd78973dd))

## [1.18.0-beta.6](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.5...v1.18.0-beta.6) (2025-12-01)


### 🐞 Bug Fixes

* **ai-multimodal:** auto-detect task from file extension ([#102](https://github.com/claudekit/claudekit-engineer/issues/102)) ([#113](https://github.com/claudekit/claudekit-engineer/issues/113)) ([230d04c](https://github.com/claudekit/claudekit-engineer/commit/230d04cb3f5e61a65089fb3c4605c7c1a1aa3699))

## [1.18.0-beta.5](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.4...v1.18.0-beta.5) (2025-12-01)


### 🐞 Bug Fixes

* handle corrupted venv in skills install script ([b90928f](https://github.com/claudekit/claudekit-engineer/commit/b90928fd71ea0d9038521a358074559d71e53cf0))

## [1.18.0-beta.4](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.3...v1.18.0-beta.4) (2025-12-01)


### 🐞 Bug Fixes

* skills install script fails due to bash arithmetic exit code ([#111](https://github.com/claudekit/claudekit-engineer/issues/111)) ([b498d35](https://github.com/claudekit/claudekit-engineer/commit/b498d35c9f2004388728e77e3c93a80bd5567ed0))

## [1.18.0-beta.3](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.2...v1.18.0-beta.3) (2025-12-01)


### 🐞 Bug Fixes

* skills installation fails on macOS and hides pip errors ([#110](https://github.com/claudekit/claudekit-engineer/issues/110)) ([c33167b](https://github.com/claudekit/claudekit-engineer/commit/c33167b26ef8220ebded794f57896fd773c5fb53)), closes [#108](https://github.com/claudekit/claudekit-engineer/issues/108)

## [1.18.0-beta.2](https://github.com/claudekit/claudekit-engineer/compare/v1.18.0-beta.1...v1.18.0-beta.2) (2025-12-01)


### 🐞 Bug Fixes

* skills installation fails on macOS and hides pip errors ([#109](https://github.com/claudekit/claudekit-engineer/issues/109)) ([3c83e22](https://github.com/claudekit/claudekit-engineer/commit/3c83e22784ee3c1c9b61f8f82b72144f4192493e)), closes [#108](https://github.com/claudekit/claudekit-engineer/issues/108)

## [1.18.0-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.17.1...v1.18.0-beta.1) (2025-12-01)


### 🚀 Features

* new command: `/git:merge <to> <from>` ([79e45f4](https://github.com/claudekit/claudekit-engineer/commit/79e45f4f3429b6d6907627a07e2468b9d85023df))


### 🐞 Bug Fixes

* **hooks:** convert ES6 imports to CommonJS for hook compatibility ([#103](https://github.com/claudekit/claudekit-engineer/issues/103)) ([9cd2e08](https://github.com/claudekit/claudekit-engineer/commit/9cd2e082477328bf175af9b198bb6c66a2af2755)), closes [#86](https://github.com/claudekit/claudekit-engineer/issues/86)
* **install:** use command-first detection for npm packages ([#101](https://github.com/claudekit/claudekit-engineer/issues/101)) ([e162508](https://github.com/claudekit/claudekit-engineer/commit/e1625087dd832e136ce0f73aff635c9b930454d9))


### ⚡ Performance Improvements

* use native `AskUserQuestion` tool for clarifications ([d342b8b](https://github.com/claudekit/claudekit-engineer/commit/d342b8bfb87c3a162870b4f35c794fafc10edd31))

## [1.17.1](https://github.com/claudekit/claudekit-engineer/compare/v1.17.0...v1.17.1) (2025-12-01)


### 🐞 Bug Fixes

* correct license ([f260430](https://github.com/claudekit/claudekit-engineer/commit/f2604303037f80d018ea1e0c1890b708c29b0847))

## [1.17.0](https://github.com/claudekit/claudekit-engineer/compare/v1.16.3...v1.17.0) (2025-12-01)


### 🚀 Features

* **skills:** add ui-ux-pro-max design intelligence skill ([01d7ed1](https://github.com/claudekit/claudekit-engineer/commit/01d7ed133071cf040dfbf3faa39566e15cd6d0fe))

## [1.16.3](https://github.com/claudekit/claudekit-engineer/compare/v1.16.2...v1.16.3) (2025-12-01)


### 🐞 Bug Fixes

* **hooks:** add dev-rules-reminder and scout-block hooks for improved development workflow ([fe004a0](https://github.com/claudekit/claudekit-engineer/commit/fe004a01168482f9bd44f104909e25cbccd8effd))

## [1.16.3-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.16.2...v1.16.3-beta.1) (2025-12-01)


### 🐞 Bug Fixes

* **hooks:** convert ES6 imports to CommonJS for hook compatibility ([#103](https://github.com/claudekit/claudekit-engineer/issues/103)) ([9cd2e08](https://github.com/claudekit/claudekit-engineer/commit/9cd2e082477328bf175af9b198bb6c66a2af2755)), closes [#86](https://github.com/claudekit/claudekit-engineer/issues/86)
* **install:** use command-first detection for npm packages ([#101](https://github.com/claudekit/claudekit-engineer/issues/101)) ([e162508](https://github.com/claudekit/claudekit-engineer/commit/e1625087dd832e136ce0f73aff635c9b930454d9))

## [1.16.2](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1...v1.16.2) (2025-11-30)


### 🐞 Bug Fixes

* correct module hooks ([b0b5a3b](https://github.com/claudekit/claudekit-engineer/commit/b0b5a3b27140d64e229aa0cda99db19d70e324ef))

## [1.16.1](https://github.com/claudekit/claudekit-engineer/compare/v1.16.0...v1.16.1) (2025-11-29)


### 🐞 Bug Fixes

* `/code` enhancement ([805c503](https://github.com/claudekit/claudekit-engineer/commit/805c503f068be2b13820db6e3baf0c2a58551187))
* **active-plan:** use WORKING-DIR prefix to bypass CLI transformer ([2cd71c3](https://github.com/claudekit/claudekit-engineer/commit/2cd71c3ff02c30b4efa2e369cc10f5be53e9cb2e))
* **active-plan:** use WORKING-DIR prefix to bypass CLI transformer ([869a3b8](https://github.com/claudekit/claudekit-engineer/commit/869a3b8b94a7e62898851b1b2f03692af43aa3f6))
* **active-plan:** use WORKING-DIR prefix to bypass CLI transformer ([3875b31](https://github.com/claudekit/claudekit-engineer/commit/3875b31e83a8b497b885d22d5550aa176c118df2))
* **agents:** add active-plan awareness for report output coordination ([95a47f3](https://github.com/claudekit/claudekit-engineer/commit/95a47f340f73094dae015cda703d0d4fdd3f49bd))
* **agents:** add active-plan awareness for report output coordination ([d46f64e](https://github.com/claudekit/claudekit-engineer/commit/d46f64e32fe006e238fbab47d130637242057da6))
* **agents:** add active-plan awareness for report output coordination ([b5d8f9c](https://github.com/claudekit/claudekit-engineer/commit/b5d8f9c997c29e7b28b86ecd40dc873535c0d53f))
* **agents:** add large file handling guidance to scout and planner agents ([#73](https://github.com/claudekit/claudekit-engineer/issues/73)) ([7142429](https://github.com/claudekit/claudekit-engineer/commit/71424298f5093132c90c0a0d16222303181cceee)), closes [#66](https://github.com/claudekit/claudekit-engineer/issues/66)
* **agents:** extend active-plan awareness to 8 doc-producing agents ([e252544](https://github.com/claudekit/claudekit-engineer/commit/e252544f579d7d19a475c1610f64e11c7094fa50)), closes [#91](https://github.com/claudekit/claudekit-engineer/issues/91)
* **agents:** extend active-plan awareness to 8 doc-producing agents ([609e279](https://github.com/claudekit/claudekit-engineer/commit/609e279896d8987c99c11480add59b1020f9facb)), closes [#91](https://github.com/claudekit/claudekit-engineer/issues/91)
* **agents:** prevent subagents from spawning subagents in docs commands ([7af8924](https://github.com/claudekit/claudekit-engineer/commit/7af89249822e6006beb2b5d51692f0e10cd3869f)), closes [#68](https://github.com/claudekit/claudekit-engineer/issues/68)
* **agents:** prevent subagents from spawning subagents in docs commands ([7730212](https://github.com/claudekit/claudekit-engineer/commit/7730212345e87668ca0e1853bb5596f63631e37c)), closes [#68](https://github.com/claudekit/claudekit-engineer/issues/68)
* **catalog-generation:** resolve .claude paths relative to home directory ([ae017a8](https://github.com/claudekit/claudekit-engineer/commit/ae017a8d8de10ef736eae60aaf54071d9af0460d))
* **commands:** add active-plan state check to prevent duplicate plan folders ([c81cc8d](https://github.com/claudekit/claudekit-engineer/commit/c81cc8de33884a11a8c2f60e76160479655b2922)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **commands:** add active-plan state check to prevent duplicate plan folders ([f2a8c22](https://github.com/claudekit/claudekit-engineer/commit/f2a8c22e65b20a108aeef60d691a933f9a5be6dc)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **commands:** add active-plan state check to prevent duplicate plan folders ([2096047](https://github.com/claudekit/claudekit-engineer/commit/209604760a24178919636731e451193e2b18f611)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* enhance `/code` command (thanks [@dta](https://github.com/dta).teks) ([f7b1c3c](https://github.com/claudekit/claudekit-engineer/commit/f7b1c3cef87d5523506262413d6e53b6820ae65b))
* enhance `ai-multimodal` skills with detailed instructions & descriptions ([a36b2bc](https://github.com/claudekit/claudekit-engineer/commit/a36b2bcd0263f74673f9f616d7a338b317b9e620))
* **env:** resolve GEMINI_API_KEY detection without python-dotenv ([#94](https://github.com/claudekit/claudekit-engineer/issues/94)) ([bf8ad35](https://github.com/claudekit/claudekit-engineer/commit/bf8ad355c60110c13241ba41cb90a373b9d26753)), closes [#92](https://github.com/claudekit/claudekit-engineer/issues/92)
* **env:** resolve GEMINI_API_KEY detection without python-dotenv ([#94](https://github.com/claudekit/claudekit-engineer/issues/94)) ([4080442](https://github.com/claudekit/claudekit-engineer/commit/4080442c96257b2cc990c9e4e18369f730515b37)), closes [#92](https://github.com/claudekit/claudekit-engineer/issues/92)
* **hooks:** respect .ckignore patterns in scout-block hook ([#64](https://github.com/claudekit/claudekit-engineer/issues/64)) ([#70](https://github.com/claudekit/claudekit-engineer/issues/70)) ([c0b73d7](https://github.com/claudekit/claudekit-engineer/commit/c0b73d7df0c76fd4e80163a9d51f0bc545c2fd1b))
* issue of `ai-multimodal` skill generate video with start/end frame ([e7e74d5](https://github.com/claudekit/claudekit-engineer/commit/e7e74d5c9a90fd1d0d778ed6fe047796983f61bb))
* **planning:** add active-plan state tracking to prevent version proliferation ([13a19f6](https://github.com/claudekit/claudekit-engineer/commit/13a19f62d74552afb2998ed62e011f1c860d1006)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **planning:** add active-plan state tracking to prevent version proliferation ([572769b](https://github.com/claudekit/claudekit-engineer/commit/572769b82b36b02af19434ca9931f464e146c9e2)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **planning:** add active-plan state tracking to prevent version proliferation ([95625ad](https://github.com/claudekit/claudekit-engineer/commit/95625ad3ded678865762f108e804c0110906c626)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **scripts:** resolve path issues in generate_catalogs.py ([#75](https://github.com/claudekit/claudekit-engineer/issues/75)) ([#89](https://github.com/claudekit/claudekit-engineer/issues/89)) ([adbfc17](https://github.com/claudekit/claudekit-engineer/commit/adbfc17992cbdaf96f7d09e0d9a18957fd090388))
* **scripts:** resolve path issues in generate_catalogs.py ([#75](https://github.com/claudekit/claudekit-engineer/issues/75)) ([#89](https://github.com/claudekit/claudekit-engineer/issues/89)) ([1a0281b](https://github.com/claudekit/claudekit-engineer/commit/1a0281bc260453029b8ec1aa1d47b4c57f72b1a9))
* **skills:** resolve PowerShell install script failures on Windows ([#90](https://github.com/claudekit/claudekit-engineer/issues/90)) ([361b947](https://github.com/claudekit/claudekit-engineer/commit/361b9479d19ec0f476bb4ab8fcb539d15dff69a5)), closes [#71](https://github.com/claudekit/claudekit-engineer/issues/71) [#71](https://github.com/claudekit/claudekit-engineer/issues/71)
* **skills:** resolve PowerShell install script failures on Windows ([#90](https://github.com/claudekit/claudekit-engineer/issues/90)) ([ac23b6f](https://github.com/claudekit/claudekit-engineer/commit/ac23b6f4355b954382a0a8548de3593ab18733c5)), closes [#71](https://github.com/claudekit/claudekit-engineer/issues/71) [#71](https://github.com/claudekit/claudekit-engineer/issues/71)
* use `gemini` command (free) to analyze images first ([40971c1](https://github.com/claudekit/claudekit-engineer/commit/40971c18b3ae1bde95b67c1cc224493e05160dd6))


### ♻️ Code Refactoring

* **.claude:** rename hook files to .cjs extension ([4de71d2](https://github.com/claudekit/claudekit-engineer/commit/4de71d2e93cc4cb911fd892705dc6ccb8a0f1462))


### ⚡ Performance Improvements

* **fix-logs:** optimize log reading with Grep head_limit and permanent piping ([#72](https://github.com/claudekit/claudekit-engineer/issues/72)) ([18d4a24](https://github.com/claudekit/claudekit-engineer/commit/18d4a2425a156ad6f979fcc299585bd4ce615ccd)), closes [#65](https://github.com/claudekit/claudekit-engineer/issues/65)
* use `haiku` for `docs-manager`, `journal`, `tester` and `opus` for `planner` ([e486124](https://github.com/claudekit/claudekit-engineer/commit/e4861243aea1d41acd7d85903eaf5718357e774a))

## [1.16.1-beta.11](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.10...v1.16.1-beta.11) (2025-11-29)


### 🐞 Bug Fixes

* **active-plan:** use WORKING-DIR prefix to bypass CLI transformer ([2cd71c3](https://github.com/claudekit/claudekit-engineer/commit/2cd71c3ff02c30b4efa2e369cc10f5be53e9cb2e))
* **active-plan:** use WORKING-DIR prefix to bypass CLI transformer ([869a3b8](https://github.com/claudekit/claudekit-engineer/commit/869a3b8b94a7e62898851b1b2f03692af43aa3f6))
* **agents:** add active-plan awareness for report output coordination ([95a47f3](https://github.com/claudekit/claudekit-engineer/commit/95a47f340f73094dae015cda703d0d4fdd3f49bd))
* **agents:** add active-plan awareness for report output coordination ([d46f64e](https://github.com/claudekit/claudekit-engineer/commit/d46f64e32fe006e238fbab47d130637242057da6))
* **agents:** extend active-plan awareness to 8 doc-producing agents ([e252544](https://github.com/claudekit/claudekit-engineer/commit/e252544f579d7d19a475c1610f64e11c7094fa50)), closes [#91](https://github.com/claudekit/claudekit-engineer/issues/91)
* **agents:** prevent subagents from spawning subagents in docs commands ([7af8924](https://github.com/claudekit/claudekit-engineer/commit/7af89249822e6006beb2b5d51692f0e10cd3869f)), closes [#68](https://github.com/claudekit/claudekit-engineer/issues/68)
* **catalog-generation:** resolve .claude paths relative to home directory ([ae017a8](https://github.com/claudekit/claudekit-engineer/commit/ae017a8d8de10ef736eae60aaf54071d9af0460d))
* **commands:** add active-plan state check to prevent duplicate plan folders ([c81cc8d](https://github.com/claudekit/claudekit-engineer/commit/c81cc8de33884a11a8c2f60e76160479655b2922)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **commands:** add active-plan state check to prevent duplicate plan folders ([f2a8c22](https://github.com/claudekit/claudekit-engineer/commit/f2a8c22e65b20a108aeef60d691a933f9a5be6dc)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **env:** resolve GEMINI_API_KEY detection without python-dotenv ([#94](https://github.com/claudekit/claudekit-engineer/issues/94)) ([bf8ad35](https://github.com/claudekit/claudekit-engineer/commit/bf8ad355c60110c13241ba41cb90a373b9d26753)), closes [#92](https://github.com/claudekit/claudekit-engineer/issues/92)
* issue of `ai-multimodal` skill generate video with start/end frame ([e7e74d5](https://github.com/claudekit/claudekit-engineer/commit/e7e74d5c9a90fd1d0d778ed6fe047796983f61bb))
* **planning:** add active-plan state tracking to prevent version proliferation ([13a19f6](https://github.com/claudekit/claudekit-engineer/commit/13a19f62d74552afb2998ed62e011f1c860d1006)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **planning:** add active-plan state tracking to prevent version proliferation ([572769b](https://github.com/claudekit/claudekit-engineer/commit/572769b82b36b02af19434ca9931f464e146c9e2)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **scripts:** resolve path issues in generate_catalogs.py ([#75](https://github.com/claudekit/claudekit-engineer/issues/75)) ([#89](https://github.com/claudekit/claudekit-engineer/issues/89)) ([adbfc17](https://github.com/claudekit/claudekit-engineer/commit/adbfc17992cbdaf96f7d09e0d9a18957fd090388))
* **skills:** resolve PowerShell install script failures on Windows ([#90](https://github.com/claudekit/claudekit-engineer/issues/90)) ([361b947](https://github.com/claudekit/claudekit-engineer/commit/361b9479d19ec0f476bb4ab8fcb539d15dff69a5)), closes [#71](https://github.com/claudekit/claudekit-engineer/issues/71) [#71](https://github.com/claudekit/claudekit-engineer/issues/71)


### ♻️ Code Refactoring

* **.claude:** rename hook files to .cjs extension ([4de71d2](https://github.com/claudekit/claudekit-engineer/commit/4de71d2e93cc4cb911fd892705dc6ccb8a0f1462))


### ⚡ Performance Improvements

* use `haiku` for `docs-manager`, `journal`, `tester` and `opus` for `planner` ([e486124](https://github.com/claudekit/claudekit-engineer/commit/e4861243aea1d41acd7d85903eaf5718357e774a))

## [1.16.1-beta.10](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.9...v1.16.1-beta.10) (2025-11-29)


### 🐞 Bug Fixes

* **env:** resolve GEMINI_API_KEY detection without python-dotenv ([#94](https://github.com/claudekit/claudekit-engineer/issues/94)) ([4080442](https://github.com/claudekit/claudekit-engineer/commit/4080442c96257b2cc990c9e4e18369f730515b37)), closes [#92](https://github.com/claudekit/claudekit-engineer/issues/92)

## [1.16.1-beta.9](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.8...v1.16.1-beta.9) (2025-11-29)


### 🐞 Bug Fixes

* **agents:** extend active-plan awareness to 8 doc-producing agents ([609e279](https://github.com/claudekit/claudekit-engineer/commit/609e279896d8987c99c11480add59b1020f9facb)), closes [#91](https://github.com/claudekit/claudekit-engineer/issues/91)

## [1.16.1-beta.8](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.7...v1.16.1-beta.8) (2025-11-29)


### 🐞 Bug Fixes

* **active-plan:** use WORKING-DIR prefix to bypass CLI transformer ([3875b31](https://github.com/claudekit/claudekit-engineer/commit/3875b31e83a8b497b885d22d5550aa176c118df2))
* **agents:** add active-plan awareness for report output coordination ([b5d8f9c](https://github.com/claudekit/claudekit-engineer/commit/b5d8f9c997c29e7b28b86ecd40dc873535c0d53f))
* **commands:** add active-plan state check to prevent duplicate plan folders ([2096047](https://github.com/claudekit/claudekit-engineer/commit/209604760a24178919636731e451193e2b18f611)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)
* **planning:** add active-plan state tracking to prevent version proliferation ([95625ad](https://github.com/claudekit/claudekit-engineer/commit/95625ad3ded678865762f108e804c0110906c626)), closes [#74](https://github.com/claudekit/claudekit-engineer/issues/74)

## [1.16.1-beta.7](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.6...v1.16.1-beta.7) (2025-11-28)


### 🐞 Bug Fixes

* **skills:** resolve PowerShell install script failures on Windows ([#90](https://github.com/claudekit/claudekit-engineer/issues/90)) ([ac23b6f](https://github.com/claudekit/claudekit-engineer/commit/ac23b6f4355b954382a0a8548de3593ab18733c5)), closes [#71](https://github.com/claudekit/claudekit-engineer/issues/71) [#71](https://github.com/claudekit/claudekit-engineer/issues/71)

## [1.16.1-beta.6](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.5...v1.16.1-beta.6) (2025-11-28)


### 🐞 Bug Fixes

* **scripts:** resolve path issues in generate_catalogs.py ([#75](https://github.com/claudekit/claudekit-engineer/issues/75)) ([#89](https://github.com/claudekit/claudekit-engineer/issues/89)) ([1a0281b](https://github.com/claudekit/claudekit-engineer/commit/1a0281bc260453029b8ec1aa1d47b4c57f72b1a9))

## [1.16.1-beta.5](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.4...v1.16.1-beta.5) (2025-11-27)


### 🐞 Bug Fixes

* **agents:** prevent subagents from spawning subagents in docs commands ([7730212](https://github.com/claudekit/claudekit-engineer/commit/7730212345e87668ca0e1853bb5596f63631e37c)), closes [#68](https://github.com/claudekit/claudekit-engineer/issues/68)

## [1.16.1-beta.4](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.3...v1.16.1-beta.4) (2025-11-27)


### 🐞 Bug Fixes

* **agents:** add large file handling guidance to scout and planner agents ([#73](https://github.com/claudekit/claudekit-engineer/issues/73)) ([7142429](https://github.com/claudekit/claudekit-engineer/commit/71424298f5093132c90c0a0d16222303181cceee)), closes [#66](https://github.com/claudekit/claudekit-engineer/issues/66)

## [1.16.1-beta.3](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.2...v1.16.1-beta.3) (2025-11-26)


### ⚡ Performance Improvements

* **fix-logs:** optimize log reading with Grep head_limit and permanent piping ([#72](https://github.com/claudekit/claudekit-engineer/issues/72)) ([18d4a24](https://github.com/claudekit/claudekit-engineer/commit/18d4a2425a156ad6f979fcc299585bd4ce615ccd)), closes [#65](https://github.com/claudekit/claudekit-engineer/issues/65)

## [1.16.1-beta.2](https://github.com/claudekit/claudekit-engineer/compare/v1.16.1-beta.1...v1.16.1-beta.2) (2025-11-26)


### 🐞 Bug Fixes

* **hooks:** respect .ckignore patterns in scout-block hook ([#64](https://github.com/claudekit/claudekit-engineer/issues/64)) ([#70](https://github.com/claudekit/claudekit-engineer/issues/70)) ([c0b73d7](https://github.com/claudekit/claudekit-engineer/commit/c0b73d7df0c76fd4e80163a9d51f0bc545c2fd1b))

## [1.16.1-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.16.0...v1.16.1-beta.1) (2025-11-26)


### 🐞 Bug Fixes

* `/code` enhancement ([805c503](https://github.com/claudekit/claudekit-engineer/commit/805c503f068be2b13820db6e3baf0c2a58551187))
* enhance `/code` command (thanks [@dta](https://github.com/dta).teks) ([f7b1c3c](https://github.com/claudekit/claudekit-engineer/commit/f7b1c3cef87d5523506262413d6e53b6820ae65b))
* enhance `ai-multimodal` skills with detailed instructions & descriptions ([a36b2bc](https://github.com/claudekit/claudekit-engineer/commit/a36b2bcd0263f74673f9f616d7a338b317b9e620))
* use `gemini` command (free) to analyze images first ([40971c1](https://github.com/claudekit/claudekit-engineer/commit/40971c18b3ae1bde95b67c1cc224493e05160dd6))

## [1.16.0](https://github.com/claudekit/claudekit-engineer/compare/v1.15.2...v1.16.0) (2025-11-26)


### 🚀 Features

* `dev-rules-reminder` hook (fully tested) ([d335aee](https://github.com/claudekit/claudekit-engineer/commit/d335aee82d3163148d0965ca52650201416e46ad))
* **ci:** use Discord embeds for consistent release notifications ([380d03b](https://github.com/claudekit/claudekit-engineer/commit/380d03beb977def325c4e904294f69561b2c2605))


### 🐞 Bug Fixes

* `/code` enhancement ([a301455](https://github.com/claudekit/claudekit-engineer/commit/a3014552f9199f6c32218cc046ccd1782f035698))
* **ci:** correct config file priority for dynamic loading ([fdafbb0](https://github.com/claudekit/claudekit-engineer/commit/fdafbb08ecfbb97aa5509873f8a687c0e232d34f))
* **ci:** embed config directly in .releaserc.cjs ([6845dc6](https://github.com/claudekit/claudekit-engineer/commit/6845dc63ba2a31e312f879f3210d516a23ad7de4))
* **ci:** include main branch in beta config ([0dfed73](https://github.com/claudekit/claudekit-engineer/commit/0dfed73f7b3f3bcf5073de91fb02bfdda2072919))
* **ci:** use dynamic config loader for semantic-release ([ef21662](https://github.com/claudekit/claudekit-engineer/commit/ef216628e32845ecbca7edac4b7c318b0e88054c))
* enhance `/code` command (thanks [@dta](https://github.com/dta).teks) ([3b06c00](https://github.com/claudekit/claudekit-engineer/commit/3b06c005ad70624c3ee8bcf232f3af885e28add4))
* enhance `ai-multimodal` skills with detailed instructions & descriptions ([18cb2f9](https://github.com/claudekit/claudekit-engineer/commit/18cb2f91fb6ec002692b0b7771ed65cf476b2272))
* enhance `dev-rules-reminder` hook ([bd0b059](https://github.com/claudekit/claudekit-engineer/commit/bd0b059abc71466a92ed31e5a16bba01d22a3678))
* **hooks:** convert dev-rules-reminder to ES module syntax ([fdc8b12](https://github.com/claudekit/claudekit-engineer/commit/fdc8b120afe7ef829de3acfa2d9baa55e43d5607))
* **hooks:** convert dev-rules-reminder to ES module syntax ([c4b12ad](https://github.com/claudekit/claudekit-engineer/commit/c4b12add0ecdf4ba5ab1da3ca1ff8b37242475cd))
* **hooks:** convert scout-block to ES module syntax ([27a3d39](https://github.com/claudekit/claudekit-engineer/commit/27a3d39cd6470502868cadc74b14e25ebd8fe79e))
* organize report files ([bf71157](https://github.com/claudekit/claudekit-engineer/commit/bf71157914732339acc086b75075136f64c05169))
* skill installation script hanging on windows powershell ([67b0792](https://github.com/claudekit/claudekit-engineer/commit/67b07921528aa8707be667add8bd2e4f7ee92625))
* skills installation script hanging issue ([ae2b60c](https://github.com/claudekit/claudekit-engineer/commit/ae2b60c2b64a501308bc8a85d8b5e43c273786eb))
* stop creating random markdown files ([8c8ae60](https://github.com/claudekit/claudekit-engineer/commit/8c8ae60c0d6da46054c042dbbc1f94919f3bd6ff))
* use `gemini` command (free) to analyze images first ([0f62fc2](https://github.com/claudekit/claudekit-engineer/commit/0f62fc2bba8d1945a1daf92af9084a2eec6d6fb9))


### 📚 Documentation

* **agents:** enhance git-manager & add fullstack-developer specs ([e828757](https://github.com/claudekit/claudekit-engineer/commit/e82875799e513b2f4999e8be985fe5b7504546b0))
* **agents:** enhance git-manager & add fullstack-developer specs ([4b751aa](https://github.com/claudekit/claudekit-engineer/commit/4b751aa6f4384788c8d9f339c266d4a34b39de6e))
* **commands:** add parallel execution definitions ([c7b6c6a](https://github.com/claudekit/claudekit-engineer/commit/c7b6c6a83dfa28e101f96a705c019c0866550a3b))
* **commands:** add parallel execution definitions ([5eff2b2](https://github.com/claudekit/claudekit-engineer/commit/5eff2b2a16f99374d22061afdb157a286414df94))
* **commands:** enhance fix command specs and add parallel execution ([9eb7b91](https://github.com/claudekit/claudekit-engineer/commit/9eb7b91eb078df0a5c2d2b2aeece4b57f096dcb3))
* **release:** add JSON schema to semantic-release configs ([2299428](https://github.com/claudekit/claudekit-engineer/commit/22994285c626aead8f15357eac001b6f5a52f0bb))


### ♻️ Code Refactoring

* migrate command/skill data to YAML format and enhance catalog generation ([5995159](https://github.com/claudekit/claudekit-engineer/commit/5995159943e77dc57988a2ac47ed8718204138a4))


### ⚡ Performance Improvements

* enhance debugging skills ([fa54ca4](https://github.com/claudekit/claudekit-engineer/commit/fa54ca463cf49e0703c2aac9035a39830d4c798b))
* enhance plan organization rules ([dc588a2](https://github.com/claudekit/claudekit-engineer/commit/dc588a2878c34e5e65411625d2f5d0e632b7a021))
* improve `ai-multimodal` skill ([cf4bd54](https://github.com/claudekit/claudekit-engineer/commit/cf4bd5471af5cde7297226ffa4e489c3729278e0))


### 👷 CI

* **release:** add beta release workflow with semantic-release ([2efeb6c](https://github.com/claudekit/claudekit-engineer/commit/2efeb6c18a9d7f735b18b71dfed16d246cdbae9d))
* **release:** add logging to semantic-release config loader ([6313b35](https://github.com/claudekit/claudekit-engineer/commit/6313b35ecbe403245464e0e2b7a78dbf2394d888))
