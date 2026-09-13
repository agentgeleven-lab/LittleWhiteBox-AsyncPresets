# LittleWhiteBox-AsyncPresets

小白X · 异步预设开发版。Based on LittleWhiteBox by biex.

这是 [LittleWhiteBox 原项目](https://github.com/RT15548/LittleWhiteBox) 的开发 Fork，目前提供异步提示词预设基础代码，尚未接入设置界面。

安装扩展时，仓库地址填写 `https://github.com/agentgeleven-lab/LittleWhiteBox-AsyncPresets`，分支填写 `xiaobai-os-async-presets`，不要使用带 `/tree/` 的网页地址。

仓库名称不同，因此不会占用原版的 `LittleWhiteBox` 安装目录。但两版仍共享内部设置标识、存储文件及全局接口，不能同时启用；使用此开发版前请在酒馆扩展管理中停用原版并重新加载页面。停用不会删除原版。此改名不提供数据隔离，开发版仍可能修改共用设置。

开发状态和验证范围见 [异步预设说明](modules/xiaobai-os/docs/async-preset-status.md)。

一个面向 SillyTavern 的多功能扩展，包含剧情总结/记忆系统、变量系统、任务与多种面板能力。集成了画图、流式生成、模板编辑、调试面板等组件，适合用于复杂玩法与长期剧情记录。

## 许可证

详见 `docs/LICENSE.md`
