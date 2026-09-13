# 异步提示词预设开发分支

Based on LittleWhiteBox by biex.

本分支在上游提交 `960b3233c90cdd7de7ac61becb7f00b05fa8a21b` 基础上新增提示词预设编译核心，尚未接入桌面设置页、持久化、业务绑定或自动维护路径。它是开发中的基础实现，不是完成全部功能的安装版本。

新增源码为 `capabilities/agent/prompt-preset.ts`，提供原项目 v1 导入、六类提示词块有序异步解析、跨供应商消息结构检查及共享 gateway 手动调用原语。动态数据源与宏解析由调用方注入，未复制附件的 QQ/Qzone/Twitter 业务代码。

详细架构与后续实施步骤见 [接入方案](async-preset-integration-plan.md)。示例位于 `../tests/fixtures/async-preset-example.json`。

验证记录：新增 10 项测试通过；小白 OS 全部 867 项测试通过。完整构建被独立源码副本缺少 SillyTavern 宿主文件和类型阻断；补丁前后类型诊断一致。未做宿主页面或真实模型验证。

```sh
npm ci --ignore-scripts
node --import tsx --test modules/xiaobai-os/tests/prompt-preset.test.js
node --import tsx --test --test-concurrency=2 modules/xiaobai-os/tests/*.test.js
```

编译器不持有 API 密钥，不直接写入聊天或领域数据；调用者负责超时、取消、聊天来源有效性与结果提交。
