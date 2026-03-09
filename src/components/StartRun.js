import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { TextInput, Select, ConfirmInput } from '@inkjs/ui';
import { setCurrentRun } from '../lib/state.js';
import { getModelClass, getEffortLevel, getModelBudgets, FLOORS } from '../lib/score.js';

const MODEL_OPTIONS = [
  { label: '⚔️  Sonnet  — Balanced. The default run.  [Normal]', value: 'claude-sonnet-4-6' },
  { label: '🏹 Haiku   — Glass cannon. Hard mode.     [Hard]', value: 'claude-haiku-4-5-20251001' },
  { label: '⚜️  Paladin — Opus plans, Sonnet executes. [Calculated]', value: 'opusplan' },
  { label: '🧙 Opus    — Powerful but expensive.      [Easy]', value: 'claude-opus-4-6' },
];

const EFFORT_OPTIONS_BASE = [
  { label: '⚖️  Medium — Balanced (Anthropic recommended for Sonnet)', value: 'medium' },
  { label: '🪶 Low    — Fewest tokens, fastest, cheapest', value: 'low' },
  { label: '🔥 High   — Most thorough, costs more', value: 'high' },
];
const EFFORT_OPTIONS_OPUS = [
  ...EFFORT_OPTIONS_BASE,
  { label: '💥 Max    — Absolute max, no token constraints (Opus only)', value: 'max' },
];
const getEffortOptions = (model) =>
  model.toLowerCase().includes('opus') && !model.toLowerCase().includes('opusplan')
    ? EFFORT_OPTIONS_OPUS
    : EFFORT_OPTIONS_BASE;

function getBudgetOptions(model) {
  const b = getModelBudgets(model);
  return [
    {
      label: `💎 Diamond  — $${b.diamond.toFixed(2)}   surgical micro-task`,
      value: String(b.diamond),
    },
    { label: `🥇 Gold     — $${b.gold.toFixed(2)}   focused small task`, value: String(b.gold) },
    { label: `🥈 Silver   — $${b.silver.toFixed(2)}   medium task`, value: String(b.silver) },
    { label: `🥉 Bronze   — $${b.bronze.toFixed(2)}  heavy / complex`, value: String(b.bronze) },
    { label: `✏️  Custom   — set your own`, value: 'custom' },
  ];
}

export function StartRun() {
  const { exit } = useApp();
  const [step, setStep] = useState('quest');
  const [quest, setQuest] = useState('');
  const [model, setModel] = useState('');
  const [effort, setEffort] = useState('medium');
  const [budgetVal, setBudgetVal] = useState('');

  const budget = parseFloat(budgetVal) || 0;
  const mc = model ? getModelClass(model) : null;

  return (
    <Box flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      <Box gap={2}>
        <Text bold color="yellow">
          ⛳ TokenGolf
        </Text>
        <Text color="gray">New Run</Text>
      </Box>

      <Box
        flexDirection="column"
        gap={1}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        paddingY={1}
      >
        {/* Quest */}
        <Box gap={2} alignItems="flex-start">
          <Text color={step === 'quest' ? 'cyan' : 'gray'}>📋 Quest </Text>
          {step === 'quest' ? (
            <TextInput
              placeholder="What are you shipping?"
              onSubmit={(v) => {
                if (v.trim()) {
                  setQuest(v.trim());
                  setStep('model');
                }
              }}
            />
          ) : (
            <Text color="white">{quest}</Text>
          )}
        </Box>

        {/* Model */}
        {step !== 'quest' && (
          <Box flexDirection="column" gap={0}>
            <Box gap={2}>
              <Text color={step === 'model' ? 'cyan' : 'gray'}>🎮 Class </Text>
              {step !== 'model' && (
                <Text color="white">
                  {mc?.emoji} {mc?.name} [{mc?.difficulty}]
                </Text>
              )}
            </Box>
            {step === 'model' && (
              <Select
                options={MODEL_OPTIONS}
                onChange={(v) => {
                  setModel(v);
                  if (v.toLowerCase().includes('haiku')) {
                    setEffort(null);
                    setStep('budget');
                  } else setStep('effort');
                }}
              />
            )}
          </Box>
        )}

        {/* Effort */}
        {(step === 'effort' || step === 'budget' || step === 'custom' || step === 'confirm') &&
          effort !== null && (
            <Box flexDirection="column" gap={0}>
              <Box gap={2}>
                <Text color={step === 'effort' ? 'cyan' : 'gray'}>⚡ Effort </Text>
                {step !== 'effort' && effort && (
                  <Text color="white">
                    {getEffortLevel(effort)?.emoji} {getEffortLevel(effort)?.label}
                  </Text>
                )}
              </Box>
              {step === 'effort' && (
                <Select
                  options={getEffortOptions(model)}
                  onChange={(v) => {
                    setEffort(v);
                    setStep('budget');
                  }}
                />
              )}
            </Box>
          )}

        {/* Budget */}
        {(step === 'budget' || step === 'custom' || step === 'confirm') && (
          <Box flexDirection="column" gap={0}>
            <Box gap={2}>
              <Text color={step === 'budget' || step === 'custom' ? 'cyan' : 'gray'}>
                💰 Budget{' '}
              </Text>
              {step === 'confirm' && <Text color="green">${budget.toFixed(2)}</Text>}
            </Box>
            {step === 'budget' && (
              <Select
                options={getBudgetOptions(model)}
                onChange={(v) => {
                  if (v === 'custom') {
                    setStep('custom');
                  } else {
                    setBudgetVal(v);
                    setStep('confirm');
                  }
                }}
              />
            )}
            {step === 'custom' && (
              <TextInput
                placeholder="Enter amount e.g. 0.50"
                onSubmit={(v) => {
                  const n = parseFloat(v);
                  if (!isNaN(n) && n > 0) {
                    setBudgetVal(String(n));
                    setStep('confirm');
                  }
                }}
              />
            )}
          </Box>
        )}

        {/* Confirm */}
        {step === 'confirm' && (
          <Box flexDirection="column" gap={1} marginTop={1}>
            <Box
              borderStyle="round"
              borderColor="yellow"
              paddingX={1}
              paddingY={1}
              flexDirection="column"
            >
              <Text bold color="yellow">
                Ready?
              </Text>
              <Text color="gray">
                Quest <Text color="white">{quest}</Text>
              </Text>
              <Text color="gray">
                Model{' '}
                <Text color="white">
                  {mc?.emoji} {mc?.name} [{mc?.difficulty}]
                </Text>
              </Text>
              {effort && (
                <Text color="gray">
                  Effort{' '}
                  <Text color="white">
                    {getEffortLevel(effort)?.emoji} {getEffortLevel(effort)?.label}
                  </Text>
                </Text>
              )}
              <Text color="gray">
                Budget <Text color="green">${budget.toFixed(2)}</Text>
              </Text>
            </Box>
            <Box gap={1}>
              <Text color="gray">Confirm? </Text>
              <ConfirmInput
                onConfirm={() => {
                  setCurrentRun({
                    quest,
                    model,
                    budget,
                    effort,
                    spent: 0,
                    status: 'active',
                    floor: 1,
                    totalFloors: FLOORS.length,
                    promptCount: 0,
                    totalToolCalls: 0,
                    toolCalls: {},
                    startedAt: new Date().toISOString(),
                  });
                  exit();
                }}
                onCancel={() => setStep('quest')}
              />
            </Box>
          </Box>
        )}
      </Box>

      {step !== 'confirm' && (
        <Text color="gray" dimColor>
          Use ↑↓ to navigate, Enter to select
        </Text>
      )}
      {step === 'confirm' && (
        <Text color="gray" dimColor>
          After confirming, work normally in Claude Code. Run `tokengolf win` or `tokengolf bust`
          when done.
        </Text>
      )}
    </Box>
  );
}
