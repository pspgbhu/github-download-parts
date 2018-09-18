[English](./README.md) | 简体中文

# github-download-parts

[![npm package](https://img.shields.io/npm/v/github-download-parts.svg)](https://www.npmjs.org/package/github-download-parts)
[![NPM downloads](http://img.shields.io/npm/dm/github-download-parts.svg)](https://npmjs.org/package/github-download-parts)
[![GitHub issues](https://img.shields.io/github/issues/pspgbhu/github-download-parts.svg)](https://github.com/pspgbhu/github-download-parts/issues)
[![Build Status](https://travis-ci.org/pspgbhu/github-download-parts.svg?branch=master)](https://travis-ci.org/pspgbhu/github-download-parts)

它可以下载 Github 仓库的中部分文件或文件夹

## 使用

- 下载单个文件

```js
const repo = require('github-download-parts');

// 将会把 index.js 文件下载到本地的 target 文件夹中
repo('pspgbhu/github-download-parts', 'target', 'index.js')
  .then(() => {
    console.log('download success');
  })
  .catch(() => {
    console.log('download error');
  }
```

- 下载一个文件夹

```js
const repo = require('github-download-parts');

// 将会把 test 文件夹下的全部文件都下载到本地的 target 文件夹中
repo('pspgbhu/github-download-parts', 'target', 'test')
  .then(() => {
    console.log('download success');
  })
  .catch(() => {
    console.log('download error');
  });
```

- 下载完整的仓库

```js
const repo = require('github-download-parts');

// 将整个仓库都下载到本地的 target 文件夹中
repo('pspgbhu/github-download-parts', 'target')
  .then(() => {
    console.log('download success');
  })
  .catch(() => {
    console.log('download error');
  });
```

## API

### repo(options [, target ,pathname])

- **options** `<string>`

  可以输入一个字符串作为参数，格式为 `"${username}/${repository}"`

- **target** `<string>`

  下载的文件将会被创建至该本地文件夹内

- **pathname** `<string>`

  被下载文件在 Github 仓库中的相对地址

或者，你可以使用一个对象来作为 `options` 参数

- **options** `<object>`
  - **username** `<string>`: Github 的用户名
  - **repository** `<string>`: 仓库的名称.
  - **repo** `<string>`: `username` 和 `repository` 属性的简写，格式为 `"${username}/${repository}"`
  - **target** `<string>`: 下载的文件将会被创建至该本地文件夹内
  - **pathname** `<string>`: 被下载文件在 Github 仓库中的相对地址

## CLI

### 安装

```bash
# 全局安装
$ npm i -g github-download-parts

# 查看 github-download-parts cli 更多帮助信息
$ repo -h
```

### 示例

- 从 Github 仓库中下载文件或文件夹

```bash
$ repo -r "username/repository" -t local_folder -p target_file.js
```

- 下载整个仓库

```bash
$ repo -r "username/repository" -t local_folder
```

### 选项参数

- `-r --repo <repo>`: Github 仓库, 格式是 `"${username}/${repository}"`

- `-t --target <dir>`:  下载的文件将会被创建至该本地文件夹内

- `-p --pathname <path>`: 被下载文件在 Github 仓库中的相对地址

## 限制

通常情况下它不会影响到正常的使用。

由于 Github API 的限制，每个 IP 只允许每小时 60 次的 API 请求，因此 **每个 IP 每小时只能进行 60 次的下载**

[了解更多关于 GitHub API 速率的限制](https://developer.github.com/v3/#rate-limiting)
