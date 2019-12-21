#!/usr/bin/bash

git config user.email "keisei.jia@gmail.com";
git config user.name "keisei77";
echo "start git process";
git fetch origin;
git checkout gh-pages;
git pull;
git rm -rf .;
git clean -fxd;
git add -u;
git commit -m ":package: force update";
git push --force origin gh-pages;
git checkout master;