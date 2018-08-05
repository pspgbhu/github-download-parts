# github-download-parts

Not only download the whole repository in github, but also it is able to download a partial of repository!

## Guide

Download a folder or file from github repository.

```js
const Repo = require('github-download-parts');

// just download the index.js file
Repo('pspgbhu/github-download-parts')
  .download('local-directory', 'index.js')
  .then(() => {
    console.log('download done!');
  });
```

Download the whole repository.

```js
// just download the index.js file
Repo('pspgbhu/github-download-parts')
  .download('local-directory')
  .then(() => {
    console.log('download done!');
  });
```

## API

### Repo(options)

- `options<object>`
  - `user<string>`: The username of github repository.
  - `repo<string>`: The name of repository.
  - `ref<string>`: Default `'master'`. The branch of repository.

Or using a string options instead of object options:

- `options<string>`: The format of options string is `user/repo/ref`, such as `pspgbhu/github-download-parts/master`. And you can pass only `user/repo`, the `ref` will be default master.

- return: `repo` instance.

```javascript
const Repo = requier('github-download-parts');

// Passing an object as the parameter.
const repo = Repo({
  user: 'pspgbhu',
  repo: 'github-download-parts',
  ref: 'master',
})
repo.download('local');

// Or passing a string as param.
Repo('pspgbhu/github-download-parts').download('local');
```

```js
```

#### repo.download(dirname [, parts]);

- `dirname<string>`:  The local directory that you want download repo into.

- `parts<string>`:  The partial of github repository. it could be a file or a foler in your repository. And it will only download files what you set to.

- return: `Promise<void>`

```javascript
const Repo = require('github-download-parts');

// new Repo instance.
const repo = Repo('pspgbhu/github-download-parts');

// Downloading the parts of repo into my_local_dir.
repo.download('./my_local_dir', 'origin_repo_partial').then(() => {
  console.log('download success');
}).catch(e => console.log(e));
```

## Rate Limiting
Because of Github API Rate Limiting, **You just only could download 30 times per hour in partial mode**.

Github allows 60 requests per hour, We will cost 2 requests every exec `repo.download()`.

**Download whole repository do not have this limite**.

[Know More About Github Rate Limiting](https://developer.github.com/v3/#rate-limiting)
