import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { ProgressBar } from '@inkjs/ui';
import { getCurrentRun } from '../lib/state.js';
import {
  getModelClass,
  getEfficiencyRating,
  getBudgetPct,
  formatCost,
  formatElapsed,
  FLOORS,
} from '../lib/score.js';

export function ActiveRun({ run: initialRun }) {
  const { exit } = useApp();
  const [run, setRun] = useState(initialRun);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const latest = getCurrentRun();
      if (latest) setRun(latest);
      setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useInput((input) => {
    if (input === 'q') exit();
  });

  const flowMode = !run.budget;
  const mc = getModelClass(run.model);
  const pct = flowMode ? null : getBudgetPct(run.spent, run.budget);
  const efficiency = flowMode ? null : getEfficiencyRating(run.spent, run.budget);
  const barColor = !pct ? 'green' : pct >= 80 ? 'red' : pct >= 50 ? 'yellow' : 'green';

  return (
    <Box flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      <Box gap={2}>
        <Text bold color="yellow">
          ⛳ TokenGolf
        </Text>
        <Text color="gray">Active Run</Text>
        <Text color="gray" dimColor>
          {formatElapsed(run.startedAt)}
        </Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor="yellow"
        paddingX={1}
        paddingY={1}
        flexDirection="column"
        gap={1}
      >
        <Text bold color="white">
          {run.quest}
        </Text>

        <Box gap={3}>
          <Text>
            {mc.emoji} <Text color="cyan">{mc.name}</Text>
          </Text>
          {flowMode ? (
            <Text color="gray">Flow Mode</Text>
          ) : (
            <Text color="gray">
              Budget <Text color="green">${run.budget.toFixed(2)}</Text>
            </Text>
          )}
          <Text color="gray">
            Spent <Text color={barColor}>{formatCost(run.spent)}</Text>
          </Text>
          {!flowMode && (
            <Text color={efficiency.color}>
              {efficiency.emoji} {efficiency.label}
            </Text>
          )}
        </Box>

        {!flowMode && (
          <Box gap={1} alignItems="center">
            <Text color="gray">💰 </Text>
            <Box width={24}>
              <ProgressBar value={Math.min(pct, 100)} />
            </Box>
            <Text color={barColor}> {pct}%</Text>
          </Box>
        )}

        <Box flexDirection="column" gap={0} marginTop={1}>
          {FLOORS.map((floor, i) => {
            const n = i + 1;
            const done = n < run.floor;
            const active = n === run.floor;
            return (
              <Box key={i} gap={1}>
                <Text color={done ? 'green' : active ? 'yellow' : 'gray'}>
                  {done ? '✓' : active ? '▶' : '○'}
                </Text>
                <Text
                  color={done ? 'green' : active ? 'white' : 'gray'}
                  dimColor={!done && !active}
                >
                  Floor {n}: {floor}
                </Text>
              </Box>
            );
          })}
        </Box>

        <Box gap={3} marginTop={1}>
          <Text color="gray">
            Prompts <Text color="white">{run.promptCount || 0}</Text>
          </Text>
          <Text color="gray">
            Tools <Text color="white">{run.totalToolCalls || 0}</Text>
          </Text>
        </Box>

        {pct >= 80 && pct < 100 && (
          <Box borderStyle="single" borderColor="red" paddingX={1}>
            <Text color="red" bold>
              ⚠️ BUDGET WARNING — {formatCost(run.budget - run.spent)} left
            </Text>
          </Box>
        )}
      </Box>

      <Text color="gray" dimColor>
        tokengolf win [--spent 0.18] · tokengolf bust · q to close
      </Text>
    </Box>
  );
}
