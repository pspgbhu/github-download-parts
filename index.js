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
const chalk = require('chalk');
const URL = require('url').URL;
const path = require('path');


function Repo(info) {
  let user, repo, ref;
  let downloadType, log;

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
    log = typeof info.log === 'boolean' ? log : true;
  }

  this.user = user;
  this.repo = repo;
  this.ref = ref || 'master';
  this.tree = { __files__: [] };
  this.downloadType = downloadType || 'git';
  this.log = typeof log === 'boolean' ? log : true;

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
  if (this.log) {
    this.console = global.console;
  } else {
    this.console = {
      log: function() {},
      error: function() {},
    }
  }
}


/**
 *
 * @param {String} targetDir
 * Files will be downloaded to this dir
 *
 * @param {String} path
 * If path has a value, it will download parts of repo that according the path.
 * If path has no value, it will download the whole repo.
 */
Repo.prototype.download = function (targetDir = '', repoParts = '') {
  if (typeof targetDir !== 'string') {
    throw new Error('You must pass a String as the first parameter.');
  }
  this.targetDir = path.resolve(targetDir);

  // Donwload parts of repo
  if (repoParts !== '') {
    this._downloadParts(repoParts);

  // Download the whole repo
  } else {
    this._downloadRepo();
  }
}


Repo.prototype._downloadParts = function (repoParts) {
  var regPath = /(.*)\/$/.exec(repoParts);
  var repoResolvePath = regPath && regPath.length ? regPath[1] : repoParts;

  var pathArr = /\w.*/.exec(repoResolvePath)[0].split('/');

  this._getDownloadQueue(repoResolvePath).then((downloadQueue) => {
    downloadQueue.forEach(item => {
      var url = item.downloadUrl;

      Repo.mkdirSync(item.dirPath);

      this.console.log(`Downloading ${item.filename} ...`);
      download(url).then(data => {
        fs.writeFile(`${item.dirPath}/${item.filename}`, data, err => {
          if (err) {
            this.console.error(`file '${item.filename} download error!'`);
            return;
          };
          this.console.log(`Downloaded ${item.filename} success!`);
        });
      }).catch(e => {
        this.console.error(`file '${item.filename} download error!'`, e);
      });
    });
  }).catch(e => {
    this.console.error(e);
  });
}


Repo.prototype._getDownloadQueue = function (repoResolvePath) {

  return new Promise((resolve, reject) => {

    this._getSha(repoResolvePath).then(sha => {

      var api = `https://api.github.com/repos/${this.user}/${this.repo}/git/trees/${sha}?recursive=1`;

      this.console.log('Getting the files tree...');
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
          var repoAbsolutePath = repoResolvePath + '/' + item.path;

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
    }).catch(e => {
      this.console.error(e);
    });
  });
}


Repo.prototype._getSha = function (target) {
  if (!target) {
    var api = `https://api.github.com/repos/${this.user}/${this.repo}/branches/${this.ref}`;

    return new Promise((resolve, reject) => {
      request(api).end((err, response) => {
        if (err) {
          this.console.log('_getSha !target Error', err);
          reject(err);
          return;
        }

        var res = JSON.parse(response.text);
        if (res.message) {
          reject(err.message);
        }

        resolve(res.commit.sha);
      });
    });

  } else {
    var temp = target.split('/').concat();
    var targetDir = temp.splice(0, temp.length - 1).join('/');

    var api = `https://api.github.com/repos/${this.user}/${this.repo}/contents/${targetDir}?ref=${this.ref}`;

    return new Promise((resolve, reject) => {
      this.console.log('Getting the sha of repo...');
      request(api).end((err, response) => {
        if (err) {
          this.console.error('_getSha target Error', err.status);
          reject(err);
          return;
        }

        var res = JSON.parse(response.text);
        if (res.message) {
          reject(err.message);
        }

        var sha = '';
        res.forEach(item => {
          if (item.path === target) {
            sha = item.sha;
          }
        });

        if (sha) {
          resolve(sha);
        } else {
          reject('No target file or dir');
        }
      });
    });
  }
}


Repo.prototype._downloadRepo = function () {
  const zipUrl = `https://github.com/${this.user}/${this.repo}/archive/${this.ref}.zip`;
  download(zipUrl, this.targetDir, {extract: true}).then(() => {
    this.console.log('download repo success!');
  }).catch(e => {
    this.console.error('download repo error!', e);
  });
}


Repo.mkdirSync = (target, chmod = 0755) => {
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

// module.exports = Repo;
let repo = new Repo('alexmingoia/koa-router');
repo.download('alexmingoia');
