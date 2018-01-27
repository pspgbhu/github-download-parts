# github-download-parts

Not only download the whole repo in github, but also it is able to download parts of repository!

## Usage
```javascript
const Repo = require('github-download-parts');

const repo = new Repo('pspgbhu/github-download-parts');

// download the whole repo into someone dir.
repo.download('./local-dirname');

// donwload parts of the repo.
repo.download('./local-dirname', 'index.js');
```

## API

### new Repo(opts | user/repo[/ref])

Create a new repo. it accept an object or string as the parameter.

If you pass an object, `opts.user` and `opts.repo` are necessary.

- **opts**
  - **user**: The username of github repository.
  - **repo**: The name of repository.
  - **ref**: The branch of repository.

Or passing a string as the parameter.

- **user/repo[/ref]:**
  You can pass the string as the parameter like `'pspgbhu/github-download-parts/master'`, and the ref can be ignored.

```javascript
// Passing an object as the parameter.
const repo = new Repo({
  user: 'pspgbhu',
  repo: 'github-download-parts',
});

// Or passing a string as param.
const repo = new Repo('pspgbhu/github-download-parts');
```

### repo.download(dirname [, parts]);

- **dirname**:  The local path that you want download repo to.

- **parts**:  The parts of github repository. it could be a file or a dir in your repository. And it will only download what you set.

```javascript
// new Repo instance.
const repo = new Repo('pspgbhu/github-download-parts');

// Downloading the parts of repo into my_local_dir.
repo.download(path.resolve(path.join('my_local_dir'), 'repo_origin_dir');
```

## Rate Limiting
Because of Github API Rate Limiting, **You just only could download 30 times per hour**.

Github allows 60 requests per hour, We will cost 2 requests every exec `repo.download()`.

[Know More About Github Rate Limiting](https://developer.github.com/v3/#rate-limiting)
