/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let mkArn = require('modules/data-access/dynamoTableArn').mkArn;
let attachAuditMetadata = require('modules/data-access/dynamoAudit').attachAuditMetadata;
let describeDynamoTable = require('modules/data-access/describeDynamoTable');
let hashKeyAttributeName = require('modules/data-access/dynamoTableDescription').hashKeyAttributeName;
let tableArn = require('modules/data-access/dynamoTableDescription').tableArn;
let dynamoVersion = require('modules/data-access/dynamoVersion');
let dynamoTable = require('modules/data-access/dynamoTable');
let dynamoTableCache = require('modules/data-access/dynamoTableCache');
let dynamoSoftDelete = require('modules/data-access/dynamoSoftDelete');
let fp = require('lodash/fp');

function factory(physicalTableName, { ttl }) {
  let cachedTable = dynamoTableCache(physicalTableName, { ttl });
  let tableDescriptionPromise = () => mkArn({ tableName: physicalTableName }).then(describeDynamoTable);

  function create(item) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        attachAuditMetadata,
        record => ({ record }),
        dynamoVersion.compareAndSetVersionOnCreate(hashKeyAttributeName(description)),
        cachedTable.create.bind(null, tableArn(description))
      )(item)
    );
  }

  function $delete(item, expectedVersion) {
    return tableDescriptionPromise().then((description) => {
      let replaceWithDeleteMarker = fp.flow(
        x => ({ record: dynamoSoftDelete.deleteMarkerFor(x.key), metadata: x.metadata }),
        attachAuditMetadata,
        record => ({ record, expectedVersion }),
        dynamoVersion.compareAndSetVersionOnReplace,
        cachedTable.replace.bind(null, tableArn(description))
      );
      return replaceWithDeleteMarker(item)
        .then(_ => cachedTable.delete(tableArn(description), { key: item.key }));
    });
  }

  function get(key) {
    return tableDescriptionPromise()
      .then(description => cachedTable.get(tableArn(description), key));
  }

  function query(expression) {
    return tableDescriptionPromise()
      .then(description => dynamoTable.query(tableArn(description), expression));
  }

  function replace(item, expectedVersion) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        attachAuditMetadata,
        record => ({ record, expectedVersion }),
        dynamoVersion.compareAndSetVersionOnReplace,
        cachedTable.replace.bind(null, tableArn(description))
      )(item)
    );
  }

  function scan(expression) {
    return tableDescriptionPromise()
      .then(description => cachedTable.scan(tableArn(description), expression));
  }

  return {
    create,
    delete: $delete,
    get,
    query,
    replace,
    scan
  };
}

module.exports = factory;