# Changelog

## [1.8.0](https://github.com/lightdoodleh/OpenPrototype/compare/v1.7.0...v1.8.0) (2026-08-06)


### Features

* add concurrent Agent conversations ([dc05d61](https://github.com/lightdoodleh/OpenPrototype/commit/dc05d61a24638b8cc28619f73c0145025ca93ac5))

## [1.7.1](https://github.com/lightdoodleh/OpenPrototype/compare/v1.7.0...v1.7.1) (2026-08-06)


### Features

* Agent 工具调用默认合并折叠，保留运行与失败状态
* Agent 支持多线程对话、后台执行、会话切换与完成提醒

## [1.7.0](https://github.com/lightdoodleh/OpenPrototype/compare/v1.6.0...v1.7.0) (2026-08-04)


### Features

* 迁移旧产品壳的局域网地址复制功能到运行时 API ([88ceb39](https://github.com/lightdoodleh/OpenPrototype/commit/88ceb39bdca3bf4c78fe21ea0735bdd2d54f97cb))
* 迁移旧产品壳的局域网地址复制功能到运行时 API ([8b46a70](https://github.com/lightdoodleh/OpenPrototype/commit/8b46a70297457a5aa069088de377a9e79525ce09))

## [1.6.0](https://github.com/lightdoodleh/OpenPrototype/compare/v1.5.0...v1.6.0) (2026-07-30)


### Features

* support per-surface LAN addresses ([3156bc1](https://github.com/lightdoodleh/OpenPrototype/commit/3156bc1b4237761c02750ca0ca59134ac618b18e))
* support per-surface LAN addresses ([#23](https://github.com/lightdoodleh/OpenPrototype/issues/23)) ([ae9af02](https://github.com/lightdoodleh/OpenPrototype/commit/ae9af020c90864ab509951c9841584e736ad287e))

## [1.5.0](https://github.com/lightdoodleh/OpenPrototype/compare/v1.4.0...v1.5.0) (2026-07-30)


### Features

* add version command to CLI and update package version to 1.4.0 ([c5a8b23](https://github.com/lightdoodleh/OpenPrototype/commit/c5a8b23768330e34185a1a30cef3ec88edbb5f22))


### Bug Fixes

* version ([6a35171](https://github.com/lightdoodleh/OpenPrototype/commit/6a351718cdb448baaa5e47095743f2bae936cb8f))

## [1.4.0](https://github.com/lightdoodleh/OpenPrototype/compare/v1.3.0...v1.4.0) (2026-07-30)


### Features

* 添加局域网地址支持和相关功能 ([a0fcfb3](https://github.com/lightdoodleh/OpenPrototype/commit/a0fcfb374f3f14f7b975186286393aa066f4c36a))

## [1.3.0](https://github.com/lightdoodleh/OpenPrototype/compare/v1.2.0...v1.3.0) (2026-07-27)


### Features

* complete project discovery entrypoints ([ab58b14](https://github.com/lightdoodleh/OpenPrototype/commit/ab58b1426d91a0d720173e107166268a05463718))


### Bug Fixes

* mirror PRD and Agent demo surfaces ([e3a735c](https://github.com/lightdoodleh/OpenPrototype/commit/e3a735c19e69b8314d674763ace941185df71b5c))

## [1.2.0](https://github.com/lightdoodleh/OpenPrototype/compare/v1.1.0...v1.2.0) (2026-07-27)


### Features

* 更新文档和 CLI 注释，明确项目初始化和常驻服务安装说明 ([2bcc02c](https://github.com/lightdoodleh/OpenPrototype/commit/2bcc02c35738b434eba68fc32dc56a31437b9b34))
* 添加新手引导功能，首次打开工作台时提供分步气泡提示 ([8a3fbd0](https://github.com/lightdoodleh/OpenPrototype/commit/8a3fbd0a10318c35fef6661608fe1429516b67aa))


### Bug Fixes

* automate npm publish recovery ([7e4760c](https://github.com/lightdoodleh/OpenPrototype/commit/7e4760c0813d919b02d1c15cf0ca2b7d4c70be92))
* correct CLI command descriptions ([e309467](https://github.com/lightdoodleh/OpenPrototype/commit/e30946799ac44e8b7789b9bb14317b7fa045579f))

## [1.1.0](https://github.com/lightdoodleh/OpenPrototype/compare/v1.0.2...v1.1.0) (2026-07-24)


### Features

* 添加导航栏拖动进入文件夹内的功能 ([e429ed6](https://github.com/lightdoodleh/OpenPrototype/commit/e429ed6c844a79c56e1a5888813d6ccc48cd9044))

## [1.0.2](https://github.com/lightdoodleh/OpenPrototype/compare/v1.0.1...v1.0.2) (2026-07-23)


### Features

* add local service installation, lifecycle management, and automatic post-install setup ([#11](https://github.com/lightdoodleh/OpenPrototype/pull/11))
* support navigation tree drag-and-drop reordering ([#11](https://github.com/lightdoodleh/OpenPrototype/pull/11))


### Bug Fixes

* run npm reliably in Windows service smoke tests ([e267e41](https://github.com/lightdoodleh/OpenPrototype/commit/e267e4184e5d21a327e3e035991492864378c8d2))
* supervise and restart the Windows service process ([7e757c1](https://github.com/lightdoodleh/OpenPrototype/commit/7e757c12b3ffd2e524c437e4134ecf53119620c0))


### Documentation

* refresh README screenshots and presentation ([#10](https://github.com/lightdoodleh/OpenPrototype/pull/10))

## [1.0.1](https://github.com/lightdoodleh/OpenPrototype/compare/v1.0.0...v1.0.1) (2026-07-17)


### Bug Fixes

* publish npm from release tag ([#7](https://github.com/lightdoodleh/OpenPrototype/issues/7)) ([c894b1f](https://github.com/lightdoodleh/OpenPrototype/commit/c894b1f038b054e8ebdbfe5cd6629ca1fcbd583c))

## 1.0.0 (2026-07-17)


### Features

* add new PRD panel styles and scripts for enhanced functionality ([ebf7b58](https://github.com/lightdoodleh/OpenPrototype/commit/ebf7b58e7e01228c07019c3f0cc8df505222938b))
* initial prototype-agent-kit — 三栏原型工作台脚手架 ([cb69bdf](https://github.com/lightdoodleh/OpenPrototype/commit/cb69bdfb89a2232af9804e6a84ee98f5d5268817))
* 产品 shared 引擎回退解析 + Playwright 冒烟 CI + 冒烟测试防呆 ([65da620](https://github.com/lightdoodleh/OpenPrototype/commit/65da6203fc59b5dea6000d1ecd98be79700f9318))
* 新增 prototype-agent 别名包（转发 CLI，让 npx prototype-agent 从零可用） ([c0206bb](https://github.com/lightdoodleh/OpenPrototype/commit/c0206bb46bd2d002ae1be568e85cb56b4379852a))


### Bug Fixes

* **check:** 检查脚本改用 loadConfig 解析项目根，修复冒烟测试服务器入口 ([fe50cd8](https://github.com/lightdoodleh/OpenPrototype/commit/fe50cd897537f6917720756ed0eca85824cfda46))
* update color styling in PRD panel ([edf65f9](https://github.com/lightdoodleh/OpenPrototype/commit/edf65f9329144117f6fd2617d0c8c260d95f70d0))
* update color styling in PRD panel ([b498da1](https://github.com/lightdoodleh/OpenPrototype/commit/b498da196b502981a706af06dfe020fd8c08b82a))
* 引擎回退排除 constants/ 与 components/（业务资产缺失应 404 而非静默顶替） ([d40d790](https://github.com/lightdoodleh/OpenPrototype/commit/d40d790d5c2ff9204f96bebaccaf7cd815171539))
* 本机 URL 统一用 127.0.0.1，与默认绑定一致 ([3677dc2](https://github.com/lightdoodleh/OpenPrototype/commit/3677dc2226d812e3321ee88a9f0803f631a5be21))
* 消除切换页面时 PRD 面板的闪烁 ([#4](https://github.com/lightdoodleh/OpenPrototype/issues/4)) ([509670a](https://github.com/lightdoodleh/OpenPrototype/commit/509670a41ec9820190e57990431b6a2a52cecc9d))

## Changelog

All notable changes to this project will be documented in this file.
