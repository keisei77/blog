#!/bin/sh

git stash;
git checkout gh-pages;
git fetch origin gh-pages;
rm -rf public/*;
git add -A;
git commit -m ":package: force update";
git push --force origin gh-pages;
git checkout master;
git stash pop;