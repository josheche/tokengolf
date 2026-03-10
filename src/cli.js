#!/usr/bin/env node
import { program } from 'commander';
import { render } from 'ink';
import React from 'react';

import { getCurrentRun, clearCurrentRun, updateCurrentRun } from './lib/state.js';
import { saveRun, getLastRun, getStats } from './lib/store.js';
import { autoDetectCost } from './lib/cost.js';
import { StartRun } from './components/StartRun.js';
import { ActiveRun } from './components/ActiveRun.js';
import { ScoreCard } from './components/ScoreCard.js';
import { StatsView } from './components/StatsView.js';

program.name('tokengolf').description('⛳ Gamify your Claude Code sessions').version('0.1.0');

program
  .command('start')
  .description('Declare a quest and start a new run')
  .action(() => {
    render(React.createElement(StartRun));
  });

program
  .command('status')
  .description('Show current run status')
  .action(() => {
    const run = getCurrentRun();
    if (!run) {
      console.log('No active run. Start one with: tokengolf start');
      process.exit(0);
    }
    render(React.createElement(ActiveRun, { run }));
  });

program
  .command('win')
  .description('Mark current run as complete (won)')
  .option('--spent <amount>', 'How much did you spend? (e.g. 0.18)')
  .action((opts) => {
    const run = getCurrentRun();
    if (!run) {
      console.log('No active run.');
      process.exit(1);
    }
    const detected = opts.spent ? null : autoDetectCost(run);
    const spent = opts.spent ? parseFloat(opts.spent) : (detected?.spent ?? run.spent);
    const completed = {
      ...run,
      spent,
      status: 'won',
      modelBreakdown: detected?.modelBreakdown ?? run.modelBreakdown ?? null,
      endedAt: new Date().toISOString(),
    };
    const saved = saveRun(completed);
    clearCurrentRun();
    render(React.createElement(ScoreCard, { run: saved }));
  });

program
  .command('bust')
  .description('Mark current run as budget busted (died)')
  .option('--spent <amount>', 'How much did you spend? (e.g. 0.45)')
  .action((opts) => {
    const run = getCurrentRun();
    if (!run) {
      console.log('No active run.');
      process.exit(1);
    }
    const detected = opts.spent ? null : autoDetectCost(run);
    const spent = opts.spent ? parseFloat(opts.spent) : (detected?.spent ?? run.budget + 0.01);
    const died = {
      ...run,
      spent,
      status: 'died',
      modelBreakdown: detected?.modelBreakdown ?? run.modelBreakdown ?? null,
      endedAt: new Date().toISOString(),
    };
    const saved = saveRun(died);
    clearCurrentRun();
    render(React.createElement(ScoreCard, { run: saved }));
  });

program
  .command('floor')
  .description('Advance to the next floor')
  .action(() => {
    const run = getCurrentRun();
    if (!run) {
      console.log('No active run.');
      process.exit(1);
    }
    const nextFloor = Math.min((run.floor || 1) + 1, run.totalFloors || 5);
    updateCurrentRun({ floor: nextFloor });
    console.log(`Floor ${nextFloor} / ${run.totalFloors}`);
  });

program
  .command('scorecard')
  .description('Show the last run scorecard')
  .action(() => {
    const run = getLastRun();
    if (!run) {
      console.log('No runs yet. Start one with: tokengolf start');
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
  .command('demo')
  .description('Show HUD examples for all game states (great for screenshots)')
  .action(async () => {
    const { runDemo } = await import('./lib/demo.js');
    runDemo();
  });

program
  .command('install')
  .description('Install Claude Code hooks into ~/.claude/settings.json')
  .action(async () => {
    const { installHooks } = await import('./lib/install.js');
    installHooks();
  });

program.parse();
