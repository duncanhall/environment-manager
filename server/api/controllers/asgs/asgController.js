/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let getAllASGs = require('queryHandlers/ScanCrossAccountAutoScalingGroups');
let getAccountASGs = require('queryHandlers/ScanAutoScalingGroups');
let getASG = require('queryHandlers/GetAutoScalingGroup');
let getDynamo = require('queryHandlers/GetDynamoResource');
let GetLaunchConfiguration = require('queryHandlers/GetLaunchConfiguration');
let SetLaunchConfiguration = require('commands/launch-config/SetLaunchConfiguration');
let SetAutoScalingGroupSize = require('commands/asg/SetAutoScalingGroupSize');
let SetAutoScalingGroupSchedule = require('commands/asg/SetAutoScalingGroupSchedule');
let GetAutoScalingGroupScheduledActions = require('queryHandlers/GetAutoScalingGroupScheduledActions');


/**
 * GET /asgs?account=xyz
 */
function getAsgs(req, res, next) {
  const accountName = req.swagger.params.account.value;

  if (accountName !== undefined) {
    return getAccountASGs({ accountName }).then(data => res.json(data)).catch(next);
  } else {
    return getAllASGs().then(data => res.json(data)).catch(next);
  }
}

/**
 * GET /asgs/{name}?account=xyz
 */
function getAsgByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const accountName = req.swagger.params.account.value;

  return getASG({ accountName, autoScalingGroupName }).then(data => res.json(data)).catch(next);
}

/**
 * GET /asgs/{name}/ips?account=xyz
 */
function getAsgIps(req, res, next) {
  const key = req.swagger.params.name.value;
  const accountName = req.swagger.params.account.value;
  const resource = 'asgips';
  const exposeAudit = 'version-only';

  return getDynamo({ accountName, key, resource, exposeAudit }).then(data => res.json(data)).catch(next);
}

/**
 * GET /asgs/{name}/launch-config?account=xyz
 */
function getAsgLaunchConfig(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const autoScalingGroupName = req.swagger.params.name.value

  return GetLaunchConfiguration({ accountName, autoScalingGroupName }).then(data => res.json(data)).catch(next);
}

/**
 * PATCH /asgs/{name}?account=xyz
 */
function patchAsg(req, res, next) {
  throw 'not implemented';
}

/**
 * GET /asgs/{name}/scaling-schedule
 */
function getScalingSchedule(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const autoScalingGroupName = req.swagger.params.name.value;
  
  GetAutoScalingGroupScheduledActions({ accountName, autoScalingGroupName }).then(data => res.json(data)).catch(next);
}

/**
 * PUT /asgs/{name}/scaling-schedule
 */
function putScalingSchedule(req, res, next) {
  const body = req.swagger.params.body.value;
  const accountName = req.swagger.params.account.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return co(function* () {
    let data = {};

    if (body.UpdateSchedule !== undefined) {
      let schedule = body.UpdateSchedule.schedule;
      let propagateToInstances = body.UpdateSchedule.propagateToInstances;

      data.UpdateSchedule = yield SetAutoScalingGroupSchedule({ accountName, autoScalingGroupName, schedule, propagateToInstances });
    }

    res.json(data);
  }).catch(next);
}

/**
 * PUT /asgs/{name}/size?account=xyz
 */
function putAsgSize(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const autoScalingGroupName = req.swagger.params.name.value;
  const body = req.swagger.params.body.value;
  const autoScalingGroupMinSize = body.min;
  const autoScalingGroupDesiredSize = body.desired;
  const autoScalingGroupMaxSize = body.max;

  SetAutoScalingGroupSize({ accountName, autoScalingGroupName,
    autoScalingGroupMinSize, autoScalingGroupDesiredSize, autoScalingGroupMaxSize })
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /asgs/{name}/launch-config?account=xyz
 */
function putAsgLaunchConfig(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const data = req.swagger.params.body.value
  const autoScalingGroupName = req.swagger.params.name.value

  return SetLaunchConfiguration({ accountName, autoScalingGroupName, data }).then(data => res.json(data)).catch(next);
}

module.exports = {
  getAsgs,
  getAsgByName,
  getAsgIps,
  getAsgLaunchConfig,
  putScalingSchedule,
  getScalingSchedule,
  patchAsg,
  putAsgSize,
  putAsgLaunchConfig
};
