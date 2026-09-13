import type { XiaobaiOsAgentGateway, XiaobaiOsAgentRunRequest } from './gateway.js';

export type PromptRole = 'system' | 'user' | 'assistant';
export type PresetBlockRole = PromptRole | '_context' | '_info' | '_worldinfo';
export interface PresetBlock {
    id: string;
    name: string;
    role: PresetBlockRole;
    messageRole: PromptRole;
    text: string;
    sourceId: string;
    sourceName: string;
    sourceScope: string;
    enabled: boolean;
}
export interface PromptPreset { id: string; name: string; blocks: PresetBlock[] }
export interface PromptMessage { role: PromptRole; content: string }
export interface PresetResolvers {
    // Resolvers must close over a captured chat snapshot, not a live UI selection.
    context?: (signal?: AbortSignal) => Promise<readonly PromptMessage[]>;
    info?: (block: Readonly<PresetBlock>, signal?: AbortSignal) => Promise<string>;
    worldInfo?: (block: Readonly<PresetBlock>, signal?: AbortSignal) => Promise<string>;
    macros?: (text: string, signal?: AbortSignal) => string | Promise<string>;
}

const roles = new Set<string>(['system', 'user', 'assistant']);
const blockRoles = new Set<string>([...roles, '_context', '_info', '_worldinfo']);
function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('预设必须是 JSON 对象');
    }
    return value as Record<string, unknown>;
}
function stringField(value: unknown, fallback = ''): string {
    if (value === undefined) { return fallback; }
    if (typeof value !== 'string') { throw new Error('预设文本字段必须是字符串'); }
    return value;
}

/** Imports source v1 exports without carrying API credentials or silently truncating prompts. */
export function importPromptPresets(payload: unknown): PromptPreset[] {
    let entries: unknown[];
    if (Array.isArray(payload)) { entries = payload; }
    else {
        const root = record(payload);
        if (root.type !== undefined && root.type !== 'my-computer-network-preset') {
            throw new Error('不支持的预设格式');
        }
        if (root.version !== undefined && root.version !== 1) { throw new Error('不支持的预设版本'); }
        entries = Array.isArray(root.presets) ? root.presets : [root.preset ?? root];
    }
    if (!entries.length || entries.length > 100) { throw new Error('一次导入须包含 1–100 个预设'); }
    const ids = new Set<string>();
    return entries.map((entry, index) => {
        const input = record(entry);
        const id = stringField(input.id, `import-${index}`).trim();
        if (!id || ids.has(id)) { throw new Error('预设 ID 为空或重复'); }
        ids.add(id);
        if (!Array.isArray(input.blocks) || input.blocks.length > 60) {
            throw new Error('预设须包含 blocks 数组，最多 60 块');
        }
        const blockIds = new Set<string>();
        const blocks = input.blocks.map((value, blockIndex): PresetBlock => {
            const block = record(value);
            const blockId = stringField(block.id, `${id}-block-${blockIndex}`).trim();
            if (!blockId || blockIds.has(blockId)) { throw new Error('块 ID 为空或重复'); }
            blockIds.add(blockId);
            const role = stringField(block.role, 'system');
            const messageRole = stringField(block.messageRole) || 'system';
            if (!blockRoles.has(role) || !roles.has(messageRole)) { throw new Error('不支持的消息角色'); }
            if (block.enabled !== undefined && typeof block.enabled !== 'boolean') {
                throw new Error('块 enabled 必须为布尔值');
            }
            const text = stringField(block.text);
            if (text.length > 20000) { throw new Error('单块提示词超过 20000 字符'); }
            return {
                id: blockId, name: stringField(block.name, `块 ${blockIndex + 1}`),
                role: role as PresetBlockRole, messageRole: messageRole as PromptRole,
                text, enabled: block.enabled !== false,
                sourceId: stringField(block.sourceId), sourceName: stringField(block.sourceName),
                sourceScope: stringField(block.sourceScope),
            };
        });
        return { id, name: stringField(input.name, `预设 ${index + 1}`), blocks };
    });
}

function checkAbort(signal?: AbortSignal): void {
    if (signal?.aborted) { throw new DOMException('预设执行已取消', 'AbortError'); }
}

/** Ordered async compilation. No provider calls, persistence, or domain writes. */
export async function compilePromptPreset(
    input: PromptPreset,
    resolvers: PresetResolvers = {},
    signal?: AbortSignal,
): Promise<PromptMessage[]> {
    checkAbort(signal);
    // Copy and validate before the first await, so editing a draft cannot alter an in-flight run.
    const preset = importPromptPresets(input)[0];
    const messages: PromptMessage[] = [];
    let context: readonly PromptMessage[] | undefined;
    for (const block of preset.blocks) {
        checkAbort(signal);
        if (!block.enabled) { continue; }
        let content: string;
        let role: PromptRole = block.messageRole;
        if (roles.has(block.role)) {
            role = block.role as PromptRole;
            content = block.text;
        } else if (block.role === '_context') {
            if (!resolvers.context) { throw new Error(`未接入主聊天数据源：${block.id}`); }
            context ??= structuredClone(await resolvers.context(signal));
            content = context.map(message => {
                if (!['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
                    throw new Error('主聊天数据源须提供 user/assistant 文本消息');
                }
                return `${message.role === 'user' ? '主聊天用户' : '主聊天AI'}：${message.content}`;
            }).join('\n\n');
            role = 'system';
        } else {
            const resolver = block.role === '_info' ? resolvers.info : resolvers.worldInfo;
            if (!resolver) { throw new Error(`未接入数据源：${block.sourceScope}/${block.sourceId || block.sourceName}`); }
            content = await resolver(Object.freeze({ ...block }), signal);
        }
        checkAbort(signal);
        if (typeof content !== 'string') { throw new Error(`数据源未返回文本：${block.id}`); }
        if (resolvers.macros) { content = await resolvers.macros(content, signal); }
        checkAbort(signal);
        if (typeof content !== 'string') { throw new Error('宏解析器未返回文本'); }
        content = content.trim();
        if (content) { messages.push({ role, content }); }
    }
    return messages;
}

/**
 * Portable gateway boundary. Anthropic/Google hoist system messages, so reject
 * interleaved system blocks rather than silently changing the source preset order.
 */
export function toAgentPresetPrompt(messages: readonly PromptMessage[]): {
    systemPrompt: string; messages: Array<{ role: PromptRole; content: string }>;
} {
    const system: string[] = [];
    const conversation: Array<{ role: PromptRole; content: string }> = [];
    for (const message of messages) {
        if (!roles.has(message.role) || typeof message.content !== 'string') { throw new Error('无效的编译消息'); }
        if (message.role === 'system') {
            if (conversation.length) { throw new Error('跨供应商模式要求所有 system 块位于对话块之前'); }
            system.push(message.content);
        } else { conversation.push({ role: message.role, content: message.content }); }
    }
    if (!conversation.some(message => message.role === 'user')) { throw new Error('预设须包含至少一个 user 消息'); }
    return { systemPrompt: system.join('\n\n'), messages: conversation };
}

/**
 * Explicit foreground generation primitive, not an automatic maintenance runner.
 * Caller owns timeout/queue/lifecycle and must guard any subsequent domain commit.
 */
export async function runPromptPreset(options: {
    gateway: Pick<XiaobaiOsAgentGateway, 'loadConfig' | 'run'>;
    preset: PromptPreset;
    resolvers?: PresetResolvers;
    signal: AbortSignal;
    onStreamProgress?: XiaobaiOsAgentRunRequest['onStreamProgress'];
}): Promise<Record<string, unknown>> {
    const { gateway, signal } = options;
    const prompt = toAgentPresetPrompt(await compilePromptPreset(options.preset, options.resolvers, signal));
    checkAbort(signal);
    const config = await gateway.loadConfig();
    checkAbort(signal);
    const result = await gateway.run({
        config, ...prompt, tools: [], signal,
        onStreamProgress: snapshot => {
            if (!signal.aborted) { options.onStreamProgress?.(snapshot); }
        },
    });
    checkAbort(signal);
    return result;
}
