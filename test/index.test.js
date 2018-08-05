const Repo = require('../index.js');
const path = require('path');
const fs = require('fs-extra');

jest.setTimeout(1000 * 30);

test('by git', async () => {
  const dir = path.resolve(__dirname, 'demo_target');

  try {
    await fs.remove(dir)
  } catch (err) {
    console.log('remove error:', err);
  }

  await Repo('pspgbhu/github-download-parts')
    .download(dir);

  fs.statSync(dir);
  fs.statSync(path.join(dir, 'index.js'));

  try {
    await fs.remove(dir)
  } catch (err) {
  }
});

test('by zip', async () => {
  const dir = path.resolve(__dirname, 'demo_target_zip');

  try {
    await fs.remove(dir)
  } catch (err) {
    console.log('remove error:', err);
  }

  await Repo({ user: 'pspgbhu', repo: 'github-download-parts', downloadType: 'zip' })
    .download(dir);

  fs.statSync(dir);
  fs.statSync(path.join(dir, 'index.js'));

  try {
    await fs.remove(dir)
  } catch (err) {
  }
});

test('single file', async () => {
  const dir = path.resolve(__dirname, 'demo_file');

  try {
    await fs.remove(dir)
  } catch (err) {
    console.log('remove error:', err);
  }

  await Repo('pspgbhu/github-download-parts')
    .download(dir, 'index.js');

  fs.statSync(dir);

  try {
    await fs.remove(dir)
  } catch (err) {
  }
});


test('single file by set options', async () => {
  const dir = path.resolve(__dirname, 'demo_file_options');

  try {
    await fs.remove(dir)
  } catch (err) {
    console.log('remove error:', err);
  }

  await Repo({ user: 'pspgbhu', repo: 'github-download-parts', ref: 'master' })
    .download(dir, 'index.js');

  fs.statSync(dir);

  try {
    await fs.remove(dir)
  } catch (err) {
  }
});
