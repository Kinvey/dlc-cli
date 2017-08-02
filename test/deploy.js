/**
 * Copyright (c) 2017, Kinvey, Inc. All rights reserved.
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
const command = require('./fixtures/command.js');
const service = require('../lib/service.js');
const deploy = require('../cmd/deploy.js');
const pkg = require('../package.json');
const project = require('../lib/project.js');
const user = require('../lib/user.js');
const logger = require('./../lib/logger');

describe(`./${pkg.name} deploy`, () => {
  describe('without error', () => {
    before(() => {
      sinon.stub(user, 'setup').callsArgWith(1);
      sinon.stub(project, 'restore').callsArgWith(0);
      sinon.stub(service, 'validate').callsArgWith(1);
      sinon.stub(service, 'deploy').callsArgWith(1);
    });

    afterEach(() => {
      user.setup.reset();
      project.restore.reset();
      service.validate.reset();
      service.deploy.reset();
    });

    after(() => {
      user.setup.restore();
      project.restore.restore();
      service.validate.restore();
      service.deploy.restore();
    });

    it('should setup the user.', (cb) => {
      deploy.call(command, command, (err) => {
        expect(user.setup).to.be.calledOnce;
        cb(err);
      });
    });

    it('should restore the project.', (cb) => {
      deploy.call(command, command, (err) => {
        expect(project.restore).to.be.calledOnce;
        cb(err);
      });
    });

    it('should validate the service.', (cb) => {
      deploy.call(command, command, (err) => {
        expect(service.validate).to.be.calledOnce;
        cb(err);
      });
    });

    it('should deploy the service.', (cb) => {
      deploy.call(command, command, (err) => {
        expect(service.deploy).to.be.calledOnce;
        cb(err);
      });
    });
  });

  describe('with error', () => {
    const testErr = new Error('Test err');
    let processExit;
    let loggerError;

    before(() => {
      processExit = sinon.stub(process, 'exit');
      loggerError = sinon.stub(logger, 'error');

      sinon.stub(user, 'setup').callsArg(1);
      sinon.stub(project, 'restore').callsArg(0);

      // let's produce error here
      sinon.stub(service, 'validate').callsArgWith(1, testErr);
    });

    afterEach(() => {
      processExit.reset();
      loggerError.reset();
      user.setup.reset();
      project.restore.reset();
      service.validate.reset();
    });

    after(() => {
      processExit.restore();
      loggerError.restore();
      user.setup.restore();
      project.restore.restore();
      service.validate.restore();
    });

    it('should pass error to callback if both are present', (cb) => {
      deploy.call(command, command, (err) => {
        expect(err).to.exist;
        expect(loggerError).to.be.calledOnce;
        expect(loggerError).to.be.calledWith('%s', err);
        expect(err).to.equal(testErr);
        cb();
      });
    });

    it('should not pass error to callback if no callback', (cb) => {
      deploy.call(command, command);

      // we don't provide a callback to the 'deploy' command, so we have no way of knowing when it is done
      setTimeout(() => {
        expect(processExit).to.be.calledOnce;
        expect(processExit).to.be.calledWith(-1);
        expect(loggerError).to.be.calledOnce;
        expect(loggerError).to.be.calledWith('%s', testErr);
        cb();
      }, 1000);
    });
  });
});
