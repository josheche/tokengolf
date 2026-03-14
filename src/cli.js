#!/usr/bin/env node
import { program } from 'commander';
import { render } from 'ink';
import React from 'react';

import { getLastRun, getStats } from './lib/store.js';
import { getConfig, setConfig, VALID_EMOTION_MODES } from './lib/config.js';
import { ScoreCard } from './components/ScoreCard.js';
import { StatsView } from './components/StatsView.js';

program.name('tokengolf').description('⛳ Gamify your Claude Code sessions').version('0.1.0');

program
  .command('scorecard')
  .description('Show the last run scorecard')
  .action(() => {
    const run = getLastRun();
    if (!run) {
      console.log('No runs yet. Open Claude Code — sessions are tracked automatically.');
      process.exit(0);
    }
    render(React.createElement(ScoreCard, { run }));
  });

program
  .command('stats')
  .description('Show career stats dashboard')
  .action(() => {
    render(React.createElement(StatsView, { stats: getStats() }));
  });

program
  .command('demo [component]')
  .description('Show UI demos — all, hud, scorecard, stats')
  .option('-i, --index <n>', 'Show only the Nth variant (0-based)')
  .action(async (component, opts) => {
    const idx = opts.index != null ? parseInt(opts.index) : undefined;
    const c = (component || 'all').toLowerCase();

    if (c === 'all') {
      const { runDemo } = await import('./lib/demo.js');
      runDemo();
      const { runAnsiScoreCardDemo } = await import('./lib/demo-ansi-scorecard.js');
      runAnsiScoreCardDemo(idx);
      const { runScoreCardDemo } = await import('./lib/demo-scorecard.js');
      await runScoreCardDemo(idx);
      const { runStatsDemo } = await import('./lib/demo-stats.js');
      await runStatsDemo(idx);
      process.exit(0);
    }

    if (c === 'hud') {
      const { runDemo } = await import('./lib/demo.js');
      runDemo();
      return;
    }

    if (c === 'scorecard') {
      const { runAnsiScoreCardDemo } = await import('./lib/demo-ansi-scorecard.js');
      runAnsiScoreCardDemo(idx);
      const { runScoreCardDemo } = await import('./lib/demo-scorecard.js');
      await runScoreCardDemo(idx);
      process.exit(0);
    }

    if (c === 'stats') {
      const { runStatsDemo } = await import('./lib/demo-stats.js');
      await runStatsDemo(idx);
      process.exit(0);
    }

    console.log('Unknown demo component. Choose: all, hud, scorecard, stats');
    process.exit(1);
  });

program
  .command('config [key] [value]')
  .description('View or set config values (e.g. tokengolf config emotions emoji)')
  .action((key, value) => {
    const config = getConfig();
    if (!key) {
      for (const [k, v] of Object.entries(config)) console.log(`${k}: ${v}`);
      return;
    }
    if (key === 'emotions') {
      if (!value) {
        console.log(`emotionMode: ${config.emotionMode || 'off'}`);
        return;
      }
      if (!VALID_EMOTION_MODES.includes(value)) {
        console.log(`Invalid emotion mode: ${value}`);
        console.log(`Valid modes: ${VALID_EMOTION_MODES.join(', ')}`);
        process.exit(1);
      }
      setConfig('emotionMode', value);
      console.log(`emotionMode: ${value}`);
      return;
    }
    console.log(`Unknown config key: ${key}`);
    process.exit(1);
  });

program
  .command('install')
  .description('Install Claude Code hooks into ~/.claude/settings.json')
  .action(async () => {
    const { installHooks } = await import('./lib/install.js');
    installHooks();
  });

program.parse();
