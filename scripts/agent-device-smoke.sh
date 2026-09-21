#!/usr/bin/env bash
# Print the intended Layer 5 Listen smoke commands.
# This is not a CI gate and does not require a booted device unless
# AGENT_DEVICE_SMOKE_RUN=1.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PLATFORM="${1:-}"
if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" ]]; then
  echo "Usage: $0 ios|android"
  echo "Prints the intended agent-device Listen smoke commands."
  echo "Set AGENT_DEVICE_SMOKE_RUN=1 to actually replay against a booted device."
  exit 1
fi

AD="$ROOT/node_modules/.bin/agent-device"
if [[ ! -x "$AD" ]]; then
  echo "agent-device is not installed from the lockfile."
  echo "From the repo root run: bun install   # or npm install"
  echo "Do not use npx -y agent-device@latest."
  exit 1
fi

AD_VERSION="$("$AD" --version 2>/dev/null || echo unknown)"
REPLAY="$ROOT/tests/agent-device/listen-smoke.${PLATFORM}.ad"
BATCH="$ROOT/tests/agent-device/listen-smoke.${PLATFORM}.json"
EXAMPLE_SCRIPT="example:${PLATFORM}"

echo "Pinned CLI: $AD ($AD_VERSION)"
echo
echo "Layer 5 Listen smoke ($PLATFORM) — intended human/agent commands:"
echo "  1. npm run test:agent-device:doctor"
echo "     # or: $AD doctor"
echo "  2. $AD boot --platform $PLATFORM"
echo "  3. npm run $EXAMPLE_SCRIPT"
echo "     # debug app must already be installed on the sim/emu"
echo "  4. $AD replay $REPLAY"
echo "     # or: $AD batch --platform $PLATFORM --steps-file $BATCH"
echo
echo "Cursor: enable MCP from .cursor/mcp.json, then ask the agent to drive"
echo "the example Listen flow (open → snapshot -i → Start listening → short hold → Stop)."
echo
echo "Silence contracts: iOS lasting silence is OK; Android start→hold≤3s→stop."
echo "This is UI smoke, not STT accuracy. Cloud CI VMs without devices cannot drive hardware."
echo

if [[ "${AGENT_DEVICE_SMOKE_RUN:-}" == "1" ]]; then
  mkdir -p "$ROOT/tests/agent-device/artifacts"
  echo "AGENT_DEVICE_SMOKE_RUN=1: replaying $REPLAY"
  exec "$AD" replay "$REPLAY"
fi

echo "Skipping replay (set AGENT_DEVICE_SMOKE_RUN=1 to run against a booted device)."
