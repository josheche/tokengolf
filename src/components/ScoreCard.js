import React, { useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import {
  getTier,
  getModelClass,
  getEffortLevel,
  getEfficiencyRating,
  getBudgetPct,
  formatCost,
  getHaikuPct,
  getOpusPct,
  MODEL_CLASSES,
} from '../lib/score.js';
import { ACCENT_BORDER, ACCENT_PADDING } from '../lib/ui.js';

export function ScoreCard({ run }) {
  const { exit } = useApp();
  const won = run.status === 'won';

  useInput((input) => {
    if (input === 'q') exit();
  });

  useEffect(() => {
    const t = setTimeout(() => exit(), 60000);
    return () => clearTimeout(t);
  }, [exit]);

  const tier = getTier(run.spent, run.model);
  const mc = getModelClass(run.model);
  // Implicit Gold-tier budgets for flow mode
  const FLOW_BUDGETS = {
    'claude-haiku-4-5-20251001': 0.4,
    'claude-sonnet-4-6': 1.5,
    'claude-opus-4-6': 7.5,
    opusplan: 7.5,
  };
  const effBudget = run.budget || FLOW_BUDGETS[run.model] || 1.5;
  const flowMode = !run.budget;
  const efficiency = getEfficiencyRating(run.spent, effBudget);
  const pct = getBudgetPct(run.spent, effBudget);
  const haikuPct = getHaikuPct(run.modelBreakdown, run.spent);
  const opusPct = getOpusPct(run.modelBreakdown, run.spent);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
      {/* Big status header */}
      <Box
        borderStyle={ACCENT_BORDER}
        borderColor={won ? 'yellow' : 'red'}
        borderRight={false}
        borderTop={false}
        borderBottom={false}
        paddingLeft={ACCENT_PADDING}
        paddingY={1}
        flexDirection="column"
        gap={1}
      >
        <Text bold color={won ? 'yellow' : 'red'}>
          {won ? '🏆  SESSION COMPLETE' : '💀  BUDGET BUSTED'}
        </Text>

        <Text color="white" bold>
          {run.quest ?? <Text color="gray">Flow Mode</Text>}
        </Text>

        {/* Score row */}
        <Box gap={4} flexWrap="wrap" marginTop={1}>
          <Box flexDirection="column">
            <Text color="gray" dimColor>
              SPENT
            </Text>
            <Text bold color={won ? 'green' : 'red'}>
              {formatCost(run.spent)}
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text color="gray" dimColor>
              BUDGET{flowMode ? '*' : ''}
            </Text>
            <Text color="white">${effBudget.toFixed(2)}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color="gray" dimColor>
              USED
            </Text>
            <Text color={pct > 100 ? 'red' : pct > 80 ? 'yellow' : 'green'}>{pct}%</Text>
          </Box>
          <Box flexDirection="column">
            <Text color="gray" dimColor>
              MODEL
            </Text>
            <Text color="cyan">
              {mc.emoji} {mc.name}
              {[
                run.effort && run.effort !== 'medium' ? getEffortLevel(run.effort)?.label : null,
                run.fastMode ? 'Fast' : null,
              ]
                .filter(Boolean)
                .map((s) => `·${s}`)
                .join('')}
            </Text>
          </Box>
          {run.effort && (
            <Box flexDirection="column">
              <Text color="gray" dimColor>
                EFFORT
              </Text>
              <Text color={getEffortLevel(run.effort)?.color}>
                {getEffortLevel(run.effort)?.emoji} {getEffortLevel(run.effort)?.label}
              </Text>
            </Box>
          )}
          {run.fastMode && (
            <Box flexDirection="column">
              <Text color="gray" dimColor>
                MODE
              </Text>
              <Text color="yellow">↯ Fast</Text>
            </Box>
          )}
          <Box flexDirection="column">
            <Text color="gray" dimColor>
              TIER
            </Text>
            <Text color={tier.color}>
              {tier.emoji} {tier.label}
            </Text>
          </Box>
        </Box>

        {/* Efficiency */}
        {efficiency && (
          <Box gap={2}>
            <Text bold color={efficiency.color}>
              {efficiency.emoji} {efficiency.label}
            </Text>
          </Box>
        )}

        {/* Achievements */}
        {run.achievements?.length > 0 && (
          <Box flexDirection="column" gap={0} marginTop={1}>
            <Text color="gray" dimColor>
              Achievements unlocked:
            </Text>
            {run.achievements.map((a, i) => (
              <Text key={i} color="yellow">
                {' '}
                {a.emoji} {a.label}
              </Text>
            ))}
          </Box>
        )}

        {/* Extended thinking */}
        {run.thinkingInvocations > 0 && (
          <Box flexDirection="column" gap={0} marginTop={1}>
            <Box gap={3} alignItems="center">
              <Text color="gray" dimColor>
                Extended thinking:
              </Text>
              <Text color="magenta">🔮 {run.thinkingInvocations}× invoked</Text>
            </Box>
          </Box>
        )}

        {/* Model breakdown */}
        {run.modelBreakdown && Object.keys(run.modelBreakdown).length > 0 && (
          <Box flexDirection="column" gap={0} marginTop={1}>
            <Box gap={2} alignItems="center">
              <Text color="gray" dimColor>
                Model usage:
              </Text>
              {haikuPct !== null && (
                <Text color={haikuPct >= 75 ? 'magenta' : haikuPct >= 50 ? 'cyan' : 'yellow'}>
                  🏹 {haikuPct}% Haiku
                </Text>
              )}
              {mc === MODEL_CLASSES.opusplan && opusPct !== null && (
                <Text color="yellow">⚜️ {opusPct}% Opus (planning)</Text>
              )}
            </Box>
            <Box gap={3} flexWrap="wrap">
              {Object.entries(run.modelBreakdown).map(([model, cost]) => {
                const m = model.toLowerCase();
                const short = m.includes('haiku')
                  ? 'Haiku'
                  : m.includes('sonnet')
                    ? 'Sonnet'
                    : m.includes('opusplan') || m.includes('paladin')
                      ? 'Paladin'
                      : 'Opus';
                const pctOfTotal = Math.round((cost / run.spent) * 100);
                return (
                  <Text key={model} color="gray">
                    {short} <Text color="white">{pctOfTotal}%</Text>{' '}
                    <Text dimColor>{formatCost(cost)}</Text>
                  </Text>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Tool breakdown */}
        {run.toolCalls && Object.keys(run.toolCalls).length > 0 && (
          <Box flexDirection="column" gap={0} marginTop={1}>
            <Text color="gray" dimColor>
              Tool calls:
            </Text>
            <Box gap={2} flexWrap="wrap">
              {Object.entries(run.toolCalls).map(([tool, count]) => (
                <Text key={tool} color="gray">
                  <Text color="white">{tool}</Text> ×{count}
                </Text>
              ))}
            </Box>
          </Box>
        )}

        {/* Death tip */}
        {!won && run.budget && (
          <Box marginTop={1} flexDirection="column" paddingLeft={1}>
            <Text color="red" bold>
              Cause of death: Budget exceeded by {formatCost(run.spent - run.budget)}
            </Text>
            <Text color="gray" dimColor>
              Tip: Use Read with line ranges instead of full file reads.
            </Text>
          </Box>
        )}
      </Box>

      <Box gap={2}>
        <Text color="gray" dimColor>
          tokengolf start — run again
        </Text>
        <Text color="gray" dimColor>
          ·
        </Text>
        <Text color="gray" dimColor>
          tokengolf stats — career stats
        </Text>
        <Text color="gray" dimColor>
          ·
        </Text>
        <Text color="gray" dimColor>
          q to exit
        </Text>
      </Box>
    </Box>
  );
}
