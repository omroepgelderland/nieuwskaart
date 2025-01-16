#!/bin/bash
# Updatescript voor de productieomgeving.

git pull --rebase || exit 1
