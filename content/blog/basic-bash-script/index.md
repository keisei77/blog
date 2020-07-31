---
title: bash 脚本入门
date: '2020-07-31 20:37'
description: '学习基本的 bash 脚本来提高自动化能力'
tags: ['Bash']
---

### 前言

最近深感能力不足，于是开始了每日的 leetcode 刷题。为了以后复习方便，单独开了一个[仓库](https://github.com/keisei77/algorithm-practice)进行存档。每道题目为单个 md 文件，commit 记录为题目的名称 `:white_check_mark: 347. Top K Frequent Elements.md`。

### 建档步骤枯燥且重复

起初决定以每道题目的名称作为文件名，内容的标题也是题目名，即 `# 347. Top K Frequent Elements`。

由于是新增文件，所以 `git status` 输出的内容为：

```txt
On branch master
Your branch is up to date with 'origin/master'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)

        347. Top K Frequent Elements.md

nothing added to commit but untracked files present (use "git add" to track)
```

这种格式的文本显然很难去提取当前需要提交的文件名，所以需要去了解 `git status` 有没有一个标准化的输出格式。

### 探索解决方案

在考虑通过脚本解决上述问题时，考虑到新增和提交是两个步骤，所以分为两个独立的脚本。

#### 新增脚本

首先新增文件的脚本比较简单，就是通过输入文件名，以此来生成文件和标题：

```bash
#!/bin/bash

set -e

problem=$@

if [[ $@ == "" ]]; then
    echo "Please enter the problem name."
else
    echo "# $problem" >> "$problem.md"
fi
```

由于对 `bash` 还是比较陌生，所以可能水平有些次。不过虽然看起来很简单，但是这里有一个技巧：就是 `$@` 会拿到执行该脚本时传入的所有 arguments。为什么不能拿 `$1` 来获取题目呢？这就是遇到的一个坑点：在执行脚本时跑的命令是：`./bin/add_problem.sh 347. Top K Frequent Elements.md`，结果 `$1` 的值为 `347.` 而不是预期的整个标题内容。

#### 提交脚本

通过获取当前待提交的文件名，并提交推送至远程仓库：

```bash
#!/bin/bash

set -e
# https://stackoverflow.com/a/5238537/6796500
file=$(git status --porcelain | sed s/^...//)

if [[ $file == "" ]]; then
    echo "No files changed."
else
    git add .
    git commit -m ":white_check_mark: $file"
    git push
fi
```

这里最重要的一点就是拿到所有变更的文件名，经过搜索发现果然有人提过这个需求：<https://stackoverflow.com/a/5238537/6796500>。

那么就好办了，直接把拿到的文件名加入到 commit message 中，然后执行 git 操作。

### 总结

虽然目前基本满足了个人需求，但是这里还有一点遗憾，就是 `git status` 可以拿到多个变更文件。本来可以通过 `for loop` 来提交多个 commit，但是还是遇到了先前的问题：

```
347. Top K Frequent Elements.md
78. Subsets.md
```

这里变更了两个文件：`$files`，但是 `for $file in $files` 得到的 `$file` 却是：`347.`，`Top`，`K` 等。这是目前待解决的问题。如有解决方案，还请帮忙提供解决方式：<https://github.com/keisei77/algorithm-practice/issues/1>，不胜感激。

通过写简单的脚本，确实提高了部分效率，也对 bash 的使用有了新的认知。
