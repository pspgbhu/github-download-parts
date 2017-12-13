/**
 * SUPPORT BY GITHUB API
 *
 * https://developer.github.com/v3/repos/branches/#get-branch
 * https://developer.github.com/v3/git/trees/#get-a-tree-recursively
 * https://developer.github.com/v3/repos/contents
 *
 * @author pspgbhu <brotherchun001@gmail.com> (http://pspgbhu.me)
 */

const fs = require('fs');
const download = require('download');
const request = require('superagent');
const path = require('path');
const chalk = require('chalk');


function Repo(info) {
  let user, repo, ref;
  let downloadType = 'git';
  let debug = false;

  if (typeof info === 'string') {
    const arr = info.split('/');

    if (arr.length < 2) {
      throw new Error('[Repo constructor] Invalid parameter!');
    }

    user = arr[0];
    repo = arr[1];
    ref = arr[2] || 'master';

  } else if (typeof info === 'object') {
    if (!info.user || !info.ref) {
      throw new Error('[Repo constructor] Invalid parameter!');
    }

    user = info.user;
    repo = info.repo[1];
    ref = info.ref[2] || 'master';
    downloadType = info.downloadType === 'zip' ? 'zip' : 'git';
    debug = typeof info.log === 'boolean' ? debug : false;

  } else {
    throw new Error('[Repo constructor] Invalid parameter!');
  }

  this.user = user;
  this.repo = repo;
  this.ref = ref;
  this.downloadType = downloadType;
  this.debug = debug;
  this.tree = { __files__: [] };

  this.targetDir = '';
  this._combineConfig();
}


Repo.config = {};
Repo.setConfig = function (cfg) {
  if (!cfg) return;

  for (const key in cfg) {
    if (Object.prototype.hasOwnProperty.call(cfg, key)) {
      const value = cfg[key];
      Repo.config[key] = value;
    }
  }
}


Repo.prototype._combineConfig = function () {
  const ignore = [];

  for (const key in Repo.config) {
    if (Object.prototype.hasOwnProperty.call(Repo.config, key)) {
      const value = Repo.config[key];
      if (key in ignore) continue;
      this[key] = value;
    }
  }

  this.console = {};
  if (this.debug) {
    this.console = global.console;
  } else {
    this.console = {
      log: function () {},
      error: function () {},
    }
  }
}


/**
 * @param {String} targetDir
 * Files will be downloaded to this dir
 *
 * @param {String} path
 * If path has a value, it will download parts of repo that according the path.
 * If path has no value, it will download the whole repo.
 *
 * @return {Promise}
 */
Repo.prototype.download = function (targetDir = '', repoParts = '') {
  if (typeof targetDir !== 'string') {
    throw new Error('You must pass a String as the first parameter.');
  }
  this.targetDir = path.resolve(targetDir);

  return new Promise((resolve, reject) => {
    // Donwload parts of repo
    if (repoParts !== '') {
      this.console.log('The targetDir: ', targetDir);
      this.console.log('The repoParts: ', repoParts);

      this._getSha(repoParts)
        .then(sha => {
          if (!sha) return new Promise((resolve, reject) => reject('success'));
          return this._getDownloadQueue(sha, repoParts)
        })
        .then(downloadQueue => this._downloadFiles(downloadQueue))
        .then(() => resolve())
        .catch(e => {
          if (e === 'success') {
            resolve();
            return;
          }
          reject(e)
        });

      // Download the whole repo
    } else {
      this._downloadRepo()
        .then(() => resolve())
        .catch(e => reject(e));
    }
  });
}


Repo.prototype._getSha = function (repoParts) {

  // if begin with '/', will remove it.
  // And will got the parentPath.
  let repoPartsParent =
    repoParts.indexOf('/') === 0
    ? repoParts.slice(1).split('/').slice(1).join('/')
    : repoParts.split('/').slice(1).join('/');

  this.console.log('The repoParts parent: ', repoPartsParent);

  var api = `https://api.github.com/repos/${this.user}/${this.repo}/contents/${repoPartsParent}?ref=${this.ref}`;
  this.console.log('Getting the sha of files from ', api);

  return new Promise((resolve, reject) => {
    request(api).end((err, response) => {

      if (err) {
        this.console.error('Get sha error!', err.status);
        reject(err);
        return;
      }
      this.console.log('Got the sha success.');

      var res = JSON.parse(response.text);
      if (res.message) {
        reject(err.message);
      }

      if (!Array.isArray(res)) {
        reject('res not an array!');
        return;
      }

      var sha = '';

      for (let index = 0; index < res.length; index++) {
        const item = res[index];

        // download single file.
        if (item.path === repoParts && item.type === 'file') {
          const url = `https://raw.githubusercontent.com/${this.user}/${this.repo}/${this.ref}/${repoParts}`
          this._downloadFile(url, `${this.targetDir}/${repoParts}`)
            .then(() => resolve())
            .catch(e => reject(e));
            return;
        }

        // download a dir.
        if (item.path === repoParts) {
          sha = item.sha;
        }
      }

      if (sha) {
        resolve(sha);
      } else {
        reject('No repoParts file or dir');
      }
    });
  });
}


Repo.prototype._getDownloadQueue = function (sha, repoParts) {
  return new Promise((resolve, reject) => {

    var api = `https://api.github.com/repos/${this.user}/${this.repo}/git/trees/${sha}?recursive=1`;

    request(api).end((err, response) => {
      if (err) {
        this.console.error(err);
        reject(err);
        return;
      }

      var res = JSON.parse(response.text);
      if (res.message) {
        this.console.error(res.message);
        reject(err);
        return;
      }

      var queue = [];
      res.tree.forEach(item => {
        var type = item.type;
        var needPopDirPath = item.path.split('/');
        var filename = needPopDirPath.pop();
        var repoAbsolutePath = repoParts + '/' + item.path;

        if (type === 'blob') {

          var fileInfo = {
            filename,
            path: repoAbsolutePath,
            dirPath: this.targetDir + path.sep + needPopDirPath.join(path.sep),
            downloadUrl: '',
          };

          fileInfo.downloadUrl =
            `https://raw.githubusercontent.com/${this.user}/${this.repo}/${this.ref}/${repoAbsolutePath}`;

          queue.push(fileInfo);
        }
      });

      resolve(queue);
    });
  });
}


Repo.prototype._downloadFiles = function (downloadQueue) {
  return new Promise((resolve) => {
    this.console.log(`Begin downloading files...`);
    downloadQueue.forEach((item, index) => {

      const url = item.downloadUrl;
      const filePath = path.join(item.dirPath, item.filename);
      this._downloadFile(url, filePath).then(() => {

        this.console.log(`${filePath} download success.`);
        // 最后一个文件
        if (index === downloadQueue.length - 1) {
          resolve();
        }

      }).catch(e => {

        // 最后一个文件
        if (index === downloadQueue.length - 1) {
          resolve(e);
        }
      });
    });
  });
}


Repo.prototype._downloadFile = function (url, filePath) {
  return new Promise((resolve, reject) => {
    if (!url) reject('Got an empty value in _downloadFile.');

    mkdirSync(path.dirname(filePath));
    download(url).then(data => {

      fs.writeFile(filePath, data, err => {
        if (err) {
          reject(err);
          return;
        };
        this.console.log(`Download file '${path.basename(filePath)}' success`);
        resolve();
      });

    }).catch(e => {
      this.console.log(chalk.bgRed(`File ${path.basename(filePath)} download error!'`));
      reject(e);
    });
  });
}


Repo.prototype._downloadRepo = function () {
  const zipUrl = `https://github.com/${this.user}/${this.repo}/archive/${this.ref}.zip`;

  return new Promise((resolve, reject) => {
    download(zipUrl, this.targetDir, { extract: true })
      .then(() => resolve())
      .catch(e => reject(e));
  });
}


function mkdirSync(target) {
  if (!target || typeof target !== 'string' || target === '') {
    return;
  }

  const prefix = path.isAbsolute(target) ? path.sep : '';
  const array = target.split(path.sep);

  for (let i = 0; i < array.length; i++) {
    const verifyPath = prefix + array.slice(0, i + 1).join(path.sep) + path.sep;

    try {
      fs.accessSync(verifyPath);
      continue;
    } catch (e) {
      try {
        fs.mkdirSync(verifyPath);
      } catch (error) {
        console.log(`mkdir '${verifyPath}' error!`);
      }
    }
  }
}

module.exports = Repo;
