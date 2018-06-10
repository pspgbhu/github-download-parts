# github-download-parts

Not only download the whole repository in github, but also it is able to download a partial of repository!

## API

### class: Repo(options)

- `options<Object>`
  - `user`: The username of github repository.
  - `repo`: The name of repository.
  - `ref`: The branch of repository. Default master.

Or using a string options instead of object options:

- `options<String>`: The format of options string is `user/repo/ref`, such as `pspgbhu/github-download-parts/master`. And you can pass only `user/repo`, the `ref` will be default master.

Create a new Repository instance.

```javascript
const Repo = requier('github-download-parts');

// Passing an object as the parameter.
const repo = new Repo({
  user: 'pspgbhu',
  repo: 'github-download-parts',
});

// Or passing a string as param.
const repo = new Repo('pspgbhu/github-download-parts');
```

#### repo.download(dirname [, parts]);

- `dirname<String>`:  The local path that you want download repo to.

- `parts<String>`:  The parts of github repository. it could be a file or a dir in your repository. And it will only download what you set.

```javascript
const Repo = require('github-download-parts');

// new Repo instance.
const repo = new Repo('pspgbhu/github-download-parts');

// Downloading the parts of repo into my_local_dir.
repo.download('./my_local_dir', 'origin_repo_partial');
```

## Rate Limiting
Because of Github API Rate Limiting, **You just only could download 30 times per hour**.

Github allows 60 requests per hour, We will cost 2 requests every exec `repo.download()`.

[Know More About Github Rate Limiting](https://developer.github.com/v3/#rate-limiting)
