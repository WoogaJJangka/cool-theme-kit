import { strict as assert } from 'node:assert';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSON_FILE_NAME } from 'src/helpers/constants';
import { FileCopies } from 'src/helpers/fileCopies';
import { writeFileAtomicAsync } from 'src/helpers/fsUtils';
import { IconThemeGenerator } from 'src/icons/generators/IconThemeGenerator';

const repoRoot = join(__dirname, '..', '..');

describe('FileCopies', () => {
  let directory: string;
  const source = (name: string, content: string) => {
    const path = join(directory, 'source', name);
    mkdirSync(join(directory, 'source'), { recursive: true });
    writeFileSync(path, content);
    return path;
  };
  const target = (name: string) => join(directory, 'target', name);

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'afi-copies-'));
  });
  afterEach(() => rmSync(directory, { force: true, recursive: true }));

  it('writes each target with the changed content, and only the targets whose content differs', async () => {
    const copies = new FileCopies();
    for (let index = 0; index < 40; index++) {
      copies.add({ change: (svg) => svg.toUpperCase(), source: source(`${index}.svg`, `<svg id="${index}"/>`), target: target(`${index}.svg`) });
    }
    assert.equal(copies.size, 40);
    assert.equal(await copies.run(), 40);
    assert.equal(copies.size, 0, 'a run empties the copies');
    assert.equal(readFileSync(target('7.svg'), 'utf8'), '<SVG ID="7"/>');
    assert.deepEqual(readdirSync(join(directory, 'target')).filter((file) => file.endsWith('.tmp')), [], 'no temporary file left');

    const written = statSync(target('7.svg')).mtimeMs;
    copies.add({ change: (svg) => svg.toUpperCase(), source: join(directory, 'source', '7.svg'), target: target('7.svg') });
    copies.add({ change: (svg) => svg, source: join(directory, 'source', '8.svg'), target: target('8.svg') });
    assert.equal(await copies.run(), 1, 'only the target with another content is written');
    assert.equal(statSync(target('7.svg')).mtimeMs, written);
  });

  it('keeps the last copy to a target, as writing it twice did', async () => {
    const copies = new FileCopies();
    copies.add({ change: (svg) => svg, source: source('a.svg', 'first'), target: target('icon.svg') });
    copies.add({ change: (svg) => svg, source: source('b.svg', 'second'), target: target('icon.svg') });
    assert.equal(copies.size, 1);
    await copies.run();
    assert.equal(readFileSync(target('icon.svg'), 'utf8'), 'second');
  });

  it('copies every file with fewer workers than files, and with more', async () => {
    for (const concurrency of [1, 3, 100]) {
      const copies = new FileCopies();
      for (let index = 0; index < 10; index++) {
        copies.add({ change: (svg) => `${svg}-${concurrency}`, source: source(`${index}.svg`, String(index)), target: target(`${index}.svg`) });
      }
      assert.equal(await copies.run(concurrency), 10);
      assert.equal(readFileSync(target('9.svg'), 'utf8'), `9-${concurrency}`);
    }
    assert.equal(await new FileCopies().run(), 0, 'nothing to copy');
  });

  it('skips an optional source that cannot be read, and stops at a required one', async () => {
    const copies = new FileCopies();
    copies.add({ change: (svg) => svg, optional: true, source: join(directory, 'missing.svg'), target: target('optional.svg') });
    copies.add({ change: (svg) => svg, source: source('there.svg', 'there'), target: target('there.svg') });
    assert.equal(await copies.run(), 1);
    assert.equal(existsSync(target('optional.svg')), false);

    copies.add({ change: (svg) => svg, source: join(directory, 'missing.svg'), target: target('required.svg') });
    await assert.rejects(copies.run(), (error: NodeJS.ErrnoException) => error.code === 'ENOENT');
  });

  it('writes nothing again with writeFileAtomicAsync when the content is the same', async () => {
    const path = join(directory, 'nested', 'theme.json');
    assert.equal(await writeFileAtomicAsync(path, '{"a":1}'), true);
    assert.equal(await writeFileAtomicAsync(path, '{"a":1}'), false);
    assert.equal(await writeFileAtomicAsync(path, Buffer.from('{"a":2}')), true);
    assert.equal(readFileSync(path, 'utf8'), '{"a":2}');
    assert.deepEqual(readdirSync(join(directory, 'nested')), ['theme.json']);
  });
});

describe('IconThemeGenerator without blocking', () => {
  let dist: string;
  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), 'afi-unblocked-'));
  });
  afterEach(() => rmSync(dist, { force: true, recursive: true }));

  it('lets the extension host run while the icons are written, and writes the theme json after them', async () => {
    // a timer of the event loop: with the synchronous file system it did not run until the theme was written
    let turns = 0;
    let running = true;
    const turn = () => {
      turns++;
      if (running) setImmediate(turn);
    };
    setImmediate(turn);

    const generation = new IconThemeGenerator({}, { dist, iconGenerator: join(repoRoot, 'iconGenerator') }).createJsonTheme();
    assert.equal(existsSync(join(dist, JSON_FILE_NAME)), false, 'the json is written after the icons');
    await generation;
    running = false;

    assert.ok(turns > 20, `the event loop ran ${turns} times while some 2,500 icons were written`);
    const theme = JSON.parse(readFileSync(join(dist, JSON_FILE_NAME), 'utf8')) as { iconDefinitions: Record<string, { iconPath?: string }> };
    const missing = Object.values(theme.iconDefinitions)
      // `./../dist/files/x.svg`: next to the theme json
      .flatMap((definition) => (definition.iconPath ? [definition.iconPath.replace(/^\.\/\.\.\/dist\//, '')] : []))
      .filter((path) => !existsSync(join(dist, path)));
    assert.deepEqual(missing.slice(0, 5), [], 'every icon of the theme is written');
  });
});
