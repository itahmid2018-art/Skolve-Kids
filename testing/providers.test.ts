/**
 * Skolve Multi-Provider AI Diagnostic Test Runner
 *
 * Validates availability, credentials, and network connectivity across all
 * supported cloud and local AI providers:
 * - Google Gemini
 * - OpenAI
 * - Anthropic Claude
 * - OpenRouter (Open MoE gateway)
 * - Hugging Face Inference
 * - Ollama (Local MoE/Dense)
 * - llama.cpp Server (Local/Remote)
 *
 * Automatically records structured error and diagnostic logs to:
 * `testing/errors/error_log_<timestamp>.json`
 * `testing/errors/latest_test_run.json`
 * `testing/errors/latest_summary.md`
 */

import dotenv from 'dotenv';
import path from 'path';
import { aiGateway } from '../server/ai.js';
import { errorLogger } from '../server/logger.js';

dotenv.config();

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 SKOLVE MULTI-PROVIDER AI DIAGNOSTIC TEST SUITE');
  console.log('================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Testing provider endpoints & checking credentials...\n');

  const record = await aiGateway.testAllProviders();

  console.log('----------------------------------------------------------------');
  console.log('RESULTS SUMMARY:');
  console.log(`Total Providers Tested: ${record.totalTested}`);
  console.log(`✅ Passed:  ${record.passedCount}`);
  console.log(`❌ Failed:  ${record.failedCount}`);
  console.log(`⚠️  Skipped: ${record.skippedCount}`);
  console.log('----------------------------------------------------------------\n');

  console.log('DETAILED BREAKDOWN:');
  record.results.forEach((r, idx) => {
    const symbol = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⚠️ ';
    const latency = r.latencyMs !== undefined ? `${r.latencyMs}ms` : 'N/A';
    console.log(`${idx + 1}. [${r.name}] ${symbol} ${r.status.toUpperCase()} (${latency})`);
    console.log(`   Model:   ${r.model || 'N/A'}`);
    if (r.endpoint) {
      console.log(`   Endpoint:${r.endpoint}`);
    }
    console.log(`   Message: ${r.message}`);
    if (r.errorDetails) {
      console.log(`   Details: ${r.errorDetails.split('\n')[0]}`);
    }
    if (r.suggestions && r.suggestions.length > 0) {
      console.log(`   Remedy:  ${r.suggestions[0]}`);
    }
    console.log('');
  });

  const latestLog = errorLogger.getLatestRun();
  console.log('================================================================');
  console.log('📁 LOGGING ARTIFACTS SAVED:');
  console.log(`- Timestamped Archive: testing/errors/error_log_${record.timestamp.replace(/[:.]/g, '-')}.json`);
  console.log(`- Latest Run Pointer:  testing/errors/latest_test_run.json`);
  console.log(`- Markdown Report:     testing/errors/latest_summary.md`);
  console.log('================================================================\n');

  // Active provider status
  const status = await aiGateway.getProvidersStatus();
  console.log(`🎯 Active Provider Resolved by Skolve: [${status.activeProvider.toUpperCase()}]\n`);
}

runTestSuite().catch(err => {
  console.error('Fatal test runner execution failure:', err);
  process.exit(1);
});
