/**
 * Copyright (c) 2018, Kinvey, Inc. All rights reserved.
 *
 * This software is licensed to you under the Kinvey terms of service located at
 * http://www.kinvey.com/terms-of-use. By downloading, accessing and/or using this
 * software, you hereby accept such terms of service  (and any agreement referenced
 * therein) and agree that you have read, understand and agree to be bound by such
 * terms of service and are of legal age to agree to such terms with Kinvey.
 *
 * This software contains valuable confidential and proprietary information of
 * KINVEY, INC and is subject to applicable licensing agreements.
 * Unauthorized reproduction, transmission or distribution of this file and its
 * contents is a violation of applicable laws.
 */

const sinon = require('sinon');

const { EOL } = require('os');
const fs = require('fs');
const path = require('path');

const SiteEnvsService = require('../../../lib/website/SiteEnvsService');
const KinveyError = require('../../../lib/KinveyError');
const { assertions } = require('../../TestsHelper');

const sandbox = sinon.createSandbox({});
const siteDirectoryRelativePath = './test/fixtures/sites';
const indexPageDefault = 'index.html';
const maxSizeAllFilesDefault = Infinity;
const maxSizeSingleFileDefault = Infinity;

describe('SiteEnvsService', () => {
  describe('buildFormData', () => {
    beforeEach(() => {
      sandbox.stub(fs, 'createReadStream').callsFake(arg => arg);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('with relative path to existent file should build correct form data', (done) => {
      const targetFile = 'index.html';
      const pathToTarget = `./test/fixtures/sites/${targetFile}`;
      SiteEnvsService.buildFormData(pathToTarget, targetFile, null, maxSizeSingleFileDefault, maxSizeAllFilesDefault, (err, actual) => {
        if (err) {
          return done(err);
        }

        expect(actual).to.be.an('object');
        expect(actual).to.have.keys(targetFile);
        expect(actual[targetFile]).to.equal(pathToTarget);

        done();
      });
    });

    it('with relative path to existent directory should build correct form data', (done) => {
      const pathToTarget = './test/fixtures/sites';
      SiteEnvsService.buildFormData(pathToTarget, indexPageDefault, null, maxSizeSingleFileDefault, maxSizeAllFilesDefault, (err, actual) => {
        if (err) {
          return done(err);
        }

        const sep = path.sep;
        expect(actual).to.be.an('object');
        expect(actual).to.have.keys('index.html', 'resources/icon.png');
        expect(actual['index.html']).to.equal(`test${sep}fixtures${sep}sites${sep}index.html`);
        expect(actual['resources/icon.png']).to.equal(`test${sep}fixtures${sep}sites${sep}resources${sep}icon.png`);

        done();
      });
    });

    it('with relative path to non-existent directory should return error', (done) => {
      const pathToTarget = './test/fixtures/sites/no-such-dir';
      SiteEnvsService.buildFormData(pathToTarget, indexPageDefault, null, maxSizeSingleFileDefault, maxSizeAllFilesDefault, (err) => {
        const expectedErr = new KinveyError('InvalidPath', `Path '${pathToTarget}' does not exist.`);
        assertions.assertError(err, expectedErr);
        done();
      });
    });

    it('with absolute path to existent file should build correct form data', (done) => {
      const targetFile = 'index.html';
      const pathToTarget = path.resolve(`./test/fixtures/sites/${targetFile}`);
      SiteEnvsService.buildFormData(pathToTarget, targetFile, null, maxSizeSingleFileDefault, maxSizeAllFilesDefault, (err, actual) => {
        if (err) {
          return done(err);
        }

        expect(actual).to.be.an('object');
        expect(actual).to.have.keys(targetFile);
        expect(actual[targetFile]).to.equal(pathToTarget);

        done();
      });
    });

    it('with valid path when indexPage is missing should return error', (done) => {
      const pathToTarget = './test/fixtures/sites';
      const expectedIndexPage = 'main.html';
      SiteEnvsService.buildFormData(pathToTarget, expectedIndexPage, null, maxSizeSingleFileDefault, maxSizeAllFilesDefault, (err) => {
        expect(err).to.exist;
        expect(err.name).to.equal('FilesNotFound');
        expect(err.message).to.equal(`Required file(s) not found.${EOL}\tIndex page: '${expectedIndexPage}'.`);

        done();
      });
    });

    it('with valid path when errorPage is missing should return error', (done) => {
      const pathToTarget = './test/fixtures/sites';
      const expectedErrorPage = 'my-error.html';
      SiteEnvsService.buildFormData(pathToTarget, indexPageDefault, expectedErrorPage, maxSizeSingleFileDefault, maxSizeAllFilesDefault, (err) => {
        expect(err).to.exist;
        expect(err.name).to.equal('FilesNotFound');
        expect(err.message).to.equal(`Required file(s) not found.${EOL}\tError page: '${expectedErrorPage}'.`);

        done();
      });
    });

    it('with valid path when both indexPage and errorPage are missing should return error', (done) => {
      const pathToTarget = './test/fixtures/sites';
      const expectedIndexPage = 'main.html';
      const expectedErrorPage = 'my-error.html';
      SiteEnvsService.buildFormData(pathToTarget, expectedIndexPage, expectedErrorPage, maxSizeSingleFileDefault, maxSizeAllFilesDefault, (err) => {
        expect(err).to.exist;
        expect(err.name).to.equal('FilesNotFound');
        const expErrMsg = `Required file(s) not found.${EOL}\tIndex page: '${expectedIndexPage}'.${EOL}\tError page: '${expectedErrorPage}'.`;
        expect(err.message).to.equal(expErrMsg);

        done();
      });
    });

    it('with valid path and file limits not exceeded should build correct form data', (done) => {
      const pathToTarget = path.resolve('./test/fixtures/sites');
      SiteEnvsService.buildFormData(pathToTarget, null, null, maxSizeSingleFileDefault, maxSizeAllFilesDefault, (err, actual) => {
        if (err) {
          return done(err);
        }

        expect(actual).to.be.an('object');
        expect(actual).to.have.keys(['index.html', 'resources/icon.png']);

        done();
      });
    });

    it('with valid path and limit for single file exceeded should return error', (done) => {
      const maxSizeSingleFile = 3200;
      SiteEnvsService.buildFormData(siteDirectoryRelativePath, null, null, maxSizeSingleFile, maxSizeAllFilesDefault, (err) => {
        expect(err).to.exist;
        expect(err.message).to.equal(`The maximum allowed file size is ${maxSizeSingleFile} bytes. 'resources/icon.png' is 3964 bytes.`);

        done();
      });
    });

    it('with valid path and limit for total files size exceeded should return error', (done) => {
      const maxSizeAllFiles = 3970;
      SiteEnvsService.buildFormData(siteDirectoryRelativePath, null, null, maxSizeSingleFileDefault, maxSizeAllFiles, (err) => {
        expect(err).to.exist;
        expect(err.message).to.equal(`The maximum allowed files size is ${maxSizeAllFiles} bytes.`);

        done();
      });
    });
  });
});
