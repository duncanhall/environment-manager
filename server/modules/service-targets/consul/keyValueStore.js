/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let utils = require('modules/utilities');
let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let HttpRequestError = require('modules/errors/HttpRequestError.class');
let consulClient = require('modules/consul-client');
let logger = require('modules/logger');
let retry = require('retry');
let _ = require('lodash');

function encodeValue(value) {
  if (!value) return null;
  return (typeof value === 'object') ? JSON.stringify(value) : value;
}

function decodeValue(encodedValue) {
  if (!encodedValue) return null;
  let value = utils.safeParseJSON(encodedValue);
  return value || encodedValue;
}

function asKeyValuePair(item) {
  return {
    key: item.Key,
    value: decodeValue(item.Value),
  };
}

function getTargetState(environment, parameters) {
  assert(parameters, 'Expected "parameters" not to be null or empty.');

  let promiseFactoryMethod = () => new Promise((resolve, reject) => {
    createConsulClient(environment).then((clientInstance) => {
      clientInstance.kv.get({ key: parameters.key, recurse: parameters.recurse }, (error, result) => {
        if (error) {
          return reject(new HttpRequestError(`An error has occurred contacting consul agent: ${error.message}`));
        }
        if (parameters.recurse) {
          let data = result ? result.map(asKeyValuePair) : [];
          return resolve(data);
        }
        if (result) {
          return resolve(asKeyValuePair(result));
        }
        return reject(new ResourceNotFoundError(`Key "${parameters.key}" in Consul key/value storage has not been found.`));
      });
    });
  });

  return executeAction(promiseFactoryMethod);
}

function getAllServiceTargets(environmentName, runtimeServerRole) {
  let key = `environments/${environmentName}/roles/${runtimeServerRole}/services`;
  return getTargetState(environmentName, { key, recurse: true }).then(data => _.map(data, 'value'));
}

function getServiceDeploymentCause(environmentName, deploymentId, instanceId) {
  let key = `deployments/${deploymentId}/nodes/${instanceId}`;
  let value = '[0].value.Cause';
  let defaultValue = 'Unknown';

  return getTargetState(environmentName, { key, recurse: true }).then(data => _.get(data, value, defaultValue));
}

function setTargetState(environment, parameters) {
  assert(parameters, 'Expected "parameters" not to be null or empty.');
  let promiseFactoryMethod = () => new Promise((resolve, reject) => {
    createConsulClient(environment).then((clientInstance) => {
      let encodedValue = encodeValue(parameters.value);
      let options = {};

      if (parameters.options) {
        if (parameters.options.expectedVersion !== undefined) {
          options.cas = parameters.options.expectedVersion;
        }
      }
      clientInstance.kv.set(parameters.key, encodedValue, options, (error, created) => {
        if (error) {
          return reject(new HttpRequestError(
            `An error has occurred contacting consul agent: ${error.message}`
          ));
        }
        if (!created) {
          return reject(new Error(
            `Consul '${parameters.key}' key cannot be updated`
          ));
        }
        logChange('SET', parameters.key, encodedValue);
        return resolve();
      });
    });
  });
  return executeAction(promiseFactoryMethod);
}

function removeTargetState(environment, parameters) {
  assert(parameters, 'Expected "parameters" not to be null or empty.');
  let promiseFactoryMethod = () => new Promise((resolve, reject) => {
    createConsulClient(environment).then((clientInstance) => {
      clientInstance.kv.get({ key: parameters.key, recurse: parameters.recurse }, (error, result) => {
        clientInstance.kv.del(parameters.key, (deletionError) => {
          if (!deletionError) {
            logChange('DELETE', parameters.key, result);
            return resolve();
          }
          return reject(new HttpRequestError(
            `An error has occurred contacting consul agent: ${deletionError.message}`
          ));
        });
      });
    });
  });

  return executeAction(promiseFactoryMethod);
}

function executeAction(promiseFactoryMethod) {
  let operation = retry.operation({
    retries: 3,
    minTimeout: 1000,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(() => {
      promiseFactoryMethod()
      .then(result => resolve(result))
      .catch((error) => {
        logger.error(error.toString(true));
        if ((error instanceof HttpRequestError) && operation.retry(error)) return;
        reject(operation.mainError());
      });
    });
  });
}

function createConsulClient(environment) {
  return consulClient.create({ environment }).catch(logger.error.bind(logger));
}

function logChange(operation, key, value) {
  logger.debug(`Consul key value store operation: ${operation} ${key}. ${value}`);
}

module.exports = {
  getTargetState,
  setTargetState,
  removeTargetState,
  getAllServiceTargets,
  getServiceDeploymentCause,
};
