#!/usr/bin/env bash

if [[ -n "$GIT_USER_EMAIL" ]]; then
  git config --global user.email "$GIT_USER_EMAIL"
fi

## Running passed command
if [[ "$1" ]]; then
	eval "$@"
fi