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
 *
 * @return {Promise}
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

  if (!checkRepo(repo)) {
    throw new Error('Parameter Error! Can not parse the repository path, please use a string of the form `${username}/${repo}` as the first parameter. Or use a object options as the first paramter.');
  }

  const repoReg = /\/([^=&#]+$)/.exec(repo);
  const repository = (repoReg && repoReg[1]) || 'target';

  const branch = opts.branch || 'master';
  target = target || opts.target || repository;
  pathname = pathname || opts.pathname;
  treeData = treeData || opts.tree;

  const tree = await getTree(repo, branch, treeData);

  try {
    const { fileList, type } = getFileList(tree, pathname);

    debug('download type: %o', type);
    debug('repo: %s', repo);
    debug('target: %s', target);
    debug('pathname: %s', pathname);

    return createFiles(fileList, target, repo, branch, type);

  } catch (error) {
    return Promise.reject(error);
  }
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
        reject(`Not found "${repo}" repository, please check it again!`);
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

  if (!pathname) {
    return {
      fileList: tree,
      type: 'whole', // deal with it like single file
    };
  }

  let type = 'file';
  let exist = false;
  const regexp = new RegExp(`^${pathname}(\/|$)`);

  const fileList = tree.filter(info => {
    // check is pathname a folder;
    if (pathname === info.path) {
      exist = true;

      if (info.type === 'tree') {
        type = 'folder';
      }
    }
    // filter files
    return regexp.test(info.path)
  });

  if (!exist) {
    throw new Error(`Not found "${pathname}" in this repository!`);
  }

  return { type, fileList };
}

/**
 * @param {Array} fileList
 * @param {string} target
 * @param {string} repo
 * @param {string} branch
 * @param {boolean} isFolder
 */
function createFiles(fileList, target, repo, branch, type = 'file') {

  !fs.existsSync(target) && fs.mkdirSync(target);

  let list;

  switch(type) {
    // if only download a single file
    case 'file':
      list = fileList.map(info => {
        // the filename is `${basename}`
        info.filename = path.parse(info.path).base;
        return info;
      });
      break;

    // if need to download a folder
    case 'folder':
      list = fileList.map(info => {
        const paths = info.path.split('/');
        paths.shift();
        info.filename = paths.join('/');
        return info;
      });
      break;

    // if download a whole repo
    case 'whole':
      list = fileList.map(info => {
        info.filename = info.path;
        return info;
      })
      break;
    default:
      throw new Error('Got a error download type value:', type);
  }

  const length = list.length;

  const promiseQueue = list.map((info, index) => new Promise((resolve, reject) => {
    const filename = path.join(target, info.filename);

    // create folder
    if (info.type === 'tree') {
      info.filename && !fs.existsSync(filename) && fs.mkdirSync(filename);
      debug('folder %s/%s %s', index + 1, length, filename);
      resolve();
      return;
    }

    // downloading file
    const url = getUrl(repo, branch, info.path);
    downloadFile(url, filename)
      .then(() => {
        resolve();
        debug('success %s/%s %s', index + 1, length, filename);
      })
      .catch(error => {
        reject(error);
        debug('error %s/%s %s', index + 1, length, filename);
      });
    })
  );

  return Promise.all(promiseQueue);
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

    const stream = fs.createWriteStream(filename);
    stream.on('finish', () => {
      resolve({ filename, url });
    });
    stream.on('error', e => {
      reject({ message: e, url, filename });
    });

    request
      .get(encodeURI(url))
      .on('error', function(e) {
        if (retry < 3) {
          downloadFile(url, filename, retry + 1, resolve, reject);
        } else {
          reject({ message: `"${filename}" download error: ${e}`, url, filename });
        }
      })
      .on('response', function(res) {
        if ( res.statusCode !== 200 ) {
          this.emit('error', res.statusMessage)
        }
      })
      .pipe(stream);
  });
}

function getUrl(repo, branch, pathname) {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${pathname}`;
}

function checkRepo(repo) {
  return /^[^=#&]+\/[^=#&]+$/.test(repo);
}
