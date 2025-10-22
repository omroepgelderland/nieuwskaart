#!/bin/bash

function delete_dist_bestanden() {
    rm -rf \
        public/*
}

projectdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$projectdir" || exit 1

# Node environment
if [ ! -f "$HOME/.nvm/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi
export NODE_ENV=development
# shellcheck disable=SC1091
. "$HOME/.nvm/nvm.sh"
nvm install node || exit 1
npm install npm@latest -g || exit 1

# npm packages
npm install || exit 1
npx update-browserslist-db@latest || exit 1
npm audit fix

# webpack compilen
delete_dist_bestanden
npx eslint src/ts/ || exit 1
npx tsc --noEmit || exit 1
# git ls-files -z | grep -zP '\.(js|ts)$' | xargs -0 npx eslint || exit 1
git ls-files -z | grep -zP '\.(ts|js|css|scss|html)$' | xargs -0 npx prettier --write || exit 1
npx webpack --config "webpack.dev.js" || exit 1
