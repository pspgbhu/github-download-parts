[English](./README.md) | 简体中文

# github-download-parts

[![npm package](https://img.shields.io/npm/v/github-download-parts.svg)](https://www.npmjs.org/package/github-download-parts)
[![NPM downloads](http://img.shields.io/npm/dm/github-download-parts.svg)](https://npmjs.org/package/github-download-parts)
[![GitHub issues](https://img.shields.io/github/issues/pspgbhu/github-download-parts.svg)](https://github.com/pspgbhu/github-download-parts/issues)
[![Build Status](https://travis-ci.org/pspgbhu/github-download-parts.svg?branch=master)](https://travis-ci.org/pspgbhu/github-download-parts)

它可以下载 Github 仓库的中部分文件或文件夹

## 指南

从 Github 仓库中下载一个文件夹或者单文件

```js
const repo = require('github-download-parts');

// 下载单文件
// 将会把 index.js 文件下载到本地的 target 文件夹中
repo('pspgbhu/github-download-parts', 'target', 'index.js')
  .then(() => {
    console.log('download success');
  })
  .catch(() => {
    console.log('download error');
  });

// 下载一个文件夹
// 将会把 test 文件夹下的全部文件都下载到本地的 target 文件夹中
repo('pspgbhu/github-download-parts', 'target', 'test')
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

- **options** `<object>`
  - **username** `<string>`: Github 的用户名
  - **repository** `<string>`: 仓库的名称.
  - **repo** `<string>`: `username` 和 `repository` 属性的简写，格式为 `"${username}/${repository}"`
  - **target** `<string>`: 下载的文件将会被创建至该本地文件夹内
  - **pathname** `<string>`: Github 中将要被下载的文件或者文件夹的一个相对路径

- **target** `<string>`

  下载的文件将会被创建至该本地文件夹内

- **pathname** `<string>`

  Github 中将要被下载的文件或者文件夹的一个相对路径

## 限制

通常情况下它不会影响到正常的使用。

由于 Github API 的限制，每个 IP 只允许每小时 60 次的 API 请求，因此 **每个 IP 每小时只能进行 60 次的下载**

[了解更多关于 GitHub API 速率的限制](https://developer.github.com/v3/#rate-limiting)