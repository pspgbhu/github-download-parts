const path = require('path');
const fs = require('fs-extra');
const repo = require('../');

const TARGET = '__demo__';
const TARGET2 = '__demo2__';
const TARGET3 = '__demo3__';
const TARGET4 = '__demo4__';

jest.setTimeout(1000 * 30);

test('Testing string parameter', done => {
  repo('pspgbhu/vue-swipe-mobile', 'example', '__demo__')
    .then(res => {
      expect(fs.existsSync(path.join(TARGET, 'main.js'))).toBe(true);
      expect(fs.existsSync(path.join(TARGET, 'App.vue'))).toBe(true);
      done();
    })
    .catch(e => {
      console.log(e);
      throw new Error(e);
    });
});

test('Downloading a folder', done => {
  repo({
    repo: 'pspgbhu/vue-swipe-mobile',
    pathname: 'example',
    target: TARGET2,
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
    username: 'pspgbhu',
    repository: 'vue-swipe-mobile',
    pathname: 'example/main.js',
    target: TARGET3,
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
    username: 'pspgbhu',
    repository: 'errorpath',
    repo: 'pspgbhu/vue-swipe-mobile',
    pathname: 'example/main.js',
    target: TARGET4,
  }).then(() => {
      expect(fs.existsSync(path.join(TARGET4, 'main.js'))).toBe(true);
      done();
  }).catch(e => {
    console.log(e);
    throw new Error(e);
  });
});

afterAll(() => {
  fs.remove(TARGET);
  fs.remove(TARGET2);
  fs.remove(TARGET3);
  fs.remove(TARGET4);
});
