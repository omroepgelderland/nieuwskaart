#!/bin/bash

function delete_dist_bestanden() {
    rm -rf \
        public/*
}

set -euo pipefail

projectdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$projectdir"

# Node environment
if [ ! -f "$HOME/.nvm/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi
export NODE_ENV=development
# shellcheck disable=SC1091
. "$HOME/.nvm/nvm.sh"
nvm install node
npm install npm@latest -g

# npm packages
npm install
npm update update-browserslist-db
npx update-browserslist-db@latest
npm audit fix

# webpack compilen
delete_dist_bestanden
npx eslint src/ts/
npx tsc --noEmit
# git ls-files -z | grep -zP '\.(js|ts)$' | xargs -0 npx eslint
git ls-files -z | grep -zP '\.(ts|js|css|scss|html)$' | xargs -0 npx prettier --write
npx webpack --config "webpack.dev.js"
