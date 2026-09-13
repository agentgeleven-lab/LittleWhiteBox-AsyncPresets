import assert from 'node:assert/strict';
import test from 'node:test';
import {
    importPromptPresets, compilePromptPreset, toAgentPresetPrompt, runPromptPreset,
} from '../capabilities/agent/prompt-preset.ts';

const preset = blocks => importPromptPresets({ id: 'p', name: '示例', blocks })[0];
const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
};

test('imports source v1 and strips unrelated credentials without mutating input', () => {
    const source = { type: 'my-computer-network-preset', version: 1,
        preset: { id: 'p', name: '示例', key: 'dummy', blocks: [{ role: 'user', text: '原文' }] } };
    const before = structuredClone(source);
    const result = importPromptPresets(source);
    assert.equal(result[0].blocks[0].text, '原文');
    assert.equal('key' in result[0], false);
    assert.deepEqual(source, before);
    assert.equal(importPromptPresets({ presets: [source.preset] }).length, 1);
    assert.equal(importPromptPresets([source.preset]).length, 1);
});

test('rejects unknown versions, roles, duplicate IDs and oversized text without truncation', () => {
    assert.throws(() => importPromptPresets({ version: 2, blocks: [] }), /版本/);
    assert.throws(() => preset([{ role: 'tool' }]), /角色/);
    assert.throws(() => preset([{ id: 'b' }, { id: 'b' }]), /重复/);
    assert.throws(() => preset([{ text: 'a'.repeat(20001) }]), /20000/);
    assert.throws(() => preset([{ enabled: 'false' }]), /布尔/);
});

test('resolves all six block roles sequentially, skipping disabled and empty blocks', async () => {
    const calls = [];
    const messages = await compilePromptPreset(preset([
        { role: 'system', text: '规则 {{user}}' },
        { role: '_info', sourceId: 'map', messageRole: 'system' },
        { role: '_worldinfo', sourceName: '设定', messageRole: 'system' },
        { role: '_context' },
        { role: 'assistant', text: '示例' },
        { role: 'user', text: '开始' },
        { role: '_info', enabled: false, sourceId: 'disabled' },
        { role: 'user', text: '  ' },
    ]), {
        info: async b => { calls.push(b.sourceId); return '地图'; },
        worldInfo: async b => { calls.push(b.sourceName); return '世界'; },
        context: async () => { calls.push('context'); return [{ role: 'user', content: '你好' }]; },
        macros: text => text.replace('{{user}}', '玩家'),
    });
    assert.deepEqual(calls, ['map', '设定', 'context']);
    assert.deepEqual(messages.map(m => m.content), ['规则 玩家', '地图', '世界', '主聊天用户：你好', '示例', '开始']);
    assert.deepEqual(messages.map(m => m.role), ['system', 'system', 'system', 'system', 'assistant', 'user']);
});

test('snapshots the draft before awaits and reads main chat only once', async () => {
    const gate = deferred();
    const input = preset([{ role: '_info' }, { role: 'user', text: 'original' }, { role: '_context' }, { role: '_context' }]);
    let reads = 0;
    const pending = compilePromptPreset(input, {
        info: () => gate.promise,
        context: async () => { reads++; return [{ role: 'assistant', content: 'snapshot' }]; },
    });
    input.blocks[1].text = 'edited';
    gate.resolve('info');
    const messages = await pending;
    assert.equal(messages[1].content, 'original');
    assert.equal(reads, 1);
});

test('unmapped dynamic sources fail visibly rather than generating with placeholder data', async () => {
    await assert.rejects(compilePromptPreset(preset([{ role: '_info', sourceScope: 'qq', sourceId: 'contacts' }])), /qq\/contacts/);
    await assert.rejects(compilePromptPreset(preset([{ role: '_worldinfo' }])), /未接入/);
    await assert.rejects(compilePromptPreset(preset([{ role: '_context' }])), /未接入/);
});

test('provider boundary never silently reorders interleaved system messages', () => {
    assert.deepEqual(toAgentPresetPrompt([
        { role: 'system', content: 'a' }, { role: 'system', content: 'b' }, { role: 'user', content: 'c' },
    ]), { systemPrompt: 'a\n\nb', messages: [{ role: 'user', content: 'c' }] });
    assert.throws(() => toAgentPresetPrompt([{ role: 'user', content: 'c' }, { role: 'system', content: 'a' }]), /之前/);
    assert.throws(() => toAgentPresetPrompt([{ role: 'system', content: 'a' }]), /user/);
});

test('abort while resolving prevents any provider/config call', async () => {
    const gate = deferred();
    const abort = new AbortController();
    let calls = 0;
    const pending = runPromptPreset({
        gateway: { loadConfig: async () => { calls++; return {}; }, run: async () => { calls++; return {}; } },
        preset: preset([{ role: '_info' }, { role: 'user', text: 'go' }]),
        resolvers: { info: () => gate.promise }, signal: abort.signal,
    });
    abort.abort(); gate.resolve('late');
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(calls, 0);
});

test('pre-aborted run and cancellation during config load do not generate', async () => {
    const abort = new AbortController(); abort.abort();
    await assert.rejects(compilePromptPreset(preset([]), {}, abort.signal), { name: 'AbortError' });
    const second = new AbortController();
    let ran = false;
    await assert.rejects(runPromptPreset({
        gateway: { loadConfig: async () => { second.abort(); return {}; }, run: async () => { ran = true; return {}; } },
        preset: preset([{ role: 'user', text: 'go' }]), signal: second.signal,
    }), { name: 'AbortError' });
    assert.equal(ran, false);
});

test('manual execution reuses gateway and forwards stream without enabling tools', async () => {
    const signal = new AbortController().signal;
    const updates = [];
    const result = await runPromptPreset({
        gateway: {
            loadConfig: async () => ({ currentPresetName: 'existing' }),
            run: async request => {
                assert.equal(request.config.currentPresetName, 'existing');
                assert.equal(request.signal, signal);
                assert.equal(request.systemPrompt, '规则');
                assert.deepEqual(request.messages, [{ role: 'user', content: 'go' }]);
                assert.deepEqual(request.tools, []);
                request.onStreamProgress({ text: 'partial' });
                return { text: 'done' };
            },
        }, preset: preset([{ role: 'system', text: '规则' }, { role: 'user', text: 'go' }]),
        signal, onStreamProgress: update => updates.push(update),
    });
    assert.deepEqual(updates, [{ text: 'partial' }]);
    assert.equal(result.text, 'done');
});

test('late provider completion and stream are discarded after cancellation', async () => {
    const abort = new AbortController();
    const updates = [];
    await assert.rejects(runPromptPreset({
        gateway: { loadConfig: async () => ({}), run: async request => {
            abort.abort(); request.onStreamProgress({ text: 'late' }); return { text: 'late' };
        } },
        preset: preset([{ role: 'user', text: 'go' }]), signal: abort.signal,
        onStreamProgress: update => updates.push(update),
    }), { name: 'AbortError' });
    assert.deepEqual(updates, []);
});
