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

### new Repo([ opts | user/repo[/ref] ])

Create a new repo. it accept an object or string as the param.

If you pass an object, `opts.user` or `opts.repo` cannot be ignored.
- opts
  - user
    the username of github repository.
  - repo
    The name of repository.
  - ref
    The branch of repository.
  - downloadType: 'git' | 'zip' (!not complete)
    The way that download the whole repository. Only work for download whole repository.


```javascript
new Repo({
  user: 'pspgbhu',
  repo: 'github-download-parts',
});
```


You also could pass a string as param.

- string
  `'user/repo/ref'`, you can pass the string like this as the param, and the ref can be ignored.

```javascript
new Repo('pspgbhu/github-download-parts/master');

// or, you could ignore the branch.
new Repo('pspgbhu/github-download-parts');
```

### repo.download([dirname] [, parts]);

- dirname
  The local path that you want download repo to.

- parts
  the parts of github repository. it could be a file or a dir in your repository. And it will only download what you set.
