# Wallet app

钱包展示当前聊天的小白币余额、流水分页和保存状态，并提供用户明确操作的“修改余额”。钱包通过独立的 economy.balance-adjustment 能力提交非负整数目标余额，由 Economy 在现有事务队列中追加差额流水；不直接改历史交易，不增加第二份余额，不修改银行持仓或其他 APP 数据。

当前 sidecar 已加载且已有 Economy 时，激活同步返回`ready`；没有 Economy 时，Controller 通过 Economy Capability 执行一次明确开户事务并显示`loading`。`unconfirmed`和`conflict`来自 Kernel 文件级保存状态，不是账本核对。

删除钱包只需删除 APP 目录及 Host/Shell catalog 注册；Wallet 没有自有分区，Economy 可继续服务其他 APP。

UI 使用钱夹式余额展示、按日期排列的收支账单和只读详情；收入、支出、系统划转筛选只作用于已加载账目，不伪造全量收支统计。“修改余额”位于余额卡下方，支持增加、减少、归零，保存成功后刷新余额与流水。仅 ready 状态允许修改；Host 校验目标金额、余额与流水数量，并通过提交守卫阻止切换聊天后写入。相同 actionId 的已确认调整不会重复记账。

`wallet/confirm-save` 仍调用 Kernel `retryPending`，恢复已有待确认保存，不重复发放小白币。只读 economy.read 能力保持不变；其他资金消费者不会获得手动调账接口。
