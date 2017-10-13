/**
 * SUPPORT BY GITHUB API
 *
 * https://developer.github.com/v3/repos/branches/#get-branch
 * https://developer.github.com/v3/git/trees/#get-a-tree-recursively
 * https://developer.github.com/v3/repos/contents
 *
 * @author pspgbhu <brotherchun001@gmail.com>
 */


var fs = require('fs');
var download = require('download');
var request = require('superagent');
var chalk = require('chalk');
var URL = require('url').URL;


function Repo(info) {
  if (typeof info !== 'string' || info.split('/').length < 2) {
    throw new Error('[Repo constructor] Invalid parameter!');
    return;
  }

  infoList = info.split('/');
  this.user = infoList[0];
  this.repo = infoList[1];
  this.ref = infoList[2] || 'master';
  this.tree = { __files__: [] };
  this.rootDir = '';
}

Repo.prototype.download = function (targetDir, path = '') {
  this.rootDir = targetDir || '';

  if (targetDir && typeof targetDir === 'string') {
    var dir = /(.*)\/$/.exec(targetDir);
    this.rootDir = dir && dir.length ? dir[1] : targetDir;
  }

  if (typeof path === 'string' && path !== '') {
    this._downloadDir(path);
  } else {
    // download all repo;
  }
}


Repo.prototype._downloadDir = function (targetPath) {
  var regPath = /(.*)\/$/.exec(targetPath);
  var resolvePath = regPath && regPath.length ? regPath[1] : targetPath;

  var pathArr = /\w.*/.exec(resolvePath)[0].split('/');

  this._getDownloadQueue(resolvePath).then((downloadQueue) => {
    downloadQueue.forEach(item => {
      var url = item.downloadUrl;
      var path = this.rootDir + '/' + item.path;

      Repo.mkdirSync(item.dirPath);

      console.log(`downloading ${item.filename} ...`);
      download(url).then(data => {
        fs.writeFile(`${item.dirPath}/${item.filename}`, data, err => {
          if (err) {
            console.error(`file '${item.filename} download error!'`);
            return;
          };
          console.log(`downloaded ${item.filename} success!`);
        });
      }).catch(e => {
        console.error(`file '${item.filename} download error!'`, e);
      });
    });
  }).catch(e => {
    console.error(e);
  });
}


Repo.prototype._getTree = function () {

  return new Promise((resolve, reject) => {

    this._getSha().then(sha => {

      var api = `https://api.github.com/repos/${this.user}/${this.repo}/git/trees/${sha}?recursive=1`;

      request(api).end((err, response) => {

        if (err) {
          console.error(err);
          reject(err);
          return;
        }

        var res = JSON.parse(response.text);

        if (res.message) {
          console.error(res.message);
          reject(err);
          return;
        }

        res.tree.forEach(item => {
          var type = item.type;
          var path = item.path;
          var pathArr = item.path.split('/');

          if (type === 'blob' && pathArr.length === 1) {
            this.tree.__files__.push(path);

          } else if (type === 'blob') {
            var step = this.tree;

            for (var i = 0; i < pathArr.length - 1; i++) {
              step = step[pathArr[i]];
            }
            step.__files__.push(pathArr.concat().pop());

          } else if (type === 'tree') {
            var step = this.tree;

            for (var i = 0; i < pathArr.length; i++) {
              if (i < pathArr.length - 1) {
                step = step[pathArr[i]];
              } else {
                step[pathArr[i]] = { __files__: [] };
              }
            }
          }
        });

        resolve();

      });
    }).catch(e => {
      console.error(e);
    });
  });
}


Repo.prototype._getDownloadQueue = function (resolvePath) {

  return new Promise((resolve, reject) => {

    this._getSha(resolvePath).then(sha => {

      var api = `https://api.github.com/repos/${this.user}/${this.repo}/git/trees/${sha}?recursive=1`;

      request(api).end((err, response) => {

        if (err) {
          console.error(err);
          reject(err);
          return;
        }

        var res = JSON.parse(response.text);

        if (res.message) {
          console.error(res.message);
          reject(err);
          return;
        }

        var queue = [];
        res.tree.forEach(item => {
          var type = item.type;
          var needPopDirPath = item.path.split('/');
          var filename = needPopDirPath.pop();
          var absolutePath = resolvePath + '/' + item.path;

          if (type === 'blob') {
            var fileInfo = {
              filename,
              path: absolutePath,
              dirPath: this.rootDir + '/' + needPopDirPath.join('/'),
              downloadUrl: '',
            };

            fileInfo.downloadUrl =
            `https://raw.githubusercontent.com/${this.user}/${this.repo}/${this.ref}/${absolutePath}`;

            queue.push(fileInfo);
          }
        });

        resolve(queue);

      });
    }).catch(e => {
      console.error(e);
    });
  });
}


Repo.prototype._getSha = function (target) {
  if (!target) {
    var api = `https://api.github.com/repos/${this.user}/${this.repo}/branches/${this.ref}`;

    console.log('getsha', api);

    return new Promise((resolve, reject) => {
      request(api).end((err, response) => {
        if (err) {
          console.log('_getSha !target Error', err);
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
      request(api).end((err, response) => {
        if (err) {
          console.error('_getSha target Error', err.status);
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

Repo.prototype._getAimInfo = function(resolvePath) {
  var api = '';
  var info = null;
  var aim = '';

  return new Promise((resolve, reject) => {

    if (resolvePath.length < 1) {
      reject('[Repo.prototype._getSha] The resolvePath.length < 1');
    }

    if (resolvePath.length = 1) {
      api = `https://api.github.com/repos/${this.user}/${this.repo}/contents/?ref=${this.ref}`;
      aim = resolvePath[0];
    } else {
      var shaPath = resolvePath.concat();
      aim = shaPath.pop();
      api = `https://api.github.com/repos/${this.user}/${this.repo}/contents/${shaPath.join('/')}?ref=${this.ref}`;
    }

    console.log('_getAimInfo', api);

    request.get(api).end(function(err, response) {
      if (err) {
        throw new Error('Download error!' + err);
      }

      var res = JSON.parse(response.text);

      // ERROR
      if (!Array.isArray) {
        if (Object.prototype.toString.call(res) === '[object Object]' && res.message) {
          reject(err);
          return;
        } else {
          reject(err);
        }
      }

      res.forEach(function(item) {
        if (item.name === aim) {
          info = item;
        }
      }, this);

      resolve(info);
    });
  });
};


Repo.prototype._downloadFile = function() {

};


Repo.mkdirSync = (path, chmod = 0777, encoding = 'UTF-8') => {
  if (!path || typeof path !== 'string') {
    return;
  }

  if(fs.existsSync(path)) {
    // console.log('dir exists there!');
    return;
  };

  var decollator = '';

  // 兼容 windows
  if (path.indexOf('/') > -1) {  // Unix
    decollator = '/';
  } else if (path.indexOf('\\') > -1){ // windows
    decollator = '\\';
  } else {  // 单一目录
    fs.mkdirSync(path, chmod);
  }

  var pathArr = path.split(decollator);
  var pathStr = '';

  pathArr.forEach(p => {
    pathStr += p;
    if(fs.existsSync(pathStr)) {
      return;
    };
    fs.mkdirSync(pathStr);
  });
}


var repo = new Repo('jd-smart-fe/welink-template');
repo.download('test', 'fridge-template/build');

