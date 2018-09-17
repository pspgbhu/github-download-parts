const path = require('path');
const fs = require('fs');
const request = require('request');
const debug = require('debug')('github-download-parts');

/**
 * @param {object|string} opts the options
 * @param {string} opts.username github username
 * @param {string} opts.repository github repository name
 * @param {string} opts.repo form as '${username}/${repository}'
 * @param {string} opts.branch the branch of repo.
 * @param {string} opts.pathname a folder or file of this repo
 * @param {string} opts.target the directory of files will be downloaded to.
 * @param {string} pathname a folder or file of this repository.
 * @param {string} target the target directory will be downloaded to.
 */
module.exports = async function download(opts, target, pathname, treeData) {
  if (!opts) {
    throw new Error('Expect first parameter is string or object, but got', typeof opts);
  }

  let repo;
  if (typeof opts === 'string') {
    repo = opts;
  } else if (opts.repo) {
    repo = opts.repo;
  } else {
    repo = `${opts.username}/${opts.repository}`;
  }

  const branch = opts.branch || 'master';
  target = target || opts.target;
  pathname = pathname || opts.pathname;
  treeData = treeData || opts.tree;

  if (!checkRepo(repo)) {
    throw new Error('Parameter Error! Can not parse the repository path, please use a string of the form `${username}/${repo}` as the first parameter. Or use a object options as the first paramter.');
  }

  const tree = await getTree(repo, branch, treeData);
  const { fileList, isFolder } = getFileList(tree, pathname);

  debug('isFolder: %o', isFolder);
  debug('repo: %s', repo);
  debug('target: %s', target);
  debug('pathname: %s', pathname);
  return createFiles(fileList, target, repo, branch, isFolder);
};

/**
 * get the tree of repo files
 * @param {string} repo
 * @param {string} branch
 */
function getTree(repo, branch, tree) {
  // mock tree data
  if (tree) {
    return Promise.resolve(tree);
  }

  const url = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`;

  debug('api: %s', url);

  return new Promise((resolve, reject) => {
    request({
      url,
      headers: {
        'User-Agent': require('./package.json').name,
      },
    }, (err, res, body) => {
      if (err) {
        reject(err);
        return;
      }
      if (res.statusCode === 404) {
        reject(`Not found "${repo}" repository, please check it again`);
      } else if (res.statusCode !== 200) {
        reject(body);
        return;
      }

      const json = JSON.parse(body);

      if (!json.tree) {
        reject('Request Error!');
        return;
      }

      resolve(json.tree);
    });
  });
}

/**
 * filter the files need to downloaded.
 * @param {Array} tree
 * @param {string} pathname
 */
function getFileList(tree, pathname) {
  if (!Array.isArray(tree)) {
    throw new Error('Tree is not an array');
  }

  let isFolder = false;
  const regexp = new RegExp(`^${pathname}(\/|$)`);

  const fileList = tree.filter(info => {
    // check is pathname a folder;
    if (pathname === info.path) {
      isFolder = info.type === 'tree';
    }
    // filter files
    return regexp.test(info.path)
  });

  return { isFolder, fileList };
}

/**
 * @param {Array} fileList
 * @param {string} target
 * @param {string} repo
 * @param {string} branch
 * @param {boolean} isFolder
 */
function createFiles(fileList, target, repo, branch, isFolder = false) {

  !fs.existsSync(target) && fs.mkdirSync(target);

  const list = !isFolder
    // if only download a single file
    ? fileList.map(info => {
        // the filename is `${basename}`
        info.filename = path.parse(info.path).base;
        return info;
    })
    // if need to download a folder
    : fileList.map(info => {
        const paths = info.path.split('/');
        paths.shift();
        info.filename = paths.join('/');
        return info;
      });

  let number = list.length;

  return new Promise((resolve, reject) => {
    list.forEach(info => {
      const filename = path.join(target, info.filename);

      // console.log('info %o', info);
      // console.log('filename', filename);

      // create folder
      if (info.type === 'tree') {
        info.filename && !fs.existsSync(filename) && fs.mkdirSync(filename);
        number--;
        return;
      }

      // https://raw.githubusercontent.com/pspgbhu/vue-swipe-mobile/master/example/App.vue

      // downloading file
      const url = `https://raw.githubusercontent.com/${repo}/${branch}/${info.path}`;

      downloadFile(url, filename)
        .then(() => {
          downloadFinaly();
        })
        .catch(error => {
          downloadFinaly();
        });

      function downloadFinaly() {
        number--;
        if (number <= 0) {
          resolve();
        }
      }
    });
  });
}

/**
 * @param {string} url
 * @param {string} filename
 * @param {number} retry
 */
function downloadFile(url, filename, retry = 0, rs = null, rj = null) {
  return new Promise((resolve, reject) => {
    resolve = rs || resolve;
    reject = rj || reject;

    request
      .get(encodeURI(url))
      .on('error', function(e) {
        if (retry < 3) {
          downloadFile(url, filename, retry + 1, resolve, reject);
        } else {
          reject({ message: `${filename} download error`, url, filename, errMsg: e });
        }
      })
      .on('response', function(res) {
        if ( res.statusCode !== 200 ) {
          this.emit( 'error', res.statusMessage )
        } else {
          resolve({ filename, url });
        }
      })
      .pipe(fs.createWriteStream(filename));
  });
}

function checkRepo(repo) {
  return /^[\w\b-]+\/[\w\b-]+$/.test(repo);
}
