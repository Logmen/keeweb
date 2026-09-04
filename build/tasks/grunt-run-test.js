module.exports = function (grunt) {
    grunt.registerMultiTask('run-test', 'Runs KeeWeb browser-tests', function () {
        const done = this.async();
        const opt = this.options();
        const file = this.files[0].src[0];
        const path = require('path');
        const puppeteer = require('puppeteer');
        const timeout = opt.timeout || 2 * 60 * 1000;
        (async function () {
            grunt.log.writeln('Running tests...');
            const fullPath = 'file://' + path.resolve(file);
            const browser = await puppeteer.launch({
                headless: opt.headless,
                executablePath: process.env.CHROME_BIN || undefined,
                args: ['--disable-dev-shm-usage']
            });
            try {
                grunt.log.writeln('puppeteer launched...');
                const page = await browser.newPage();
                page.on('pageerror', (e) => grunt.log.error('Page error: ' + e));
                await page.goto(fullPath);
                const deadline = Date.now() + timeout;
                for (;;) {
                    const result = await page.evaluate(() => {
                        const { output, done } = window;
                        window.output = [];
                        return { output, done };
                    });
                    for (const out of result.output) {
                        if (!out.args.length) {
                            continue;
                        }
                        // eslint-disable-next-line no-console
                        console[out.method](...out.args);
                    }
                    if (result.done) {
                        const { failures } = result.done;
                        if (failures) {
                            grunt.warn(`Failed ${failures} test${failures > 1 ? 's' : ''}.`);
                        } else {
                            grunt.log.writeln('All tests passed');
                            done();
                        }
                        return;
                    }
                    if (Date.now() > deadline) {
                        throw new Error(`Tests did not finish in ${timeout}ms`);
                    }
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            } finally {
                await browser.close();
            }
        })().catch((err) => {
            grunt.fail.warn('Error while running tests: ' + (err && err.stack ? err.stack : err));
        });
    });
};
