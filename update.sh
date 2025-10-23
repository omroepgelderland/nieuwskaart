#!/bin/bash
# Updatescript voor de productieomgeving.

set -euo pipefail

git pull --rebase
