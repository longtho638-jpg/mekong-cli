## [2.1.0](https://github.com/claudekit/claudekit-engineer/compare/v2.0.0...v2.1.0) (2025-12-25)


### 🚀 Features

* add Gemini API key rotation for rate limit handling ([9a4c3f4](https://github.com/claudekit/claudekit-engineer/commit/9a4c3f448bab5c148ceed068c25dfd128b69a8f7)), closes [#253](https://github.com/claudekit/claudekit-engineer/issues/253)
* run /kanban as Claude Code background task for better visibility ([4d79864](https://github.com/claudekit/claudekit-engineer/commit/4d79864874de1a743811d3d86c74ccbc323f94f0)), closes [#240](https://github.com/claudekit/claudekit-engineer/issues/240)
* **skill:** add ai-artist prompt engineering skill ([374eea1](https://github.com/claudekit/claudekit-engineer/commit/374eea1aa2e82aff79836ab48167856a958dc24b))
* **skill:** add Lyria RealTime music generation reference ([3024a54](https://github.com/claudekit/claudekit-engineer/commit/3024a546eb2e080eeb59fb33ea2a245a6db26b10))


### 🐞 Bug Fixes

* /plan:archive journal creation - correct tool usage and directory path ([c64b24c](https://github.com/claudekit/claudekit-engineer/commit/c64b24c67fdc0c7920f3c801cf879d1a202948fe)), closes [#251](https://github.com/claudekit/claudekit-engineer/issues/251)
* **hooks:** add docker/k8s/terraform to build command allowlist ([fe3a24b](https://github.com/claudekit/claudekit-engineer/commit/fe3a24b81624b908daad4a2224163d01a5e919a7))
* **hooks:** add wrapper scripts and additional build tools to allowlist ([cfef5d1](https://github.com/claudekit/claudekit-engineer/commit/cfef5d17aa7ec0df2816418cbf2987fba7aaafcb))
* **hooks:** allow go/cargo/make/mvn/gradle/dotnet build commands ([b5f8dbd](https://github.com/claudekit/claudekit-engineer/commit/b5f8dbdcd228e3637675f909bf666faedbaef92d))
* install .claude/scripts/requirements.txt and fix scan_commands output ([67f3738](https://github.com/claudekit/claudekit-engineer/commit/67f373808332606861bfdea241abf72c0443b5a6)), closes [#247](https://github.com/claudekit/claudekit-engineer/issues/247)
* navbar now respects sidebar width in markdown viewer ([2985742](https://github.com/claudekit/claudekit-engineer/commit/298574228299c31108b3ce24220b8bae59b92ee8)), closes [#245](https://github.com/claudekit/claudekit-engineer/issues/245)
* **skill:** improve markdown-novel-viewer Windows path handling ([7b30640](https://github.com/claudekit/claudekit-engineer/commit/7b30640eb32c1dc0af8ab44bb882baaa61747f57))
* **skill:** use os.tmpdir() for cross-platform PID file storage ([1105d91](https://github.com/claudekit/claudekit-engineer/commit/1105d9113606df4c263bee2b1aa035dfc554304c))


### ♻️ Code Refactoring

* **skill:** update ai-multimodal to use Nano Banana Flash default ([2399ad1](https://github.com/claudekit/claudekit-engineer/commit/2399ad1558808824ef8667142da21b72cc68d6ab))


### ⚡ Performance Improvements

* **command:** enhance `/brainstorm` command ([1bf26a5](https://github.com/claudekit/claudekit-engineer/commit/1bf26a516a1b60171e12d5ddcfdb32b4b82cc949))

## [2.1.0-beta.10](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.9...v2.1.0-beta.10) (2025-12-24)


### 🐞 Bug Fixes

* **hooks:** add wrapper scripts and additional build tools to allowlist ([cfef5d1](https://github.com/claudekit/claudekit-engineer/commit/cfef5d17aa7ec0df2816418cbf2987fba7aaafcb))

## [2.1.0-beta.9](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.8...v2.1.0-beta.9) (2025-12-24)


### 🐞 Bug Fixes

* **hooks:** add docker/k8s/terraform to build command allowlist ([fe3a24b](https://github.com/claudekit/claudekit-engineer/commit/fe3a24b81624b908daad4a2224163d01a5e919a7))
* **hooks:** allow go/cargo/make/mvn/gradle/dotnet build commands ([b5f8dbd](https://github.com/claudekit/claudekit-engineer/commit/b5f8dbdcd228e3637675f909bf666faedbaef92d))

## [2.1.0-beta.8](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.7...v2.1.0-beta.8) (2025-12-24)


### 🚀 Features

* add Gemini API key rotation for rate limit handling ([9a4c3f4](https://github.com/claudekit/claudekit-engineer/commit/9a4c3f448bab5c148ceed068c25dfd128b69a8f7)), closes [#253](https://github.com/claudekit/claudekit-engineer/issues/253)

## [2.1.0-beta.7](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.6...v2.1.0-beta.7) (2025-12-24)


### 🐞 Bug Fixes

* /plan:archive journal creation - correct tool usage and directory path ([c64b24c](https://github.com/claudekit/claudekit-engineer/commit/c64b24c67fdc0c7920f3c801cf879d1a202948fe)), closes [#251](https://github.com/claudekit/claudekit-engineer/issues/251)

## [2.1.0-beta.6](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.5...v2.1.0-beta.6) (2025-12-24)


### 🐞 Bug Fixes

* **skill:** use os.tmpdir() for cross-platform PID file storage ([1105d91](https://github.com/claudekit/claudekit-engineer/commit/1105d9113606df4c263bee2b1aa035dfc554304c))

## [2.1.0-beta.5](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.4...v2.1.0-beta.5) (2025-12-24)


### 🐞 Bug Fixes

* navbar now respects sidebar width in markdown viewer ([2985742](https://github.com/claudekit/claudekit-engineer/commit/298574228299c31108b3ce24220b8bae59b92ee8)), closes [#245](https://github.com/claudekit/claudekit-engineer/issues/245)

## [2.1.0-beta.4](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.3...v2.1.0-beta.4) (2025-12-24)


### 🐞 Bug Fixes

* install .claude/scripts/requirements.txt and fix scan_commands output ([67f3738](https://github.com/claudekit/claudekit-engineer/commit/67f373808332606861bfdea241abf72c0443b5a6)), closes [#247](https://github.com/claudekit/claudekit-engineer/issues/247)

## [2.1.0-beta.3](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.2...v2.1.0-beta.3) (2025-12-23)


### 🚀 Features

* **skill:** add ai-artist prompt engineering skill ([374eea1](https://github.com/claudekit/claudekit-engineer/commit/374eea1aa2e82aff79836ab48167856a958dc24b))
* **skill:** add Lyria RealTime music generation reference ([3024a54](https://github.com/claudekit/claudekit-engineer/commit/3024a546eb2e080eeb59fb33ea2a245a6db26b10))


### ♻️ Code Refactoring

* **skill:** update ai-multimodal to use Nano Banana Flash default ([2399ad1](https://github.com/claudekit/claudekit-engineer/commit/2399ad1558808824ef8667142da21b72cc68d6ab))


### ⚡ Performance Improvements

* **command:** enhance `/brainstorm` command ([1bf26a5](https://github.com/claudekit/claudekit-engineer/commit/1bf26a516a1b60171e12d5ddcfdb32b4b82cc949))

## [2.1.0-beta.2](https://github.com/claudekit/claudekit-engineer/compare/v2.1.0-beta.1...v2.1.0-beta.2) (2025-12-23)


### 🐞 Bug Fixes

* **skill:** improve markdown-novel-viewer Windows path handling ([7b30640](https://github.com/claudekit/claudekit-engineer/commit/7b30640eb32c1dc0af8ab44bb882baaa61747f57))

## [2.1.0-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v2.0.0...v2.1.0-beta.1) (2025-12-23)


### 🚀 Features

* run /kanban as Claude Code background task for better visibility ([4d79864](https://github.com/claudekit/claudekit-engineer/commit/4d79864874de1a743811d3d86c74ccbc323f94f0)), closes [#240](https://github.com/claudekit/claudekit-engineer/issues/240)

## [2.0.0](https://github.com/claudekit/claudekit-engineer/compare/v1.20.1...v2.0.0) (2025-12-23)


### ⚠ BREAKING CHANGES

* Major Platform Update - Dashboard, Notifications, Worktree & Privacy (#239)

### 🚀 Features

* ✨ new command `/plan:archive` to write journals & archive plans ([9fe973c](https://github.com/claudekit/claudekit-engineer/commit/9fe973cd7c0412df7124a057f1c1949f4658db54))
* add centralized Windows UTF-8 compatibility utility ([a19e157](https://github.com/claudekit/claudekit-engineer/commit/a19e157bf4b1d7e2ed599d0f32acf72145e5a05a)), closes [#187](https://github.com/claudekit/claudekit-engineer/issues/187)
* add clarifying notes to hook block messages ([2865124](https://github.com/claudekit/claudekit-engineer/commit/2865124866022aaf8906f5d8e726dfc5e4e9057f)), closes [#228](https://github.com/claudekit/claudekit-engineer/issues/228)
* **chrome-devtools:** add auth session persistence for inject-auth script ([252e1c5](https://github.com/claudekit/claudekit-engineer/commit/252e1c5a15e5221fb02f97729e508d30b76c0b81))
* **ck-help:** add codingLevel documentation and brainstorm integration ([5de45fb](https://github.com/claudekit/claudekit-engineer/commit/5de45fbd07af139749246d8ea14705c51524a8a9))
* **coding-level:** add -1 as disabled default for token efficiency ([d16c889](https://github.com/claudekit/claudekit-engineer/commit/d16c889f886d48d4277d1127ff0a72f1f40d21a3))
* **hooks:** add broad pattern detection and privacy-block hook ([17ef8b4](https://github.com/claudekit/claudekit-engineer/commit/17ef8b4f6574efab08e6ff374d5f53d5d7bfd666)), closes [#184](https://github.com/claudekit/claudekit-engineer/issues/184)
* **hooks:** add codingLevel config for adaptive communication ([35a030f](https://github.com/claudekit/claudekit-engineer/commit/35a030fd7dd515979ffa1f077f7265e738c0f593)), closes [#158](https://github.com/claudekit/claudekit-engineer/issues/158)
* **hooks:** configure notification hooks for Stop, SubagentStop, Notification ([9b8ebf8](https://github.com/claudekit/claudekit-engineer/commit/9b8ebf85678b52642123b320039f527caa3e56f0))
* **hooks:** exempt example/sample/template files from privacy-block ([faf6f5f](https://github.com/claudekit/claudekit-engineer/commit/faf6f5f96de8ca3f18ea785a4bf7af3b83cb06e3)), closes [#200](https://github.com/claudekit/claudekit-engineer/issues/200)
* **locale:** add thinkingLanguage for dual-language support ([90b3eb8](https://github.com/claudekit/claudekit-engineer/commit/90b3eb8f6139f3bd70d646e294005f30ae11a42d)), closes [#180](https://github.com/claudekit/claudekit-engineer/issues/180)
* Major Platform Update - Dashboard, Notifications, Worktree & Privacy ([#239](https://github.com/claudekit/claudekit-engineer/issues/239)) ([1457c16](https://github.com/claudekit/claudekit-engineer/commit/1457c16238c241a7eda613343d946833da9aefdf))
* **markdown-novel-viewer:** add sidebar anchor navigation and inline section styling ([231fc52](https://github.com/claudekit/claudekit-engineer/commit/231fc52c493ddef27b4786b546d0020ffe2e6726))
* **nav:** add back-to-dashboard link in plan detail header ([3aeac74](https://github.com/claudekit/claudekit-engineer/commit/3aeac743aa54c07a752e71858148b4d5cda36116))
* **nav:** show planned vs implemented phases in sidebar ([f0362ec](https://github.com/claudekit/claudekit-engineer/commit/f0362ec4305cdee5ae0991c1affa508b5bf72bb2))
* **notifications:** add Telegram, Discord, and Slack providers ([be3faab](https://github.com/claudekit/claudekit-engineer/commit/be3faab00c7342e362d12fb7b5527b4ab7a6932c))
* **notifications:** add unified Node.js notification router ([8948b39](https://github.com/claudekit/claudekit-engineer/commit/8948b395683198446958c4e089937bb482b31e41))
* **output-styles:** comprehensive rewrite with MUST/NEVER rules ([4e2dbf5](https://github.com/claudekit/claudekit-engineer/commit/4e2dbf537ede36cbc29858f666e24ff45254178d))
* **plan-validation:** add /plan:validate command for interview-based plan validation ([26e58d6](https://github.com/claudekit/claudekit-engineer/commit/26e58d667436c6a7a3e6d7f26e4d1f4e233aa3ec))
* **planning:** add YAML frontmatter support for plan files ([a5c894c](https://github.com/claudekit/claudekit-engineer/commit/a5c894c1603f58ff7da2f05a8c9a2bd3e66b407c))
* **plans-kanban:** add kanban board view with enhanced dashboard ([fea08a2](https://github.com/claudekit/claudekit-engineer/commit/fea08a22db6b01e7aaadecef78a1493a77185079))
* **plans-kanban:** enhance kanban cards and add favicon ([873ef6a](https://github.com/claudekit/claudekit-engineer/commit/873ef6af9edf3ddeff2bb168752f8f1003dba281))
* **preview:** add dashboard UI and plan scanner ([05471af](https://github.com/claudekit/claudekit-engineer/commit/05471af55e0d45ea157e70a29923baac64741680))
* **preview:** add plan-scanner utility for dashboard ([5beb0d0](https://github.com/claudekit/claudekit-engineer/commit/5beb0d0da64109d062ca78b0fc44ac6cde406c3a))
* **preview:** add timeline, activity heatmap, and rich metadata ([52dd593](https://github.com/claudekit/claudekit-engineer/commit/52dd593807a9a8bfcfa71c07e215b23844def109))
* **preview:** redesign dashboard with refined monochrome theme ([0c8c6cb](https://github.com/claudekit/claudekit-engineer/commit/0c8c6cb534be590e28c56e1b45a087ed7ebb846c))
* **preview:** redesign timeline as Layered Gantt chart ([5e781d9](https://github.com/claudekit/claudekit-engineer/commit/5e781d946f1a7adaa509f63f3ad7ec56e87997ff))
* **preview:** run as CC background task with auto-open browser ([7d5dd1a](https://github.com/claudekit/claudekit-engineer/commit/7d5dd1a1cd005f9fc7c6c07d0a18f7915878efbe)), closes [#234](https://github.com/claudekit/claudekit-engineer/issues/234)
* **privacy-block:** improve robustness and testability of privacy hook ([c399b0c](https://github.com/claudekit/claudekit-engineer/commit/c399b0cf2188267a655f74fb4603e687d8a00186))
* **skills:** add navigation and theme persistence improvements ([0b9d8fb](https://github.com/claudekit/claudekit-engineer/commit/0b9d8fb793b916a8a4ebdc2a22edfc884d991836))
* **statusline:** add compact detection with PreCompact hook ([1fd4376](https://github.com/claudekit/claudekit-engineer/commit/1fd4376e8c5e9daddca75f73f61543f58ea569f4))
* **worktree:** add cross-platform worktree workflow command ([cfb6fc9](https://github.com/claudekit/claudekit-engineer/commit/cfb6fc98657eb8e3bcd22447c0bd24611c21c49e))
* **worktree:** improve workflow with remove command and dry-run ([fc2b2ca](https://github.com/claudekit/claudekit-engineer/commit/fc2b2cae23c0920d82b2bbb458b8006ac70f825a))


### 🐞 Bug Fixes

* `/code:auto` should finish all phases by default ([6c528a8](https://github.com/claudekit/claudekit-engineer/commit/6c528a802832836a36d104d813dc70d3b7c31d06))
* `chrome-devtools` skill should run in headed mode for better debugging ([52cecc6](https://github.com/claudekit/claudekit-engineer/commit/52cecc65c49116646ae1d1d6dd331f7f5d68d312))
* `frontend-design-pro` skill deprecated ([b8b6de3](https://github.com/claudekit/claudekit-engineer/commit/b8b6de325c9aa6e2dd5beb6f75251ca9e09fe544))
* add local/global venv resolution for skills Python path ([63d9918](https://github.com/claudekit/claudekit-engineer/commit/63d991822da65ecf4f3de3a92f7c73e8abd567c5))
* add venv Python instruction for skills scripts ([afc045c](https://github.com/claudekit/claudekit-engineer/commit/afc045c5150f688fe246e763b8e6f7614509e045)), closes [#212](https://github.com/claudekit/claudekit-engineer/issues/212)
* **ai-multimodal:** prevent LLM hallucination of non-existent scripts ([f58ffb8](https://github.com/claudekit/claudekit-engineer/commit/f58ffb8517018cce8c8261601fa67e8ce643b728)), closes [#226](https://github.com/claudekit/claudekit-engineer/issues/226)
* **ai-multimodal:** transcript output requirements ([e9b9a29](https://github.com/claudekit/claudekit-engineer/commit/e9b9a2945c4c971d1e971d759e4b3a8b5694d534))
* **ai-multimodal:** truncate when transcripting an audio with length is longer than 15 mins ([754774e](https://github.com/claudekit/claudekit-engineer/commit/754774ebe61064eb8f8c24a2f4e5b6dbf03b3f3f))
* **chrome-devtools:** auto-create output directory in screenshot.js ([a2a8d53](https://github.com/claudekit/claudekit-engineer/commit/a2a8d535218f82e93c45a38c3abdb7fecf970565)), closes [#206](https://github.com/claudekit/claudekit-engineer/issues/206)
* correct design commands after `aesthetic` skill deprecated ([fccf473](https://github.com/claudekit/claudekit-engineer/commit/fccf4738f121fb87438433fa4a2502027671a10d))
* **dashboard:** completed plans end at today, add top margin to timeline ([2043272](https://github.com/claudekit/claudekit-engineer/commit/20432722a6eff89532ef2c040bf481d9e1913002))
* **dashboard:** completed plans now stop at correct date + minimal timeline header ([cb87d7b](https://github.com/claudekit/claudekit-engineer/commit/cb87d7b6dbca675a01c3fdf3e19485cf36439af6))
* **dashboard:** handle YYYYMMDD date format in plan names ([7b16265](https://github.com/claudekit/claudekit-engineer/commit/7b162655cb212fd51614c20bc8bc24bbef187292))
* **dashboard:** improve gantt bar contrast and prevent overflow ([f7edc9e](https://github.com/claudekit/claudekit-engineer/commit/f7edc9e159bc089b92fb7ab2700fc829a28805d0))
* **dashboard:** remove decorative h2 lines from timeline title ([520da09](https://github.com/claudekit/claudekit-engineer/commit/520da097db4f524aa291709dc31c002f8e3d5347))
* **dashboard:** remove height cap, add scrollbar for many layers ([1c8c718](https://github.com/claudekit/claudekit-engineer/commit/1c8c718829a7ff7e698255b78b9330b9047cfb34))
* **dashboard:** resolve layered gantt staircase effect ([6fc8576](https://github.com/claudekit/claudekit-engineer/commit/6fc8576e2d7625d80f2d0e3ead1fbdfdf3c29251))
* **dashboard:** timeline bar now uses durationDays for consistency with card ([17eff55](https://github.com/claudekit/claudekit-engineer/commit/17eff559cbcf0a8be9f70ee0ce65958410ce7a6b))
* define now variable in assignLayers scope ([b04f01f](https://github.com/claudekit/claudekit-engineer/commit/b04f01fa3c602e63d05a7b21b86766437812ddf1))
* **git-manager:** add release number exclusion to fallback and pr.md ([ba28edf](https://github.com/claudekit/claudekit-engineer/commit/ba28edf549464442c52fdea8ffde233083773464))
* **git-manager:** exclude release numbers from PR titles ([5647218](https://github.com/claudekit/claudekit-engineer/commit/5647218126428044d90c41ac2856c848f3e9c792)), closes [#220](https://github.com/claudekit/claudekit-engineer/issues/220)
* **git:** use remote tracking branch in merge and add PR error handling ([4025a55](https://github.com/claudekit/claudekit-engineer/commit/4025a5593dcf5f999faa63e9556c47d8ce608c25))
* **hooks:** improve context-tracker robustness and documentation ([2755030](https://github.com/claudekit/claudekit-engineer/commit/2755030c062b21236c969218e979ee2cbff94f1d)), closes [#179](https://github.com/claudekit/claudekit-engineer/issues/179)
* **hooks:** normalize paths and handle edge cases in .ck.json config ([018d832](https://github.com/claudekit/claudekit-engineer/commit/018d832bd18a85f0ba2bc1c368e88cb6670810a7))
* **hooks:** resolve context tracker race condition and consolidate temp files ([7c507c8](https://github.com/claudekit/claudekit-engineer/commit/7c507c87e6b78826f45bc5f374a38ec604e5d125)), closes [#177](https://github.com/claudekit/claudekit-engineer/issues/177) [#178](https://github.com/claudekit/claudekit-engineer/issues/178)
* **hooks:** use correct snake_case field names in telegram notification hook ([e07f355](https://github.com/claudekit/claudekit-engineer/commit/e07f35533a13e48eb97a82bcd2234e8e4ab04f25))
* **hooks:** wire up validateNamingPattern and fix docs ([5063d69](https://github.com/claudekit/claudekit-engineer/commit/5063d698b71c03794ae6272102e642060644e9b9))
* implement 3-layer self-healing context reset detection ([503034e](https://github.com/claudekit/claudekit-engineer/commit/503034e78dc7f00187039a160153ec60f17a5692)), closes [#177](https://github.com/claudekit/claudekit-engineer/issues/177)
* inject agent naming patterns via hooks instead of env vars ([ecd3bb7](https://github.com/claudekit/claudekit-engineer/commit/ecd3bb73b803318201c198180a11122bacb5de12))
* inject pre-computed naming template to subagents ([e8511d3](https://github.com/claudekit/claudekit-engineer/commit/e8511d3627a22c9748f22e0a83e587cc575c08f2))
* inject venv Python path in dev-rules-reminder hook ([06773f6](https://github.com/claudekit/claudekit-engineer/commit/06773f66c88ae800df228c7faa588769a2c8739a))
* **install:** add viewer skills npm deps to install.ps1 ([d65153e](https://github.com/claudekit/claudekit-engineer/commit/d65153e2864761f796c7a9944a0f78a01b069797))
* **install:** strip inline comments from requirements.txt lines ([20a2980](https://github.com/claudekit/claudekit-engineer/commit/20a29807b76a0b683a39e401d08e849d1187cf40)), closes [#162](https://github.com/claudekit/claudekit-engineer/issues/162)
* make writing journal optional in `/plan:archive` command ([50eda56](https://github.com/claudekit/claudekit-engineer/commit/50eda5688027a9000ddbaa43085432be13f9cba5))
* **markdown-novel-viewer:** add missing template placeholder replacements ([2bee026](https://github.com/claudekit/claudekit-engineer/commit/2bee026165fae2d81f8558c068f83e3653d22626))
* **markdown-viewer:** resolve reference-style image paths in preview ([35cf870](https://github.com/claudekit/claudekit-engineer/commit/35cf870f0e51616c857adbe1471104856d5c33e2)), closes [#210](https://github.com/claudekit/claudekit-engineer/issues/210)
* **preview:** check claude directory for script execution ([71d1853](https://github.com/claudekit/claudekit-engineer/commit/71d18531dc1516d4596244301a7ab5e91ad0f44f))
* **preview:** hide inline sections from sidebar navigation ([4610369](https://github.com/claudekit/claudekit-engineer/commit/4610369459facfffb65e90ebfc702b192b244b36))
* **privacy-block:** add URL decoding, bash variable detection, path traversal warning ([6df91cb](https://github.com/claudekit/claudekit-engineer/commit/6df91cbe75e9469ece5acd312e933dbc4d2748d5))
* resolve UnicodeEncodeError on Windows for ui-ux-pro-max search ([7d86c15](https://github.com/claudekit/claudekit-engineer/commit/7d86c15d810084fb8c0a19f9278b63933d8b8acf)), closes [#187](https://github.com/claudekit/claudekit-engineer/issues/187)
* **scout-block:** block subfolder paths in monorepo structures ([#174](https://github.com/claudekit/claudekit-engineer/issues/174)) ([ff38a87](https://github.com/claudekit/claudekit-engineer/commit/ff38a878c2e8f56c27296892c37e6cebbe0211c9))
* **skills:** resolve kanban/preview separation issues ([e2c7832](https://github.com/claudekit/claudekit-engineer/commit/e2c783260f2eea2cc82a13fa2061df6cac804286))
* **skills:** trigger release for viewer skill install instructions ([220cfcc](https://github.com/claudekit/claudekit-engineer/commit/220cfcc2170910a946bcda5bea66d871d469ef46))
* **statusline:** calculate context percentage against compact threshold ([#172](https://github.com/claudekit/claudekit-engineer/issues/172)) ([ebf68a0](https://github.com/claudekit/claudekit-engineer/commit/ebf68a0a21bda4f116e53ab77b5a87028ce804a5))
* **statusline:** improve context window display with progress bar and emoji ([357d317](https://github.com/claudekit/claudekit-engineer/commit/357d31764454a44c539d8812e6061c77541c6a80)), closes [#159](https://github.com/claudekit/claudekit-engineer/issues/159)


### 📚 Documentation

* **chrome-devtools:** document inject-auth script and update gitignore rules ([83d3f0c](https://github.com/claudekit/claudekit-engineer/commit/83d3f0cc9649e6bb4fb208bb5808b51b85b62e9f))
* fix Quick Start CLI commands in README ([382e98d](https://github.com/claudekit/claudekit-engineer/commit/382e98d3196e2d787e385fae900cabf1d62f9898)), closes [#237](https://github.com/claudekit/claudekit-engineer/issues/237)
* **git-manager:** improve PR workflow with remote diff guidance ([23b99bb](https://github.com/claudekit/claudekit-engineer/commit/23b99bb577b9419e9cd3edbf91ccab6fbfb346f3))
* **notifications:** add provider setup guides and update hooks README ([7be8916](https://github.com/claudekit/claudekit-engineer/commit/7be891623fc59cb01393604324647e1198e650f4))
* **notifications:** update .env.example with all providers ([b8f22ea](https://github.com/claudekit/claudekit-engineer/commit/b8f22ea658ca4447560b5a0952cb37f1796a58c1))
* **readme:** update project structure and integration capabilities ([cd47529](https://github.com/claudekit/claudekit-engineer/commit/cd475295b9bc4e1a1b5dbc8a71f2798a92b32892))
* **skills:** add installation instructions for viewer skills ([a41b2eb](https://github.com/claudekit/claudekit-engineer/commit/a41b2eb86428d352c5268894ecea323421198711))
* update architecture and roadmap for preview dashboard ([626a1bd](https://github.com/claudekit/claudekit-engineer/commit/626a1bdecc913d5589489f2521a82891639036bb))


### ♻️ Code Refactoring

* centralize file naming pattern via CK_NAME_PATTERN env var ([ecd5525](https://github.com/claudekit/claudekit-engineer/commit/ecd5525e37347be048798314bdc92b42666650b2))
* **hooks:** address code review feedback ([052959a](https://github.com/claudekit/claudekit-engineer/commit/052959a058423175b768151b8017f60c182f1531))
* **notifications:** make hooks opt-in instead of default ([308f6d2](https://github.com/claudekit/claudekit-engineer/commit/308f6d26e21045f4abf75d0f1eadceb37f47f764))
* separate kanban and preview functionality with enhanced features ([96a1232](https://github.com/claudekit/claudekit-engineer/commit/96a1232e4bbba4d92fa777cf947866d727530545))
* **statusline:** simplify context display logic ([5caee57](https://github.com/claudekit/claudekit-engineer/commit/5caee57a41603bf9420e9006398c7fdb364db81c))


### ⚡ Performance Improvements

* `/code:auto` should ask for onboarding assist if needed ([809b19a](https://github.com/claudekit/claudekit-engineer/commit/809b19ae2e7be9fb0e65c82a6b4deeda6ac10887))
* ✨ new command -> `/test:ui` for running UI testing of an input URL ([f0736ff](https://github.com/claudekit/claudekit-engineer/commit/f0736ff94523c8a0c7e89acf678c17cd9012175e))
* add `/preview` command with `novel-markdown-viewer` skill ([ad51d59](https://github.com/claudekit/claudekit-engineer/commit/ad51d599b57b04a8343c7cdcfb6578ff70c1462b))
* add `/skill:plan` command ([b74b036](https://github.com/claudekit/claudekit-engineer/commit/b74b0365df2eae59b274542e64e87b2904431cec))
* add more stats to summary of `/plan:archive` ([7365f0c](https://github.com/claudekit/claudekit-engineer/commit/7365f0c2afe266cfcdd50677e3af4e615e8f0e10))
* add Windows Python paths for cross-platform support ([89a2a9a](https://github.com/claudekit/claudekit-engineer/commit/89a2a9a2c8efe6c2752376a7166ddc3ba866569c))
* fix slow Python version detection in session-init hook ([efd9205](https://github.com/claudekit/claudekit-engineer/commit/efd92055eda2cebb313557a2f64afd5e5fb60dfa))
* **statusline:** add context window usage percentage display ([20f8ed7](https://github.com/claudekit/claudekit-engineer/commit/20f8ed798572933586ad2a40a975fc37faf98d2a)), closes [#159](https://github.com/claudekit/claudekit-engineer/issues/159)


### ✅ Tests

* **hooks:** add unit tests for ck-config edge case handling ([673b400](https://github.com/claudekit/claudekit-engineer/commit/673b4002b115e09a8e91823561389c037839f048))
* **preview:** add comprehensive dashboard test suite ([631b0af](https://github.com/claudekit/claudekit-engineer/commit/631b0af4ad3bdaff6a89ba63657c1b34f943d061))
* **worktree:** add comprehensive test suite ([ed712e9](https://github.com/claudekit/claudekit-engineer/commit/ed712e9b2891add724c11231a093637560bd275d))


### 👷 CI

* add branch protection workflow for main branch ([6fb7083](https://github.com/claudekit/claudekit-engineer/commit/6fb70836639e86193020833e22c798676585c8cf))

## [1.21.0-beta.38](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.37...v1.21.0-beta.38) (2025-12-22)


### 🚀 Features

* **hooks:** configure notification hooks for Stop, SubagentStop, Notification ([9b8ebf8](https://github.com/claudekit/claudekit-engineer/commit/9b8ebf85678b52642123b320039f527caa3e56f0))
* **notifications:** add Telegram, Discord, and Slack providers ([be3faab](https://github.com/claudekit/claudekit-engineer/commit/be3faab00c7342e362d12fb7b5527b4ab7a6932c))
* **notifications:** add unified Node.js notification router ([8948b39](https://github.com/claudekit/claudekit-engineer/commit/8948b395683198446958c4e089937bb482b31e41))


### 📚 Documentation

* **notifications:** add provider setup guides and update hooks README ([7be8916](https://github.com/claudekit/claudekit-engineer/commit/7be891623fc59cb01393604324647e1198e650f4))
* **notifications:** update .env.example with all providers ([b8f22ea](https://github.com/claudekit/claudekit-engineer/commit/b8f22ea658ca4447560b5a0952cb37f1796a58c1))
* **readme:** update project structure and integration capabilities ([cd47529](https://github.com/claudekit/claudekit-engineer/commit/cd475295b9bc4e1a1b5dbc8a71f2798a92b32892))


### ♻️ Code Refactoring

* **notifications:** make hooks opt-in instead of default ([308f6d2](https://github.com/claudekit/claudekit-engineer/commit/308f6d26e21045f4abf75d0f1eadceb37f47f764))

## [1.21.0-beta.37](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.36...v1.21.0-beta.37) (2025-12-22)


### 🚀 Features

* **preview:** run as CC background task with auto-open browser ([7d5dd1a](https://github.com/claudekit/claudekit-engineer/commit/7d5dd1a1cd005f9fc7c6c07d0a18f7915878efbe)), closes [#234](https://github.com/claudekit/claudekit-engineer/issues/234)

## [1.21.0-beta.36](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.35...v1.21.0-beta.36) (2025-12-21)


### 🚀 Features

* **worktree:** add cross-platform worktree workflow command ([cfb6fc9](https://github.com/claudekit/claudekit-engineer/commit/cfb6fc98657eb8e3bcd22447c0bd24611c21c49e))
* **worktree:** improve workflow with remove command and dry-run ([fc2b2ca](https://github.com/claudekit/claudekit-engineer/commit/fc2b2cae23c0920d82b2bbb458b8006ac70f825a))


### ✅ Tests

* **worktree:** add comprehensive test suite ([ed712e9](https://github.com/claudekit/claudekit-engineer/commit/ed712e9b2891add724c11231a093637560bd275d))

## [1.21.0-beta.35](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.34...v1.21.0-beta.35) (2025-12-19)


### 🚀 Features

* **ck-help:** add codingLevel documentation and brainstorm integration ([5de45fb](https://github.com/claudekit/claudekit-engineer/commit/5de45fbd07af139749246d8ea14705c51524a8a9))
* **coding-level:** add -1 as disabled default for token efficiency ([d16c889](https://github.com/claudekit/claudekit-engineer/commit/d16c889f886d48d4277d1127ff0a72f1f40d21a3))
* **hooks:** add codingLevel config for adaptive communication ([35a030f](https://github.com/claudekit/claudekit-engineer/commit/35a030fd7dd515979ffa1f077f7265e738c0f593)), closes [#158](https://github.com/claudekit/claudekit-engineer/issues/158)
* **output-styles:** comprehensive rewrite with MUST/NEVER rules ([4e2dbf5](https://github.com/claudekit/claudekit-engineer/commit/4e2dbf537ede36cbc29858f666e24ff45254178d))

## [1.21.0-beta.34](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.33...v1.21.0-beta.34) (2025-12-18)


### 🚀 Features

* add clarifying notes to hook block messages ([2865124](https://github.com/claudekit/claudekit-engineer/commit/2865124866022aaf8906f5d8e726dfc5e4e9057f)), closes [#228](https://github.com/claudekit/claudekit-engineer/issues/228)

## [1.21.0-beta.33](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.32...v1.21.0-beta.33) (2025-12-18)


### 🐞 Bug Fixes

* **ai-multimodal:** prevent LLM hallucination of non-existent scripts ([f58ffb8](https://github.com/claudekit/claudekit-engineer/commit/f58ffb8517018cce8c8261601fa67e8ce643b728)), closes [#226](https://github.com/claudekit/claudekit-engineer/issues/226)

## [1.21.0-beta.32](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.31...v1.21.0-beta.32) (2025-12-18)


### 🚀 Features

* **chrome-devtools:** add auth session persistence for inject-auth script ([252e1c5](https://github.com/claudekit/claudekit-engineer/commit/252e1c5a15e5221fb02f97729e508d30b76c0b81))


### 📚 Documentation

* **chrome-devtools:** document inject-auth script and update gitignore rules ([83d3f0c](https://github.com/claudekit/claudekit-engineer/commit/83d3f0cc9649e6bb4fb208bb5808b51b85b62e9f))

## [1.21.0-beta.31](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.30...v1.21.0-beta.31) (2025-12-18)


### 🐞 Bug Fixes

* **git-manager:** add release number exclusion to fallback and pr.md ([ba28edf](https://github.com/claudekit/claudekit-engineer/commit/ba28edf549464442c52fdea8ffde233083773464))
* **git-manager:** exclude release numbers from PR titles ([5647218](https://github.com/claudekit/claudekit-engineer/commit/5647218126428044d90c41ac2856c848f3e9c792)), closes [#220](https://github.com/claudekit/claudekit-engineer/issues/220)

## [1.21.0-beta.30](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.29...v1.21.0-beta.30) (2025-12-18)


### 🐞 Bug Fixes

* **hooks:** use correct snake_case field names in telegram notification hook ([e07f355](https://github.com/claudekit/claudekit-engineer/commit/e07f35533a13e48eb97a82bcd2234e8e4ab04f25))

## [1.21.0-beta.29](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.28...v1.21.0-beta.29) (2025-12-18)


### 🐞 Bug Fixes

* add local/global venv resolution for skills Python path ([63d9918](https://github.com/claudekit/claudekit-engineer/commit/63d991822da65ecf4f3de3a92f7c73e8abd567c5))
* add venv Python instruction for skills scripts ([afc045c](https://github.com/claudekit/claudekit-engineer/commit/afc045c5150f688fe246e763b8e6f7614509e045)), closes [#212](https://github.com/claudekit/claudekit-engineer/issues/212)
* inject venv Python path in dev-rules-reminder hook ([06773f6](https://github.com/claudekit/claudekit-engineer/commit/06773f66c88ae800df228c7faa588769a2c8739a))

## [1.21.0-beta.28](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.27...v1.21.0-beta.28) (2025-12-17)


### 🐞 Bug Fixes

* **markdown-viewer:** resolve reference-style image paths in preview ([35cf870](https://github.com/claudekit/claudekit-engineer/commit/35cf870f0e51616c857adbe1471104856d5c33e2)), closes [#210](https://github.com/claudekit/claudekit-engineer/issues/210)

## [1.21.0-beta.27](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.26...v1.21.0-beta.27) (2025-12-17)


### 🐞 Bug Fixes

* **markdown-novel-viewer:** add missing template placeholder replacements ([2bee026](https://github.com/claudekit/claudekit-engineer/commit/2bee026165fae2d81f8558c068f83e3653d22626))

## [1.21.0-beta.26](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.25...v1.21.0-beta.26) (2025-12-17)


### 🐞 Bug Fixes

* **chrome-devtools:** auto-create output directory in screenshot.js ([a2a8d53](https://github.com/claudekit/claudekit-engineer/commit/a2a8d535218f82e93c45a38c3abdb7fecf970565)), closes [#206](https://github.com/claudekit/claudekit-engineer/issues/206)

## [1.21.0-beta.25](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.24...v1.21.0-beta.25) (2025-12-17)


### 🐞 Bug Fixes

* `/code:auto` should finish all phases by default ([6c528a8](https://github.com/claudekit/claudekit-engineer/commit/6c528a802832836a36d104d813dc70d3b7c31d06))


### ⚡ Performance Improvements

* `/code:auto` should ask for onboarding assist if needed ([809b19a](https://github.com/claudekit/claudekit-engineer/commit/809b19ae2e7be9fb0e65c82a6b4deeda6ac10887))

## [1.21.0-beta.24](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.23...v1.21.0-beta.24) (2025-12-17)


### 🐞 Bug Fixes

* **hooks:** normalize paths and handle edge cases in .ck.json config ([018d832](https://github.com/claudekit/claudekit-engineer/commit/018d832bd18a85f0ba2bc1c368e88cb6670810a7))
* **hooks:** wire up validateNamingPattern and fix docs ([5063d69](https://github.com/claudekit/claudekit-engineer/commit/5063d698b71c03794ae6272102e642060644e9b9))


### ✅ Tests

* **hooks:** add unit tests for ck-config edge case handling ([673b400](https://github.com/claudekit/claudekit-engineer/commit/673b4002b115e09a8e91823561389c037839f048))

## [1.21.0-beta.23](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.22...v1.21.0-beta.23) (2025-12-17)


### 🐞 Bug Fixes

* make writing journal optional in `/plan:archive` command ([50eda56](https://github.com/claudekit/claudekit-engineer/commit/50eda5688027a9000ddbaa43085432be13f9cba5))


### ⚡ Performance Improvements

* add more stats to summary of `/plan:archive` ([7365f0c](https://github.com/claudekit/claudekit-engineer/commit/7365f0c2afe266cfcdd50677e3af4e615e8f0e10))

## [1.21.0-beta.22](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.21...v1.21.0-beta.22) (2025-12-17)


### 🚀 Features

* ✨ new command `/plan:archive` to write journals & archive plans ([9fe973c](https://github.com/claudekit/claudekit-engineer/commit/9fe973cd7c0412df7124a057f1c1949f4658db54))

## [1.21.0-beta.21](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.20...v1.21.0-beta.21) (2025-12-17)


### 🚀 Features

* **hooks:** exempt example/sample/template files from privacy-block ([faf6f5f](https://github.com/claudekit/claudekit-engineer/commit/faf6f5f96de8ca3f18ea785a4bf7af3b83cb06e3)), closes [#200](https://github.com/claudekit/claudekit-engineer/issues/200)
* **privacy-block:** improve robustness and testability of privacy hook ([c399b0c](https://github.com/claudekit/claudekit-engineer/commit/c399b0cf2188267a655f74fb4603e687d8a00186))

## [1.21.0-beta.20](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.19...v1.21.0-beta.20) (2025-12-17)


### 🚀 Features

* **plan-validation:** add /plan:validate command for interview-based plan validation ([26e58d6](https://github.com/claudekit/claudekit-engineer/commit/26e58d667436c6a7a3e6d7f26e4d1f4e233aa3ec))

## [1.21.0-beta.19](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.18...v1.21.0-beta.19) (2025-12-16)


### 🐞 Bug Fixes

* **install:** add viewer skills npm deps to install.ps1 ([d65153e](https://github.com/claudekit/claudekit-engineer/commit/d65153e2864761f796c7a9944a0f78a01b069797))

## [1.21.0-beta.18](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.17...v1.21.0-beta.18) (2025-12-16)


### 🐞 Bug Fixes

* **skills:** trigger release for viewer skill install instructions ([220cfcc](https://github.com/claudekit/claudekit-engineer/commit/220cfcc2170910a946bcda5bea66d871d469ef46))


### 📚 Documentation

* **skills:** add installation instructions for viewer skills ([a41b2eb](https://github.com/claudekit/claudekit-engineer/commit/a41b2eb86428d352c5268894ecea323421198711))

## [1.21.0-beta.17](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.16...v1.21.0-beta.17) (2025-12-16)


### 🚀 Features

* **markdown-novel-viewer:** add sidebar anchor navigation and inline section styling ([231fc52](https://github.com/claudekit/claudekit-engineer/commit/231fc52c493ddef27b4786b546d0020ffe2e6726))
* **planning:** add YAML frontmatter support for plan files ([a5c894c](https://github.com/claudekit/claudekit-engineer/commit/a5c894c1603f58ff7da2f05a8c9a2bd3e66b407c))
* **plans-kanban:** add kanban board view with enhanced dashboard ([fea08a2](https://github.com/claudekit/claudekit-engineer/commit/fea08a22db6b01e7aaadecef78a1493a77185079))
* **plans-kanban:** enhance kanban cards and add favicon ([873ef6a](https://github.com/claudekit/claudekit-engineer/commit/873ef6af9edf3ddeff2bb168752f8f1003dba281))
* **skills:** add navigation and theme persistence improvements ([0b9d8fb](https://github.com/claudekit/claudekit-engineer/commit/0b9d8fb793b916a8a4ebdc2a22edfc884d991836))


### 🐞 Bug Fixes

* **preview:** hide inline sections from sidebar navigation ([4610369](https://github.com/claudekit/claudekit-engineer/commit/4610369459facfffb65e90ebfc702b192b244b36))
* **skills:** resolve kanban/preview separation issues ([e2c7832](https://github.com/claudekit/claudekit-engineer/commit/e2c783260f2eea2cc82a13fa2061df6cac804286))


### ♻️ Code Refactoring

* separate kanban and preview functionality with enhanced features ([96a1232](https://github.com/claudekit/claudekit-engineer/commit/96a1232e4bbba4d92fa777cf947866d727530545))

## [1.21.0-beta.16](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.15...v1.21.0-beta.16) (2025-12-16)


### 🐞 Bug Fixes

* `frontend-design-pro` skill deprecated ([b8b6de3](https://github.com/claudekit/claudekit-engineer/commit/b8b6de325c9aa6e2dd5beb6f75251ca9e09fe544))
* correct design commands after `aesthetic` skill deprecated ([fccf473](https://github.com/claudekit/claudekit-engineer/commit/fccf4738f121fb87438433fa4a2502027671a10d))
* **preview:** check claude directory for script execution ([71d1853](https://github.com/claudekit/claudekit-engineer/commit/71d18531dc1516d4596244301a7ab5e91ad0f44f))


### ⚡ Performance Improvements

* ✨ new command -> `/test:ui` for running UI testing of an input URL ([f0736ff](https://github.com/claudekit/claudekit-engineer/commit/f0736ff94523c8a0c7e89acf678c17cd9012175e))

## [1.21.0-beta.15](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.14...v1.21.0-beta.15) (2025-12-16)


### ⚡ Performance Improvements

* add Windows Python paths for cross-platform support ([89a2a9a](https://github.com/claudekit/claudekit-engineer/commit/89a2a9a2c8efe6c2752376a7166ddc3ba866569c))
* fix slow Python version detection in session-init hook ([efd9205](https://github.com/claudekit/claudekit-engineer/commit/efd92055eda2cebb313557a2f64afd5e5fb60dfa))

## [1.21.0-beta.14](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.13...v1.21.0-beta.14) (2025-12-16)


### 🐞 Bug Fixes

* **git:** use remote tracking branch in merge and add PR error handling ([4025a55](https://github.com/claudekit/claudekit-engineer/commit/4025a5593dcf5f999faa63e9556c47d8ce608c25))


### 📚 Documentation

* **git-manager:** improve PR workflow with remote diff guidance ([23b99bb](https://github.com/claudekit/claudekit-engineer/commit/23b99bb577b9419e9cd3edbf91ccab6fbfb346f3))

## [1.21.0-beta.13](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.12...v1.21.0-beta.13) (2025-12-15)


### 🚀 Features

* add centralized Windows UTF-8 compatibility utility ([a19e157](https://github.com/claudekit/claudekit-engineer/commit/a19e157bf4b1d7e2ed599d0f32acf72145e5a05a)), closes [#187](https://github.com/claudekit/claudekit-engineer/issues/187)


### 🐞 Bug Fixes

* resolve UnicodeEncodeError on Windows for ui-ux-pro-max search ([7d86c15](https://github.com/claudekit/claudekit-engineer/commit/7d86c15d810084fb8c0a19f9278b63933d8b8acf)), closes [#187](https://github.com/claudekit/claudekit-engineer/issues/187)

## [1.21.0-beta.12](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.11...v1.21.0-beta.12) (2025-12-15)


### 🐞 Bug Fixes

* **ai-multimodal:** transcript output requirements ([e9b9a29](https://github.com/claudekit/claudekit-engineer/commit/e9b9a2945c4c971d1e971d759e4b3a8b5694d534))
* **ai-multimodal:** truncate when transcripting an audio with length is longer than 15 mins ([754774e](https://github.com/claudekit/claudekit-engineer/commit/754774ebe61064eb8f8c24a2f4e5b6dbf03b3f3f))

## [1.21.0-beta.11](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.10...v1.21.0-beta.11) (2025-12-15)


### 🚀 Features

* **hooks:** add broad pattern detection and privacy-block hook ([17ef8b4](https://github.com/claudekit/claudekit-engineer/commit/17ef8b4f6574efab08e6ff374d5f53d5d7bfd666)), closes [#184](https://github.com/claudekit/claudekit-engineer/issues/184)


### 🐞 Bug Fixes

* **privacy-block:** add URL decoding, bash variable detection, path traversal warning ([6df91cb](https://github.com/claudekit/claudekit-engineer/commit/6df91cbe75e9469ece5acd312e933dbc4d2748d5))

## [1.21.0-beta.10](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.9...v1.21.0-beta.10) (2025-12-15)


### 🐞 Bug Fixes

* **hooks:** resolve context tracker race condition and consolidate temp files ([7c507c8](https://github.com/claudekit/claudekit-engineer/commit/7c507c87e6b78826f45bc5f374a38ec604e5d125)), closes [#177](https://github.com/claudekit/claudekit-engineer/issues/177) [#178](https://github.com/claudekit/claudekit-engineer/issues/178)


### ♻️ Code Refactoring

* **hooks:** address code review feedback ([052959a](https://github.com/claudekit/claudekit-engineer/commit/052959a058423175b768151b8017f60c182f1531))

## [1.21.0-beta.9](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.8...v1.21.0-beta.9) (2025-12-15)


### 🚀 Features

* **locale:** add thinkingLanguage for dual-language support ([90b3eb8](https://github.com/claudekit/claudekit-engineer/commit/90b3eb8f6139f3bd70d646e294005f30ae11a42d)), closes [#180](https://github.com/claudekit/claudekit-engineer/issues/180)

## [1.21.0-beta.8](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.7...v1.21.0-beta.8) (2025-12-15)


### 🐞 Bug Fixes

* **hooks:** improve context-tracker robustness and documentation ([2755030](https://github.com/claudekit/claudekit-engineer/commit/2755030c062b21236c969218e979ee2cbff94f1d)), closes [#179](https://github.com/claudekit/claudekit-engineer/issues/179)
* implement 3-layer self-healing context reset detection ([503034e](https://github.com/claudekit/claudekit-engineer/commit/503034e78dc7f00187039a160153ec60f17a5692)), closes [#177](https://github.com/claudekit/claudekit-engineer/issues/177)

## [1.21.0-beta.7](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.6...v1.21.0-beta.7) (2025-12-14)


### 🐞 Bug Fixes

* **scout-block:** block subfolder paths in monorepo structures ([#174](https://github.com/claudekit/claudekit-engineer/issues/174)) ([ff38a87](https://github.com/claudekit/claudekit-engineer/commit/ff38a878c2e8f56c27296892c37e6cebbe0211c9))

## [1.21.0-beta.6](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.5...v1.21.0-beta.6) (2025-12-14)


### 🐞 Bug Fixes

* **statusline:** calculate context percentage against compact threshold ([#172](https://github.com/claudekit/claudekit-engineer/issues/172)) ([ebf68a0](https://github.com/claudekit/claudekit-engineer/commit/ebf68a0a21bda4f116e53ab77b5a87028ce804a5))

## [1.21.0-beta.5](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.4...v1.21.0-beta.5) (2025-12-14)


### 🐞 Bug Fixes

* inject agent naming patterns via hooks instead of env vars ([ecd3bb7](https://github.com/claudekit/claudekit-engineer/commit/ecd3bb73b803318201c198180a11122bacb5de12))
* inject pre-computed naming template to subagents ([e8511d3](https://github.com/claudekit/claudekit-engineer/commit/e8511d3627a22c9748f22e0a83e587cc575c08f2))


### ♻️ Code Refactoring

* centralize file naming pattern via CK_NAME_PATTERN env var ([ecd5525](https://github.com/claudekit/claudekit-engineer/commit/ecd5525e37347be048798314bdc92b42666650b2))

## [1.21.0-beta.4](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.3...v1.21.0-beta.4) (2025-12-13)

## [1.21.0-beta.3](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.2...v1.21.0-beta.3) (2025-12-12)


### ♻️ Code Refactoring

* centralize file naming pattern via CK_NAME_PATTERN env var ([e379abe](https://github.com/claudekit/claudekit-engineer/commit/e379abe7d762770379d5318bb104a70824a5335e))

## [1.21.0-beta.2](https://github.com/claudekit/claudekit-engineer/compare/v1.21.0-beta.1...v1.21.0-beta.2) (2025-12-12)


### 🚀 Features

* **nav:** add back-to-dashboard link in plan detail header ([3aeac74](https://github.com/claudekit/claudekit-engineer/commit/3aeac743aa54c07a752e71858148b4d5cda36116))
* **nav:** show planned vs implemented phases in sidebar ([f0362ec](https://github.com/claudekit/claudekit-engineer/commit/f0362ec4305cdee5ae0991c1affa508b5bf72bb2))
* **preview:** add dashboard UI and plan scanner ([05471af](https://github.com/claudekit/claudekit-engineer/commit/05471af55e0d45ea157e70a29923baac64741680))
* **preview:** add plan-scanner utility for dashboard ([5beb0d0](https://github.com/claudekit/claudekit-engineer/commit/5beb0d0da64109d062ca78b0fc44ac6cde406c3a))
* **preview:** add timeline, activity heatmap, and rich metadata ([52dd593](https://github.com/claudekit/claudekit-engineer/commit/52dd593807a9a8bfcfa71c07e215b23844def109))
* **preview:** redesign dashboard with refined monochrome theme ([0c8c6cb](https://github.com/claudekit/claudekit-engineer/commit/0c8c6cb534be590e28c56e1b45a087ed7ebb846c))
* **preview:** redesign timeline as Layered Gantt chart ([5e781d9](https://github.com/claudekit/claudekit-engineer/commit/5e781d946f1a7adaa509f63f3ad7ec56e87997ff))


### 🐞 Bug Fixes

* **dashboard:** completed plans end at today, add top margin to timeline ([2043272](https://github.com/claudekit/claudekit-engineer/commit/20432722a6eff89532ef2c040bf481d9e1913002))
* **dashboard:** completed plans now stop at correct date + minimal timeline header ([cb87d7b](https://github.com/claudekit/claudekit-engineer/commit/cb87d7b6dbca675a01c3fdf3e19485cf36439af6))
* **dashboard:** handle YYYYMMDD date format in plan names ([7b16265](https://github.com/claudekit/claudekit-engineer/commit/7b162655cb212fd51614c20bc8bc24bbef187292))
* **dashboard:** improve gantt bar contrast and prevent overflow ([f7edc9e](https://github.com/claudekit/claudekit-engineer/commit/f7edc9e159bc089b92fb7ab2700fc829a28805d0))
* **dashboard:** remove decorative h2 lines from timeline title ([520da09](https://github.com/claudekit/claudekit-engineer/commit/520da097db4f524aa291709dc31c002f8e3d5347))
* **dashboard:** remove height cap, add scrollbar for many layers ([1c8c718](https://github.com/claudekit/claudekit-engineer/commit/1c8c718829a7ff7e698255b78b9330b9047cfb34))
* **dashboard:** resolve layered gantt staircase effect ([6fc8576](https://github.com/claudekit/claudekit-engineer/commit/6fc8576e2d7625d80f2d0e3ead1fbdfdf3c29251))
* **dashboard:** timeline bar now uses durationDays for consistency with card ([17eff55](https://github.com/claudekit/claudekit-engineer/commit/17eff559cbcf0a8be9f70ee0ce65958410ce7a6b))
* define now variable in assignLayers scope ([b04f01f](https://github.com/claudekit/claudekit-engineer/commit/b04f01fa3c602e63d05a7b21b86766437812ddf1))


### 📚 Documentation

* update architecture and roadmap for preview dashboard ([626a1bd](https://github.com/claudekit/claudekit-engineer/commit/626a1bdecc913d5589489f2521a82891639036bb))


### ✅ Tests

* **preview:** add comprehensive dashboard test suite ([631b0af](https://github.com/claudekit/claudekit-engineer/commit/631b0af4ad3bdaff6a89ba63657c1b34f943d061))

## [1.21.0-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.20.2-beta.4...v1.21.0-beta.1) (2025-12-12)


### 🚀 Features

* **statusline:** add compact detection with PreCompact hook ([1fd4376](https://github.com/claudekit/claudekit-engineer/commit/1fd4376e8c5e9daddca75f73f61543f58ea569f4))


### 🐞 Bug Fixes

* **statusline:** improve context window display with progress bar and emoji ([357d317](https://github.com/claudekit/claudekit-engineer/commit/357d31764454a44c539d8812e6061c77541c6a80)), closes [#159](https://github.com/claudekit/claudekit-engineer/issues/159)


### ♻️ Code Refactoring

* **statusline:** simplify context display logic ([5caee57](https://github.com/claudekit/claudekit-engineer/commit/5caee57a41603bf9420e9006398c7fdb364db81c))

## [1.20.2-beta.4](https://github.com/claudekit/claudekit-engineer/compare/v1.20.2-beta.3...v1.20.2-beta.4) (2025-12-11)


### ⚡ Performance Improvements

* **statusline:** add context window usage percentage display ([20f8ed7](https://github.com/claudekit/claudekit-engineer/commit/20f8ed798572933586ad2a40a975fc37faf98d2a)), closes [#159](https://github.com/claudekit/claudekit-engineer/issues/159)

## [1.20.2-beta.3](https://github.com/claudekit/claudekit-engineer/compare/v1.20.2-beta.2...v1.20.2-beta.3) (2025-12-11)


### 🐞 Bug Fixes

* **install:** strip inline comments from requirements.txt lines ([20a2980](https://github.com/claudekit/claudekit-engineer/commit/20a29807b76a0b683a39e401d08e849d1187cf40)), closes [#162](https://github.com/claudekit/claudekit-engineer/issues/162)

## [1.20.2-beta.2](https://github.com/claudekit/claudekit-engineer/compare/v1.20.2-beta.1...v1.20.2-beta.2) (2025-12-11)


### ⚡ Performance Improvements

* add `/preview` command with `novel-markdown-viewer` skill ([ad51d59](https://github.com/claudekit/claudekit-engineer/commit/ad51d599b57b04a8343c7cdcfb6578ff70c1462b))
* add `/skill:plan` command ([b74b036](https://github.com/claudekit/claudekit-engineer/commit/b74b0365df2eae59b274542e64e87b2904431cec))

## [1.20.2-beta.1](https://github.com/claudekit/claudekit-engineer/compare/v1.20.1...v1.20.2-beta.1) (2025-12-11)


### 🐞 Bug Fixes

* `chrome-devtools` skill should run in headed mode for better debugging ([52cecc6](https://github.com/claudekit/claudekit-engineer/commit/52cecc65c49116646ae1d1d6dd331f7f5d68d312))


### 👷 CI

* add branch protection workflow for main branch ([6fb7083](https://github.com/claudekit/claudekit-engineer/commit/6fb70836639e86193020833e22c798676585c8cf))

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
