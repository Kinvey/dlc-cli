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

const async = require('async');

const { AuthOptionsNames } = require('./../../../../lib/Constants');
const { buildCmd, execCmdWithAssertion, setup, testers } = require('../../../TestsHelper');

const fixtureUser = require('./../../../fixtures/user.json');

const existentUserOne = fixtureUser.existentOne;
const baseCmd = 'website list';

describe(baseCmd, () => {
  const jsonOptions = testers.getJsonOptions();
  const defaultFlags = testers.getDefaultFlags();
  const noCliOptions = null;
  const noPosArgs = null;

  before((done) => {
    setup.clearGlobalSetup(null, done);
  });

  describe('using active profile', () => {
    const activeProfile = 'activeProfile';

    before((done) => {
      async.series([
        (next) => {
          setup.clearGlobalSetup(null, next);
        },
        (next) => {
          setup.setActiveProfile(activeProfile, true, next);
        }
      ], done);
    });

    after((done) => {
      setup.clearGlobalSetup(null, done);
    });

    it('when there are sites should output default format', (done) => {
      const cmd = buildCmd(baseCmd, noPosArgs, noCliOptions, defaultFlags);
      execCmdWithAssertion(cmd, null, null, true, true, false, null, done);
    });

    it('when there are sites should output JSON', (done) => {
      const cmd = buildCmd(baseCmd, noPosArgs, jsonOptions, defaultFlags);
      execCmdWithAssertion(cmd, null, null, true, true, false, null, done);
    });

    it('when there are no sites should succeed', (done) => {
      const cmd = buildCmd(baseCmd, noPosArgs, noCliOptions, defaultFlags);
      const apiOptions = {
        sites: []
      };
      execCmdWithAssertion(cmd, null, apiOptions, true, true, false, null, done);
    });
  });

  describe('using one-time session', () => {
    before((done) => {
      setup.clearGlobalSetup(null, done);
    });

    it('when there are sites should output default format', (done) => {
      const cliOptions = {
        [AuthOptionsNames.EMAIL]: existentUserOne.email,
        [AuthOptionsNames.PASSWORD]: existentUserOne.password
      };
      const apiOptions = { token: fixtureUser.tokenOne };
      const cmd = buildCmd(baseCmd, noPosArgs, cliOptions, defaultFlags);
      execCmdWithAssertion(cmd, null, apiOptions, true, true, false, null, done);
    });
  });

  describe('without auth', () => {
    before((done) => {
      setup.clearGlobalSetup(null, done);
    });

    it('should fail', (done) => {
      const cmd = buildCmd(baseCmd, noPosArgs, noCliOptions, defaultFlags);
      execCmdWithAssertion(cmd, null, null, true, true, false, null, done);
    });
  });
});
