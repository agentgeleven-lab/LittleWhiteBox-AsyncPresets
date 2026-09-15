import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourceRoot = path.resolve('modules/variables/state2');
const yamlModuleUrl = pathToFileURL(path.resolve('libs/js-yaml.mjs')).href;

function copySourceFile(tempDir, name, transform = source => source) {
    const source = readFileSync(path.join(sourceRoot, name), 'utf8');
    writeFileSync(path.join(tempDir, name), transform(source), 'utf8');
}

async function createHarness() {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'lwb-state2-'));

    writeFileSync(path.join(tempDir, 'package.json'), '{"type":"module"}\n', 'utf8');
    writeFileSync(path.join(tempDir, 'mock-env.js'), `
export const state = {
  ctx: {
    chatId: 'test-chat',
    chat: [],
    chatMetadata: { variables: {}, extensions: {} },
    saveCount: 0,
    saveMetadataDebounced() { this.saveCount += 1; },
  },
};

export function resetContext() {
  state.ctx.chatId = 'test-chat';
  state.ctx.chat = [];
  state.ctx.chatMetadata = { variables: {}, extensions: {} };
  state.ctx.saveCount = 0;
}
`, 'utf8');
    writeFileSync(path.join(tempDir, 'mock-extensions.js'), `
import { state } from './mock-env.js';
export function getContext() {
  return state.ctx;
}
`, 'utf8');
    writeFileSync(path.join(tempDir, 'mock-variables.js'), `
import { state } from './mock-env.js';

export function getLocalVariable(name) {
  const variables = state.ctx.chatMetadata.variables ||= {};
  const value = variables[name];
  if (value == null) return '';
  if (typeof value !== 'string') return value;
  return value.trim?.() === '' || isNaN(Number(value)) ? value : Number(value);
}

export function setLocalVariable(name, value) {
  if (!name) throw new Error('Variable name cannot be empty or undefined.');
  const variables = state.ctx.chatMetadata.variables ||= {};
  variables[name] = value;
  state.ctx.saveMetadataDebounced();
  return value;
}
`, 'utf8');

    copySourceFile(tempDir, 'parser.js', source => source
        .replace("import jsyaml from '../../../libs/js-yaml.mjs';", `import jsyaml from '${yamlModuleUrl}';`));
    copySourceFile(tempDir, 'semantic.js');
    copySourceFile(tempDir, 'guard-core.js');
    copySourceFile(tempDir, 'guard.js', source => source
        .replace("import { getContext } from '../../../../../../extensions.js';", "import { getContext } from './mock-extensions.js';"));
    copySourceFile(tempDir, 'executor.js', source => source
        .replace("import { getContext } from '../../../../../../extensions.js';", "import { getContext } from './mock-extensions.js';")
        .replace("import { getLocalVariable, setLocalVariable } from '../../../../../../variables.js';", "import { getLocalVariable, setLocalVariable } from './mock-variables.js';"));

    const envModuleUrl = pathToFileURL(path.join(tempDir, 'mock-env.js')).href;
    const executorModuleUrl = pathToFileURL(path.join(tempDir, 'executor.js')).href;
    const guardModuleUrl = pathToFileURL(path.join(tempDir, 'guard.js')).href;
    // eslint-disable-next-line no-unsanitized/method
    const env = await import(envModuleUrl);
    // eslint-disable-next-line no-unsanitized/method
    const executor = await import(executorModuleUrl);
    // eslint-disable-next-line no-unsanitized/method
    const guard = await import(guardModuleUrl);

    // Run the actual event handlers with only the SillyTavern host APIs stubbed.
    writeFileSync(path.join(tempDir, 'mock-core.js'), `
import { state } from './mock-env.js';
export const extension_settings = { LittleWhiteBox: { variablesMode: '2.0' } };
export const handlers = new Map();
export const timers = [];
export const event_types = new Proxy({}, { get: (_, key) => key });
export const createModuleEvents = () => ({
  on: (key, fn) => handlers.set(key, fn), cleanup: () => handlers.clear()
});
export const schedule = fn => { timers.push(fn); return timers.length; };
export const emit = async (key, data) => { await handlers.get(key)?.(data); };
export const drain = async () => { while (timers.length) await timers.shift()(); };
export const updateMessageBlock = () => {};
export const xbLog = { info() {} };
export const CacheRegistry = { register() {} };
export const initAfterAiGate = () => {};
export const notifyAfterAiHint = () => {};
export const registerAfterAiHandler = () => () => {};
export const parseDirectivesTokenList = () => [];
export const applyXbGetVarForMessage = () => {};
export const parseValueForSet = value => value;
export const preprocessBumpAliases = value => value;
export const executeQueuedVareventJsAfterTurn = async () => {};
export const stripYamlInlineComment = value => value;
export const OP_MAP = {};
export const TOP_OP_RE = /$/;
`, 'utf8');
    const pathHelpers = pathToFileURL(path.resolve('core/variable-path.js')).href;
    const coreSource = readFileSync(path.resolve('modules/variables/variables-core.js'), 'utf8')
        .replace('import { extension_settings, getContext } from "../../../../../extensions.js";',
            'import { extension_settings, schedule } from "./mock-core.js"; import { getContext } from "./mock-extensions.js";')
        .replace('"../../../../../variables.js"', '"./mock-variables.js"')
        .replace('"../../core/variable-path.js"', JSON.stringify(pathHelpers))
        .replaceAll('./state2/index.js', './executor.js')
        .replace(/"(?:\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/script\.js|\.\.\/\.\.\/core\/(?:event-manager|debug-core|after-ai-gate)\.js|\.\/var-commands\.js|\.\/varevent-editor\.js)"/g, '"./mock-core.js"')
        .replaceAll('setTimeout(', 'schedule(');
    writeFileSync(path.join(tempDir, 'variables-core.js'), coreSource, 'utf8');
    const core = await import(pathToFileURL(path.join(tempDir, 'variables-core.js')).href);
    const host = await import(pathToFileURL(path.join(tempDir, 'mock-core.js')).href);

    return {
        tempDir,
        env,
        executor,
        guard,
        core,
        host,
        reset() {
            core.cleanupVariablesCore();
            env.resetContext();
            host.timers.length = 0;
            env.state.ctx.eventSource = { emit: host.emit };
            env.state.ctx.event_types = host.event_types;
            core.initVariablesCore();
        },
        cleanup() {
            rmSync(tempDir, { recursive: true, force: true });
        },
    };
}

function readStoredValue(ctx, root) {
    const raw = ctx.chatMetadata.variables?.[root];
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { return raw; }
}

function lwbMeta(ctx) {
    return ctx.chatMetadata.extensions?.LittleWhiteBox || {};
}

let harness;
const originalDollar = globalThis.$;
const originalDocument = globalThis.document;

test.before(async () => {
    globalThis.$ = () => ({ trigger() {} });
    globalThis.document = {};
    harness = await createHarness();
});

test.beforeEach(() => {
    harness.reset();
});

test.after(() => {
    globalThis.$ = originalDollar;
    globalThis.document = originalDocument;
    delete globalThis.LWB_StateRollbackHook;
    harness?.core.cleanupVariablesCore();
    harness?.cleanup();
});

function seedChat(texts) {
    const { ctx } = harness.env.state;
    ctx.chat = texts.map(mes => ({ mes }));
    texts.forEach((text, id) => harness.executor.applyStateForMessage(id, text));
    // Install/modify external values after snapshots already exist.
    const external = { 状态栏: '{"new":true}', map_data: { x: 9 }, xiaobai_os: 'latest', plugin_cache: false };
    Object.assign(ctx.chatMetadata.variables, external);
    return { ctx, external };
}

function assertExternal(ctx, external) {
    for (const [key, value] of Object.entries(external)) {
        assert.strictEqual(ctx.chatMetadata.variables[key], value, key);
    }
}

test('正文-only edit and following UPDATED never rollback, replay, write, or call hooks', async () => {
    const { ctx, external } = seedChat(['<state>\nhp: 100\n</state>', 'before <state>\nhp: +5\n</state>']);
    let hooks = 0;
    globalThis.LWB_StateRollbackHook = () => { hooks++; };
    ctx.chat[1].mes = 'changed prose <STATE >\r\nhp: +5\r\n</STATE>';
    const before = JSON.stringify(ctx.chatMetadata);
    const saves = ctx.saveCount;
    await harness.host.emit('MESSAGE_EDITED', 1);
    await harness.host.emit('MESSAGE_UPDATED', 1);
    await harness.host.drain();
    assert.equal(hooks, 0);
    assert.equal(ctx.saveCount, saves);
    assert.equal(JSON.stringify(ctx.chatMetadata), before);
    assertExternal(ctx, external);
    delete globalThis.LWB_StateRollbackHook;
});

test('no-state, empty and unclosed blocks do not trigger State rollback on edit', async () => {
    const { ctx, external } = seedChat(['only prose']);
    ctx.chat[0].mes = 'edited <state> </state> <state>unfinished';
    const before = JSON.stringify(ctx.chatMetadata);
    await harness.host.emit('MESSAGE_EDITED', 0);
    await harness.host.emit('MESSAGE_UPDATED', 0);
    await harness.host.drain();
    assert.equal(JSON.stringify(ctx.chatMetadata), before);
    assertExternal(ctx, external);
});

test('WAL comparison survives chat reload and multiple State blocks preserve order', async () => {
    const text = '<state>hp: 10</state> prose <state>hp: +2</state>';
    const { ctx, external } = seedChat([text]);
    await harness.host.emit('CHAT_CHANGED');
    assert.equal(harness.executor.isStateContentUnchanged(0, text.replace('prose', 'new')), true);
    assert.equal(harness.executor.isStateContentUnchanged(0, '<state>hp: +2</state><state>hp: 10</state>'), false);
    const before = JSON.stringify(ctx.chatMetadata);
    ctx.chat[0].mes = text.replace('prose', 'new');
    await harness.host.emit('MESSAGE_EDITED', 0);
    await harness.host.emit('MESSAGE_UPDATED', 0);
    assert.equal(JSON.stringify(ctx.chatMetadata), before);
    assertExternal(ctx, external);
});

test('actual State edit replays later floors and replaces stale checkpoints', async () => {
    const { ctx } = harness.env.state;
    ctx.chatMetadata.extensions = { LittleWhiteBox: { stateCkptV2: { every: 1, points: {} } } };
    const { external } = seedChat(['<state>hp: 100</state>', '<state>hp: +5</state>', '<state>hp: +2</state>']);
    let hooks = 0;
    globalThis.LWB_StateRollbackHook = () => { hooks++; };
    ctx.chat[1].mes = '<state>hp: +10</state>';
    await harness.host.emit('MESSAGE_EDITED', { messageId: 1 });
    await harness.host.drain();
    assert.equal(hooks, 1);
    assert.equal(readStoredValue(ctx, 'hp'), 112);
    await harness.executor.restoreStateV2ToFloor(2);
    assert.equal(readStoredValue(ctx, 'hp'), 112);
    assert.equal(harness.executor.applyStateForMessage(2, ctx.chat[2].mes).skipped, true);
    assertExternal(ctx, external);
    delete globalThis.LWB_StateRollbackHook;
});

test('adding and removing State on the first floor invalidates execution markers', async () => {
    const { ctx, external } = seedChat(['prose']);
    ctx.chat[0].mes = '<state>hp: +10</state>';
    await harness.host.emit('MESSAGE_EDITED', 0);
    await harness.host.drain();
    assert.equal(readStoredValue(ctx, 'hp'), 10);
    ctx.chat[0].mes = 'prose again';
    await harness.host.emit('MESSAGE_EDITED', 0);
    await harness.host.drain();
    assert.equal(ctx.chatMetadata.variables.hp, undefined);
    await harness.executor.restoreStateV2ToFloor(0);
    assert.equal(ctx.chatMetadata.variables.hp, undefined);
    assertExternal(ctx, external);
});

test('reroll of the first floor with identical State executes exactly once', async () => {
    const { ctx, external } = seedChat(['<state>hp: +10</state>']);
    await harness.host.emit('MESSAGE_SWIPED', 0);
    await harness.host.drain();
    assert.equal(readStoredValue(ctx, 'hp'), 10);
    await harness.host.emit('MESSAGE_UPDATED', 0);
    assert.equal(readStoredValue(ctx, 'hp'), 10);
    assertExternal(ctx, external);
});

test('delete, trim, rebuild and delete-all preserve external variables', async () => {
    const { ctx, external } = seedChat(['<state>hp: 100</state>', '<state>hp: +5\nmoney: 20</state>']);
    ctx.chat.pop();
    await harness.host.emit('MESSAGE_DELETED', { id: 1 });
    assert.equal(readStoredValue(ctx, 'hp'), 100);
    assert.equal(ctx.chatMetadata.variables.money, undefined);
    await harness.core.rebuildVariablesFromScratch();
    assertExternal(ctx, external);
    ctx.chat.length = 0;
    await harness.host.emit('MESSAGE_DELETED', 0);
    assert.equal(ctx.chatMetadata.variables.hp, undefined);
    assertExternal(ctx, external);
});

test('new checkpoints exclude external data; legacy full snapshots cannot overwrite it', async () => {
    const { ctx } = harness.env.state;
    ctx.chatMetadata.variables.状态栏 = 'old';
    const { external } = seedChat(['<state>hp: 100</state>']);
    const checkpoint = lwbMeta(ctx).stateCkptV2.points['0'];
    assert.deepEqual(Object.keys(checkpoint.vars), ['hp']);
    checkpoint.vars.状态栏 = 'legacy stale';
    checkpoint.vars.map_data = { x: -1 };
    await harness.executor.restoreStateV2ToFloor(0);
    assertExternal(ctx, external);
});

test('replay respects explicit empty ownership even if legacy rejected ops are logged', async () => {
    const { ctx, external } = seedChat(['prose']);
    lwbMeta(ctx).stateLogV2 = { version: 1, floors: {} };
    lwbMeta(ctx).stateLogV2.floors['1'] = {
        signature: '<state>plugin_cache: true</state>', roots: [],
        ops: [{ path: 'plugin_cache', op: 'set', value: true }],
        rules: [{ path: 'plugin_cache', rule: { typeLock: 'string' } }],
    };
    await harness.executor.restoreStateV2ToFloor(1);
    assertExternal(ctx, external);
    assert.equal(ctx.chatMetadata.LWB_RULES_V2.plugin_cache, undefined);
});

test('legacy WAL without roots derives ownership from explicit ops only', async () => {
    const { ctx, external } = seedChat(['<state>hp: 100</state>']);
    delete lwbMeta(ctx).stateLogV2.floors['0'].roots;
    lwbMeta(ctx).stateCkptV2.points = {};
    await harness.executor.restoreStateV2ToFloor(0);
    assert.equal(readStoredValue(ctx, 'hp'), 100);
    assertExternal(ctx, external);
});

test('unknown snapshot variables stay untouched when ownership metadata is missing', async () => {
    const { ctx, external } = seedChat(['<state>hp: 100</state>']);
    lwbMeta(ctx).stateLogV2.floors = {};
    delete ctx.chatMetadata.variables.状态栏;
    lwbMeta(ctx).stateCkptV2.points['0'].vars.状态栏 = 'stale';
    await harness.executor.restoreStateV2ToFloor(0);
    assert.equal(ctx.chatMetadata.variables.状态栏, undefined);
    assert.strictEqual(ctx.chatMetadata.variables.map_data, external.map_data);
    assert.equal(ctx.chatMetadata.variables.hp, '100');
    await harness.executor.restoreStateV2ToFloor(-1);
    assert.equal(ctx.chatMetadata.variables.hp, '100');
});

test('failed operations never gain ownership or become new successful replay writes', async () => {
    const { ctx, external } = seedChat(['prose']);
    ctx.chatMetadata.variables.plugin_cache = 'not an array';
    harness.executor.applyStateForMessage(1, '<state>hp: 10\nplugin_cache: +["bad"]</state>');
    assert.deepEqual(lwbMeta(ctx).stateLogV2.floors['1'].roots, ['hp']);
    assert.deepEqual(lwbMeta(ctx).stateLogV2.floors['1'].ops.map(op => op.path), ['hp']);
    ctx.chatMetadata.variables.plugin_cache = external.plugin_cache;
    await harness.executor.restoreStateV2ToFloor(1);
    assertExternal(ctx, external);
});

test('state2 apply runs parser, rules, guard coercion, WAL, and idempotency together', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(1, `
before
<state>
$schema 数据
  背包:
    - 名称: ""
      数量: 0
</state>
middle
<state>
数据.背包: +{"名称":"蓝药","数量":"5"}
</state>
`);

    assert.equal(result.skipped, false);
    assert.equal(result.errors.length, 0);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        背包: [{ 名称: '蓝药', 数量: 5 }],
    });
    assert.deepEqual(ctx.chatMetadata.LWB_RULES_V2['数据.背包.[*].数量'], { typeLock: 'number' });

    const log = lwbMeta(ctx).stateLogV2;
    assert.ok(log.floors['1']);
    assert.equal(log.floors['1'].rules.length, 5);
    assert.equal(log.floors['1'].ops.length, 1);
    assert.deepEqual(log.floors['1'].roots, ['数据']);

    const second = harness.executor.applyStateForMessage(1, `
before
<state>
$schema 数据
  背包:
    - 名称: ""
      数量: 0
</state>
middle
<state>
数据.背包: +{"名称":"蓝药","数量":"5"}
</state>
`);
    assert.equal(second.skipped, true);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        背包: [{ 名称: '蓝药', 数量: 5 }],
    });
});

test('state2 executor preserves [*] array template paths separately from object wildcard paths', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(1, `
<state>
$schema 数据
  背包:
    - 数量: 0
  同行者:
    "*":
      HP: 0
</state>
`);

    assert.equal(result.errors.length, 0);
    assert.deepEqual(ctx.chatMetadata.LWB_RULES_V2['数据.背包.[*].数量'], { typeLock: 'number' });
    assert.deepEqual(ctx.chatMetadata.LWB_RULES_V2['数据.同行者.*.HP'], { typeLock: 'number' });
    assert.equal(ctx.chatMetadata.LWB_RULES_V2['数据.背包.*.数量'], undefined);
});

test('state2 rejects invalid deep writes without storing bad values', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(2, `
<state>
$schema 数据
  背包:
    - 名称: ""
      数量: 0
数据.背包: +{"名称":"蓝药","数量":"bad"}
数据.背包: +{"名称":"红药","数量":"3"}
</state>
`);

    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /类型不匹配/);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        背包: [{ 名称: '红药', 数量: 3 }],
    });
    assert.match(ctx.chatMetadata.variables.LWB_STATE_ERRORS, /类型不匹配/);
});

test('state2 rejects push to schema paths that are not arrays', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(8, `
<state>
$schema 数据
  名称: ""
数据.名称: +"x"
</state>
`);

    assert.equal(result.atoms.length, 0);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /期望 array/);
    assert.equal(ctx.chatMetadata.variables.数据, undefined);
    assert.match(ctx.chatMetadata.variables.LWB_STATE_ERRORS, /期望 array/);
});

test('state2 parser operation forms execute through the real executor', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(3, `
<state>
数据.计数: 1
数据.计数: +4
数据.标签: +["a","b"]
数据.标签: +"c"
数据.标签: -"b"
数据.对象: {"保留":true}
数据.对象: null
</state>
`);

    assert.equal(result.errors.length, 0);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        计数: 5,
        标签: ['a', 'c'],
    });
});

test('state2 parser preserves quoted colons and ignores inline comments outside quotes', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(4, `
<state>
数据.文本: "a: b # kept" # dropped
数据.单引号: 'x # kept'
数据.对象:
  标题: "里:面"
  备注: "井号 # 留下"
</state>
`);

    assert.equal(result.errors.length, 0);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        文本: 'a: b # kept',
        单引号: 'x # kept',
        对象: {
            标题: '里:面',
            备注: '井号 # 留下',
        },
    });
});

test('state2 parser reports malformed inline json without corrupting later ops', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(5, `
<state>
数据.坏对象: {"a":
数据.好对象: {"a":1}
数据.坏推入: +{"a":
数据.好列表: +"ok"
</state>
`);

    assert.equal(result.errors.length, 2);
    assert.match(result.errors[0], /JSON 解析失败/);
    assert.match(result.errors[1], /\+\{\} 解析失败/);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        坏对象: '{"a":',
        好对象: { a: 1 },
        坏推入: '+{"a":',
        好列表: ['ok'],
    });
});

test('state2 parser handles multiple and malformed state tags defensively', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(6, `
ignored <statement>not a state</statement>
<state id="a">
数据.A: 1
</state   >
<state>
数据.B: 2
</state>
<state>
数据.C: 3
`);

    assert.equal(result.errors.length, 0);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        A: 1,
        B: 2,
    });
});

test('state2 deletes array indexes by original index order before other ops', () => {
    const { ctx } = harness.env.state;
    harness.executor.applyStateForMessage(1, `
<state>
数据.列表: ["a","b","c","d"]
</state>
`);

    const result = harness.executor.applyStateForMessage(2, `
<state>
数据.列表.1: null
数据.列表.2: null
数据.列表: +"e"
</state>
`);

    assert.equal(result.errors.length, 0);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        列表: ['a', 'd', 'e'],
    });
});

test('state2 execution records operation failures without writing atoms', () => {
    const { ctx } = harness.env.state;
    const result = harness.executor.applyStateForMessage(7, `
<state>
数据.文本: "not array"
数据.文本: +"x"
数据.缺失: -"x"
</state>
`);

    assert.equal(result.atoms.length, 1);
    assert.equal(result.errors.length, 2);
    assert.match(result.errors[0], /not-array/);
    assert.match(result.errors[1], /not-array/);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        文本: 'not array',
    });
    assert.match(ctx.chatMetadata.variables.LWB_STATE_ERRORS, /not-array/);
});

test('state2 restore replays WAL to the requested floor and restores rules', async () => {
    const { ctx } = harness.env.state;
    harness.executor.applyStateForMessage(1, `
<state>
$schema 数据
  背包:
    - 名称: ""
      数量: 0
数据.背包: +{"名称":"蓝药","数量":"5"}
</state>
`);
    harness.executor.applyStateForMessage(2, `
<state>
数据.背包: +{"名称":"红药","数量":"7"}
</state>
`);
    harness.executor.applyStateForMessage(3, `
<state>
数据.背包: +{"名称":"坏药","数量":"9"}
</state>
`);

    await harness.executor.restoreStateV2ToFloor(2);

    assert.deepEqual(readStoredValue(ctx, '数据'), {
        背包: [
            { 名称: '蓝药', 数量: 5 },
            { 名称: '红药', 数量: 7 },
        ],
    });
    assert.deepEqual(ctx.chatMetadata.LWB_RULES_V2['数据.背包.[*].数量'], { typeLock: 'number' });

    const guard = harness.guard.validate('set', '数据.背包.2.数量', '8', undefined);
    assert.equal(guard.allow, true);
    assert.equal(guard.value, 8);
});

test('state2 trim removes future WAL/checkpoints/applied signatures before restore', async () => {
    const { ctx } = harness.env.state;
    ctx.chatMetadata.extensions = {
        LittleWhiteBox: {
            stateCkptV2: { version: 1, every: 1, points: {} },
        },
    };

    harness.executor.applyStateForMessage(1, `
<state>
数据.值: 1
</state>
`);
    harness.executor.applyStateForMessage(2, `
<state>
数据.值: 2
</state>
`);
    harness.executor.applyStateForMessage(3, `
<state>
数据.值: 3
</state>
`);

    assert.ok(lwbMeta(ctx).stateCkptV2.points['3']);

    await harness.executor.trimStateV2FromFloor(3);
    await harness.executor.restoreStateV2ToFloor(10);

    assert.deepEqual(readStoredValue(ctx, '数据'), { 值: 2 });
    assert.equal(lwbMeta(ctx).stateLogV2.floors['3'], undefined);
    assert.equal(lwbMeta(ctx).stateCkptV2.points['3'], undefined);
});

test('state2 checkpoint replay matches full replay and keeps later floors', async () => {
    const { ctx } = harness.env.state;
    ctx.chatMetadata.extensions = {
        LittleWhiteBox: {
            stateCkptV2: { version: 1, every: 2, points: {} },
        },
    };

    harness.executor.applyStateForMessage(1, `
<state>
数据.值: 1
</state>
`);
    harness.executor.applyStateForMessage(2, `
<state>
数据.值: +4
</state>
`);
    harness.executor.applyStateForMessage(3, `
<state>
数据.列表: +["x"]
</state>
`);

    assert.deepEqual(lwbMeta(ctx).stateCkptV2.points['2'].vars, {
        数据: '{"值":5}',
    });

    await harness.executor.restoreStateV2ToFloor(3);
    assert.deepEqual(readStoredValue(ctx, '数据'), {
        值: 5,
        列表: ['x'],
    });
});

test('state2 checkpoint saving can be disabled without breaking restore', async () => {
    const { ctx } = harness.env.state;
    ctx.chatMetadata.extensions = {
        LittleWhiteBox: {
            stateCkptV2: { version: 1, every: 0, points: {} },
        },
    };

    harness.executor.applyStateForMessage(1, `
<state>
数据.值: 1
</state>
`);
    harness.executor.applyStateForMessage(2, `
<state>
数据.值: +2
</state>
`);

    assert.deepEqual(lwbMeta(ctx).stateCkptV2.points, {});
    await harness.executor.restoreStateV2ToFloor(2);
    assert.deepEqual(readStoredValue(ctx, '数据'), { 值: 3 });
});

test('state2 restore and trim handle invalid floors defensively', async () => {
    const { ctx } = harness.env.state;
    harness.executor.applyStateForMessage(1, `
<state>
数据.值: 1
</state>
`);

    const invalidRestore = await harness.executor.restoreStateV2ToFloor('bad');
    assert.deepEqual(invalidRestore, { ok: false });
    assert.deepEqual(readStoredValue(ctx, '数据'), { 值: 1 });

    const invalidTrim = await harness.executor.trimStateV2FromFloor('bad');
    assert.deepEqual(invalidTrim, { ok: false });
});

test('state2 restore below zero clears only State2-owned roots and rules', async () => {
    const { ctx } = harness.env.state;
    ctx.chatMetadata.variables.外部 = '{"保留":true}';
    ctx.chatMetadata.LWB_RULES_V2 = {
        '外部.字段': { typeLock: 'string' },
    };

    harness.executor.applyStateForMessage(1, `
<state>
$schema 数据
  值: 0
数据.值: 1
</state>
`);

    await harness.executor.restoreStateV2ToFloor(-1);

    assert.deepEqual(readStoredValue(ctx, '外部'), { 保留: true });
    assert.equal(ctx.chatMetadata.variables.数据, undefined);
    assert.deepEqual(ctx.chatMetadata.LWB_RULES_V2, {
        '外部.字段': { typeLock: 'string' },
    });
});

test('state2 removing state block clears that floor WAL and reapplies prior state on restore', async () => {
    const { ctx } = harness.env.state;
    harness.executor.applyStateForMessage(1, `
<state>
数据.值: 1
</state>
`);
    harness.executor.applyStateForMessage(2, `
<state>
数据.值: 2
</state>
`);

    const result = harness.executor.applyStateForMessage(2, 'no state here');
    assert.equal(result.skipped, false);
    assert.equal(lwbMeta(ctx).stateLogV2.floors['2'], undefined);

    await harness.executor.restoreStateV2ToFloor(2);
    assert.deepEqual(readStoredValue(ctx, '数据'), { 值: 1 });
});

test('state2 guard metadata wrapper saves and reloads core rules', () => {
    const { ctx } = harness.env.state;
    harness.guard.clearAllRules();
    harness.guard.setRule('数据.HP', { typeLock: 'number', min: 0, max: 10 });
    harness.guard.saveRulesToMeta();

    assert.deepEqual(ctx.chatMetadata.LWB_RULES_V2, {
        '数据.HP': { typeLock: 'number', min: 0, max: 10 },
    });

    const savedRules = ctx.chatMetadata.LWB_RULES_V2;
    harness.guard.clearAllRules();
    ctx.chatMetadata.LWB_RULES_V2 = savedRules;
    assert.equal(harness.guard.validate('set', '数据.HP', '12', 0).value, '12');

    harness.guard.loadRulesFromMeta();
    const result = harness.guard.validate('set', '数据.HP', '12', 0);
    assert.equal(result.allow, true);
    assert.equal(result.value, 10);
});

test('state2 guard metadata wrapper clears a single rule and persists siblings', () => {
    const { ctx } = harness.env.state;
    harness.guard.clearAllRules();
    harness.guard.setRule('数据.HP', { typeLock: 'number' });
    harness.guard.setRule('数据.MP', { typeLock: 'number' });
    harness.guard.saveRulesToMeta();

    harness.guard.clearRule('数据.HP');

    assert.deepEqual(ctx.chatMetadata.LWB_RULES_V2, {
        '数据.MP': { typeLock: 'number' },
    });

    harness.guard.clearAllRules();
    ctx.chatMetadata.LWB_RULES_V2 = { '数据.MP': { typeLock: 'number' } };
    harness.guard.loadRulesFromMeta();

    assert.equal(harness.guard.validate('set', '数据.HP', '12', 0).value, '12');
    assert.equal(harness.guard.validate('set', '数据.MP', '12', 0).value, 12);
});
