/**
 * Security audit of the dependencies, split by what reaches the users.
 *
 * Only the bundles ship in the VSIX (`vsce package --no-dependencies`): the packages esbuild puts into
 * dist/extension.js are the ones users run. An advisory of `high` or `critical` severity for one of them fails;
 * the advisories of the build and test tools (svgo, webfont, eslint, ...) are listed but do not fail, they are
 * updated by Dependabot (see docs/MAINTENANCE.md).
 *
 * Usage: `bun run audit:shipped` (needs the network: it runs `bun audit --json`).
 * In GitHub Actions the result is also written to the job summary.
 */
const { spawnSync } = require('node:child_process');
const { appendFileSync } = require('node:fs');

const { bundledPackages, root } = require('./bundledPackages');

const FAILING = new Set(['critical', 'high']);

/**
 * Advisories accepted for a shipped package, with the reason and the date to look at them again.
 * GHSA id -> reason. Keep it empty unless an advisory does not apply to how the package is used.
 * @type {Record<string, string>}
 */
const ACCEPTED = {};

/** Whether a version is in an advisory's range; without bun's semver every installed version counts as affected */
const affects = (version, range) => {
  const semver = globalThis.Bun?.semver;
  if (!semver || !version) return true;
  try {
    return semver.satisfies(version, range);
  } catch {
    return true;
  }
};

const ghsa = (advisory) => /GHSA-[\w-]+/.exec(advisory.url ?? '')?.[0] ?? String(advisory.id);

const runAudit = () => {
  const audit = spawnSync('bun', ['audit', '--json'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32' });
  try {
    return JSON.parse(audit.stdout || '{}');
  } catch {
    console.error(audit.stdout, audit.stderr);
    throw new Error('bun audit did not give a JSON report (is the registry reachable?)');
  }
};

const main = () => {
  /** name -> versions */
  const shipped = new Map([...bundledPackages()].map(([name, copies]) => [name, new Set([...copies.keys()].filter(Boolean))]));

  /** @type {Record<string, Array<{ id: number; severity: string; title: string; url: string; vulnerable_versions: string }>>} */
  const report = runAudit();
  const shippedFindings = [];
  const toolCounts = { critical: 0, high: 0, low: 0, moderate: 0 };

  for (const [name, advisories] of Object.entries(report)) {
    if (!Array.isArray(advisories)) continue;
    for (const advisory of advisories) {
      const versions = [...(shipped.get(name) ?? [])];
      const hit = shipped.has(name) && (versions.length === 0 || versions.some((version) => affects(version, advisory.vulnerable_versions)));
      if (hit) shippedFindings.push({ ...advisory, accepted: ACCEPTED[ghsa(advisory)], name, versions });
      else toolCounts[advisory.severity] = (toolCounts[advisory.severity] ?? 0) + 1;
    }
  }

  const failing = shippedFindings.filter((finding) => FAILING.has(finding.severity) && !finding.accepted);
  const lines = [
    '### Dependency audit',
    '',
    `Shipped packages (bundled into dist/): ${[...shipped.keys()].sort().join(', ') || 'none'}`,
    '',
  ];
  if (shippedFindings.length === 0) {
    lines.push('No advisory for a shipped package.');
  } else {
    lines.push('| Package | Severity | Advisory | Status |', '|---|---|---|---|');
    for (const finding of shippedFindings) {
      const status = finding.accepted ? `accepted: ${finding.accepted}` : FAILING.has(finding.severity) ? '**fails**' : 'to update';
      lines.push(`| ${finding.name}@${finding.versions.join(',')} | ${finding.severity} | [${ghsa(finding)}](${finding.url}) ${finding.title} | ${status} |`);
    }
  }
  const tools = Object.entries(toolCounts).filter(([, count]) => count > 0).map(([severity, count]) => `${count} ${severity}`);
  lines.push('', `Build and test tools (not shipped): ${tools.length > 0 ? tools.join(', ') : 'no advisory'}.`);

  const text = lines.join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n\n`);

  for (const finding of failing) {
    console.log(`::error title=Vulnerable shipped dependency::${finding.name} ${finding.severity}: ${finding.title} (${finding.url})`);
  }
  if (failing.length > 0) process.exitCode = 1;
};

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

