#!/usr/bin/env bash
# Copyright © 2026 Apple Inc. and the Pkl project authors. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Builds the grammar and playground, serves the playground with live reload,
# and rebuilds when the sources change.
#
# Usage: npm run playground [-- <live-server options>]
#
# For example, `npm run playground -- --port=8081 --no-browser`.
set -euo pipefail

cd "$(dirname "$0")/.."

# Make `live-server` and `onchange` available when the script is run outside of `npm run`.
export PATH="$PWD/node_modules/.bin:$PATH"

# Stop the server and watchers when this script exits.
pids=()
cleanup() {
  trap - EXIT INT TERM
  if [ "${#pids[@]}" -gt 0 ]; then
    kill "${pids[@]}" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

npm run build
npm run build:playground

# Serve the playground; `live-server` reloads the page whenever the build output changes.
live-server build/playground --wait=300 "$@" &
pids+=($!)

# Grammar sources: regenerate the grammar (without `clean`, so that a failed build doesn't delete
# the previous output), then rebuild the playground.
onchange 'pkl/**/*.pkl' -- bash -c 'npm run build:pkl && npm run build:playground' &
pids+=($!)

# Playground sources.
onchange 'playground/**' 'scripts/build-playground.mjs' -- npm run build:playground &
pids+=($!)

wait
