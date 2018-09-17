const path = require('path');
const fs = require('fs-extra');
const repo = require('../');
const mockTree = require('./mock.json').tree;

const TARGET = '__demo__';
const TARGET2 = '__demo2__';
const TARGET3 = '__demo3__';
const TARGET4 = '__demo4__';
const TARGET5 = '__demo5__';

const USERNAME = 'pspgbhu';
const REPOSITORY = 'vue-swipe-mobile';
const REPO = 'pspgbhu/vue-swipe-mobile';

jest.setTimeout(1000 * 30);

test('Testing string parameter', done => {
  repo(REPO, TARGET, 'example', mockTree)
    .then(res => {
      expect(fs.existsSync(path.join(TARGET, 'main.js'))).toBe(true);
      expect(fs.existsSync(path.join(TARGET, 'App.vue'))).toBe(true);
      done();
    })
    .catch(e => {
      throw new Error(e);
    });
});

test('Downloading a folder', done => {
  repo({
    repo: REPO,
    pathname: 'example',
    target: TARGET2,
    mockTree,
  }).then(() => {
      expect(fs.existsSync(path.join(TARGET2, 'main.js'))).toBe(true);
      expect(fs.existsSync(path.join(TARGET2, 'App.vue'))).toBe(true);
      done();
  }).catch(e => {
    console.log(e);
    throw new Error(e);
  });
});

test('Downloading a single file', done => {
  repo({
    username: USERNAME,
    repository: REPOSITORY,
    pathname: 'example/main.js',
    target: TARGET3,
    mockTree,
  }).then(() => {
      expect(fs.existsSync(path.join(TARGET3, 'main.js'))).toBe(true);
      done();
  }).catch(e => {
    console.log(e);
    throw new Error(e);
  });
});

test('options.repo will have higher priority', done => {
  repo({
    username: USERNAME,
    repository: 'errorpath',
    repo: REPO,
    pathname: 'example/main.js',
    target: TARGET4,
    mockTree,
  }).then(() => {
      expect(fs.existsSync(path.join(TARGET4, 'main.js'))).toBe(true);
      done();
  }).catch(e => {
    console.log(e);
    throw new Error(e);
  });
});

test('download a whole repository', done => {
  repo(REPO, TARGET5, undefined, mockTree).then(() => {
    fs.removeSync(TARGET5);
    done();
  })
});

// test('download a incorrect repository', done => {
//   repo('pspgbhu/asdf').catch(e => {
//     expect(e.toString()).toBe('Not found "pspgbhu/asdf" repository, please check it again!');
//     done();
//   });
// })

test('download a incorrect file', done => {
  repo(REPO, REPOSITORY, 'incorrect_file', mockTree).catch(err => {
    expect(err.toString()).toBe('Error: Not found "incorrect_file" in this repository!');
    fs.removeSync(REPOSITORY);
    done();
  });
});

test('missing target & pathname parameters', done => {
  repo(REPO, undefined, undefined, mockTree).then(() => {
    expect(fs.existsSync(REPOSITORY)).toBe(true);
    fs.removeSync(REPOSITORY);
    done();
  });
});

test('one file download error', done => {
  const errorMockTree = mockTree.concat({
    path: "mock_error_file1",
    type: "blob",
  }, {
    path: "mock_error_file2",
    type: "blob",
  });

  repo(REPO, REPOSITORY, undefined, errorMockTree).then(() => {
    fs.removeSync(REPOSITORY);
    throw new Error('should invole catch method, but invoked then method');
  }).catch(err => {
    expect(err.message).toMatch(/^\"vue-swipe-mobile\/mock_error_file(1|2)\" download error: Not Found$/);
    fs.removeSync(REPOSITORY);
    done();
  });
});

afterAll(() => {
  fs.remove(TARGET);
  fs.remove(TARGET2);
  fs.remove(TARGET3);
  fs.remove(TARGET4);
  fs.remove(TARGET5);
  fs.remove(REPOSITORY);
});
