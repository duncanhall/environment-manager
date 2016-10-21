/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let notImplemented = require('api/api-utils/notImplemented');

/* eslint-disable import/no-extraneous-dependencies */
let auditLogReader = require('modules/auditLogReader');
let base64 = require('modules/base64');
let logger = require('modules/logger');
let route = require('modules/helpers/route');
let weblink = require('modules/weblink');
/* eslint-enable import/no-extraneous-dependencies */

let fp = require('lodash/fp');
let Instant = require('js-joda').Instant;
let LocalDate = require('js-joda').LocalDate;
let ZoneOffset = require('js-joda').ZoneOffset;
let url = require('url');

function createAuditLogQuery(since, until, exclusiveStartKey, perPage, filter) {
  let rq = {
    limit: perPage || 10,
    maxDate: until.toString(),
    minDate: since.toString(),
  };
  if (exclusiveStartKey) {
    rq.exclusiveStartKey = exclusiveStartKey;
  }
  if (filter) {
    rq.filter = filter;
  }
  return rq;
}

function parseDate(str) {
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(str)) {
    return LocalDate.parse(str);
  } else {
    return LocalDate.ofInstant(Instant.parse(str), ZoneOffset.UTC);
  }
}

function createFilter(query) {
  logger.debug('Audit History: Creating filter.');
  let exprs = {
    'Entity.Type': val => ['=', ['attr', 'Entity', 'Type'], ['val', val]],
    'ChangeType': val => ['=', ['attr', 'ChangeType'], ['val', val]],
    'Entity.Key': val => ['=', ['attr', 'Entity', 'Key'], ['val', val]],
  };

  let filter = fp.flow(
    fp.pick(fp.keys(exprs)),
    fp.toPairs,
    fp.map(x => exprs[x[0]](x[1])),
    predicates => (predicates.length > 0 ? ['and'].concat(predicates) : undefined));

  return filter(query);
}

/**
 * GET /audit
 * TODO(Filip): extract code & remove duplication when old API is removed
 */
function getAuditLogs(request, response, next) {
  let redirectUrl = url.parse(request.originalUrl, true);
  redirectUrl.search = null;
  let query = redirectUrl.query;
  let now = LocalDate.now(ZoneOffset.UTC);

  function paramOrDefault(param, fn, defaultValue) {
    function f(x) {
      try {
        return fn(x);
      } catch (error) {
        logger.error(error);
        throw new Error(`Error parsing parameter: ${param}`);
      }
    }
    let t = fp.has(param)(query) ? fp.flow(fp.get(param), f)(query) : defaultValue;
    return t;
  }

  logger.debug('Audit History: Extracting parameters from request.');
  let since = request.swagger.params.since.value || now;
  let until = request.swagger.params.until.value || now;
  console.log(since, until);
  let exclusiveStartKey = paramOrDefault('exclusiveStartKey', base64.decode, undefined);

  function sendResponse(auditLog) {
    logger.debug('Audit History: Constructing navigation links');
    query.since = since.toString();
    query.until = until.toString();
    if (auditLog.LastEvaluatedKey) {
      query.exclusiveStartKey = base64.encode(auditLog.LastEvaluatedKey);
      response.header('Link', weblink.link({ next: url.format(redirectUrl) }));
    }
    logger.debug('Audit History: sending response');
    return response.status(200).send(auditLog.Items);
  }

  let filter = createFilter(query);
  let auditLogQuery = createAuditLogQuery(since, until, exclusiveStartKey, query.per_page, filter);
  return auditLogReader.getLogs(auditLogQuery)
    .then(sendResponse).catch(next);
}

/**
 * GET /audit/{key}
 */
function getAuditLogByKey(req, res, next) {
  notImplemented(res, 'Getting a specific audit log by key')
}

module.exports = {
  getAuditLogs,
  getAuditLogByKey
};
