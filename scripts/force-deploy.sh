#!/bin/sh

git config user.email "keisei.jia@gmail.com";
git config user.name "keisei77";
git fetch origin;
git checkout gh-pages;
git fetch origin gh-pages;
rm -rf public/*;
git add -u;
git commit -m ":package: force update";
git push --force origin gh-pages;
git checkout master;