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

const async = require('async');

const path = require('path');

const { AuthOptionsNames } = require('./../../../../lib/constants');
const { isEmpty, readJSON, writeJSON } = require('./../../../../lib/utils');
const testsConfig = require('./../../../tests-config');
const { execCmdWithAssertion, setup } = require('./../../../tests-helper');

const fixtureUser = require('./../../../fixtures/user.json');
const fixtureInternalDataLink = require('./../../../fixtures/kinvey-dlc.json');
const fixtureApp = require('./../../../fixtures/app.json');

const existentUserOne = fixtureUser.existentOne;
const tokenOne = fixtureUser.tokenOne;
const nonExistentUser = fixtureUser.nonexistent;
const defaultServiceId = fixtureInternalDataLink.id;

const baseCmd = 'flex deploy';

function testFlexDeploy(profileName, optionsForCredentials, validUser, done) {
  let cmd = `${baseCmd} --verbose`;
  if (profileName) {
    cmd = `${cmd} --${AuthOptionsNames.PROFILE} ${profileName}`;
  }

  if (!isEmpty(optionsForCredentials)) {
    cmd = `${cmd} --${AuthOptionsNames.EMAIL} ${optionsForCredentials.email} --${AuthOptionsNames.PASSWORD} ${optionsForCredentials.password}`;
  }

  const apiOptions = {
    jobType: 'deployDataLink'
  };
  if (!isEmpty(validUser)) {
    apiOptions.token = validUser.token;
    apiOptions.existentUser = { email: validUser.email };
  }

  execCmdWithAssertion(cmd, null, apiOptions, true, true, false, done);
}

describe(`${baseCmd}`, () => {
  const validUserOne = {
    email: existentUserOne.email,
    token: tokenOne
  };

  before((done) => {
    async.series([
      (next) => {
        setup.clearGlobalSetup(null, next);
      },
      (next) => {
        setup.clearProjectSetup(null, next);
      },
      (next) => {
        setup.createProfiles('flexDeployProfile', next);
      }
    ], done);
  });

  after((done) => {
    setup.clearProjectSetup(null, done);
  });

  after((done) => {
    setup.clearGlobalSetup(null, done);
  });

  describe('when project setup is non-existent', () => {
    it('by not specifying profile nor credentials when one profile should use it and fail', (done) => {
      // since it's just one profile, it should be used and a failure because of the missing project setup is expected
      const cmd = `${baseCmd}`;
      execCmdWithAssertion(cmd, null, null, true, false, true, (err) => {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('when project setup exists', () => {
    const activeProfile = 'profileToSetAsActive';

    // lets just use the active profile
    before((done) => {
      async.series([
        (next) => {
          setup.createProfile(activeProfile, existentUserOne.email, existentUserOne.password, next);
        },
        (next) => {
          setup.setActiveProfile(activeProfile, false, next);
        }
      ], done);
    });

    describe('is valid', () => {
      before('setValidProjectSetup', (done) => {
        setup.createProjectSetup(null, done);
      });

      after('clearProjectSetup', (done) => {
        setup.clearProjectSetup(null, done);
      });

      describe.skip("and user's project is valid", () => {
        it('should succeed', (done) => {
          testFlexDeploy(activeProfile, null, validUserOne, done);
        });
      });

      describe("and user's project is invalid", () => {
        const pathPackageJSON = path.join(testsConfig.paths.package, 'package.json');
        let initialPackageSetup;

        before('makeUserProjectInvalid', (done) => {
          async.series([
            function getInitialPackageSetup(next) {
              readJSON(pathPackageJSON, (err, data) => {
                if (err) {
                  return next(err);
                }

                initialPackageSetup = data;
                next();
              });
            },
            function messUpPackageSetup(next) {
              // kinvey-flex-sdk must be included in the dependencies
              const invalidPackageContent = { dependencies: {} };
              writeJSON(pathPackageJSON, invalidPackageContent, next);
            }
          ], done);
        });

        after('restorePackageSetup', (done) => {
          writeJSON(pathPackageJSON, initialPackageSetup, done);
        });

        it('should fail', (done) => {
          const cmd = `${baseCmd}`;
          execCmdWithAssertion(cmd, null, null, true, false, true, (err) => {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    describe("is not valid and user's project is valid", () => {
      before('setInvalidProjectSetup', (done) => {
        setup.createProjectSetup({
            domainEntityId: fixtureApp.id,
            serviceName: fixtureInternalDataLink.name,
          }, done);
      });

      after('clearProjectSetup', (done) => {
        setup.clearProjectSetup(null, done);
      });

      it('should fail', (done) => {
        const cmd = `${baseCmd}`;
        execCmdWithAssertion(cmd, null, null, true, false, true, (err) => {
          expect(err).to.not.exist;
          done();
        });
      });
    });
  });
});