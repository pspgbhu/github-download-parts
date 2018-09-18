const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

jest.setTimeout(1000 * 30);

const cwd = path.resolve(__dirname, '../');

describe('CLI Function', () => {
  test('exec download a single file', done => {
    exec(
      './bin/repo -r "pspgbhu/github-download-parts" -t __bin_demo__ -p README.md --mock test/mock.json',
      { cwd },
      (err, stdout, stderr) => {
        if (err) {
          console.log('stdout:', stdout);
          console.log('stderr:', stderr);
          console.log('err:', err);
          throw new Error(err);
        }
        expect(fs.existsSync(path.join(cwd, '__bin_demo__', 'README.md'))).toBe(true);
        done();
      },
    );
  });

  afterAll(() => {
    fs.remove(path.join(cwd, '__bin_demo__'));
  });
});
