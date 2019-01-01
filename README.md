English | [简体中文](./README_CN.md)

# github-download-parts

[![npm package](https://img.shields.io/npm/v/github-download-parts.svg)](https://www.npmjs.org/package/github-download-parts)
[![NPM downloads](http://img.shields.io/npm/dm/github-download-parts.svg)](https://npmjs.org/package/github-download-parts)
[![GitHub issues](https://img.shields.io/github/issues/pspgbhu/github-download-parts.svg)](https://github.com/pspgbhu/github-download-parts/issues)
[![Build Status](https://travis-ci.org/pspgbhu/github-download-parts.svg?branch=master)](https://travis-ci.org/pspgbhu/github-download-parts)

It is able to download a partial of repository!


## Usage

- Download a single file

```js
const repo = require('github-download-parts');

// download the `index.js` file to `target` folder
repo('pspgbhu/github-download-parts', 'target', 'index.js')
  .then(() => {
    console.log('download success');
  })
  .catch(() => {
    console.log('download error');
  }
```

- Download a folder

```js
const repo = require('github-download-parts');

// download all files in the `test` folder of github repository to the local `target` folder.
repo('pspgbhu/github-download-parts', 'target', 'test')
  .then(() => {
    console.log('download success');
  })
  .catch(() => {
    console.log('download error');
  });
```

- Download a whole repository

```js
const repo = require('github-download-parts');

// download the whole repository into target local folder
repo('pspgbhu/github-download-parts', 'target')
  .then(() => {
    console.log('download success');
  })
  .catch(() => {
    console.log('download error');
  });
```

## API

### repo(git, target ,pathname)

- **git** `<string>`

  The git repository, the format of string is `"${username}/${repository}"`.

- **target** `<string>`

  The local folder path that files will be created into.

- **pathname** `<string>`

  A file or folder path of github repository.

### repo(options)
Or you could use a object as the `options` parameter

- **options** `<object>`
  - **username** `<string>`: The username of github.
  - **repository** `<string>`: The name of the repository.
  - **repo** `<string>`: The shorthand for `username` and `repository`, the format is `"${username}/${respository}"`
  - **target** `<string>`: The local folder path that files will be created into.
  - **pathname** `<string>`: A file or folder path of github repository.

## CLI

### Install

```bash
# Install the package
$ npm i -g github-download-parts

# Show more information about github-download-parts cli
$ repo -h
```

### Example

- Download a file or folder form someone github repository

```bash
$ repo -r "username/repository" -t local_folder -p target_file.js
```

- Download the whole repository

```bash
$ repo -r "username/repository" -t local_folder
```

### Options

- `-r --repo <repo>`: Github repository, the format is `"${username}/${repository}"`

- `-t --target <dir>`: The local directory that files will be created into

- `-p --pathname <path>`: The file or folder path of github repository you want to download

## Download Limiting

Because of Github API Rate Limiting, every IP only be allowed 60 requests per hour, So **every IP just only could download 60 times per hour**.

[Know More About Github Rate Limiting](https://developer.github.com/v3/#rate-limiting)
