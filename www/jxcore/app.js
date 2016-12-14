console.log('jxcore started');

var PouchDB = require('pouchdb'),
    Q = require('q'),
    path = require('path'),
    fs = require('fs'),
    numberOfDocuments = 6000,
    localDb,
    queryTime;

PouchDB.plugin(require('pouchdb-find'));

function callWithLog(fn, message) {
    console.log(message + ' ' + (new Date().toLocaleTimeString()));
    return fn().then(function () {
        console.log('DONE ' + (new Date().toLocaleTimeString()));
    });
}

function createDatabase () {
    var deferred = Q.defer();

    Mobile.getDocumentsPath(function(err, location) {
        var dbPrefix;

        if (err) {
            console.log('Error getting path');
            deferred.reject('Error getting path');
        } else {
            dbPrefix = path.join(location, 'database/');

            if (!fs.existsSync(dbPrefix)) {
                fs.mkdirSync(dbPrefix);
            }

            if (fs.existsSync(path.join(dbPrefix, 'LOCALDBJX'))) {
                console.log('DB exists before creation');
                deferred.reject('DB exists before it is created');
                return;
            }

            localDb = new PouchDB('LOCALDBJX', {
                db: require('leveldown-mobile'),
                prefix: dbPrefix
            });

            deferred.resolve();
        }
    });

    return deferred.promise;
}

function destroyDatabase () {
    return localDb.destroy();
}

function addData () {
    var i,
        allAdditions = [];
    for (i = 0; i < numberOfDocuments; i++) {
        doc = {
            "_id": "TestDoc" + i,
            "title": "TestTitle" + i
        };
        allAdditions.push(localDb.put(doc));
    }
    return Q.all(allAdditions);
}

function addView () {
    var ddoc = {
        _id: '_design/testdoc',
        views: {
            testdoc: {
                map: function mapFun(doc) {
                    if (doc.title) {
                        emit(doc.title);
                    }
                }.toString()
            }
        }
    };
    // save the design doc
    return localDb.put(ddoc);
}

function addIndex () {
    return localDb.createIndex({
        index: {
            fields: ['title']
        }
    });
}

function queryDb () {
    var startTime = new Date();
    return localDb.query('testdoc', {
        limit: 100,
        include_docs: true
    }).then(function (result) {
        var endTime = new Date();
        queryTime = (endTime.getTime() - startTime.getTime()) / 1000;
        console.log('Got result with ' + result.rows.length + ' rows');
    }).catch(function (err) {
        console.log('Got error ' + err);
    });
}

function findInDb () {
    var startTime = new Date();
    return localDb.find({
        selector: {title: {$lte: 'TestTitle99999'}},
        limit: 100
    }).then(function (result) {
        var endTime = new Date();
        queryTime = (endTime.getTime() - startTime.getTime()) / 1000;
        console.log('Got result with ' + result.docs.length + ' rows');
    }).catch(function (err) {
        console.log('Got error ' + err);
    });
}

Mobile('runTest').registerSync(function (useDbFind) {
    callWithLog(createDatabase, 'Create database')
        .then(function () {
            if (useDbFind) {
                return callWithLog(addIndex, 'Add index');
            }
            return callWithLog(addView, 'Add view');
        })
        .then(function () {
            return callWithLog(addData, 'Add data');
        })
        .then(function () {
            if (useDbFind) {
                return callWithLog(findInDb, 'Find in DB');
            }
            return callWithLog(queryDb, 'Query view');
        })
        .then(function () {
            return callWithLog(destroyDatabase, 'Destroy db');
        })
        .then(function () {
            Mobile('testFinished').call(queryTime, useDbFind);
        })
        .catch(function (error) {
            console.log('Test failed: ' + error)
            Mobile('testFinished').call(error, useDbFind);
        });
});