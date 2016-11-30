/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Created by mczyz on 30/11/16.
 */

var numberOfDocuments = 10000,
    localDb;

function callWithLog(fn, message) {
    console.log(message + ' ' + (new Date().toLocaleTimeString()));
    return fn().then(function () {
        console.log('DONE ' + (new Date().toLocaleTimeString()));
    });
}

function createDatabase () {
    localDb = new PouchDB('LOCALDBVIEW');
    return Q.when();
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


var jxcoreLoaded = false,
    testRunning = false,
    queryTime;

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
        jxcore.isReady(function() {
            jxcore('testFinished').register(function (executionTime) {
                setLabel('jxcoretest', 'FINISHED (' + executionTime + 's)');
                testRunning = false;
            });
            jxcore('app.js').loadMainFile(function(ret, err) {
                console.log('jxcore loaded');
                jxcoreLoaded = true;
            });
        });
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

function setLabel (labelId, text) {
    var labelElement = document.getElementById(labelId);
    labelElement.innerHTML = text;
}

function testWebView () {
    if (testRunning) {
        return;
    }
    testRunning = true;
    setLabel('webviewtest', 'STARTED');

    callWithLog(createDatabase, 'Create database')
        .then(function () {
            return callWithLog(addData, 'Add data');
        })
        .then(function () {
            return callWithLog(addView, 'Add view');
        })
        .then(function () {
            return callWithLog(queryDb, 'Query view');
        })
        .then(function () {
            return callWithLog(destroyDatabase, 'Destroy db');
        })
        .then(function () {
            setLabel('webviewtest', 'FINISHED (' + queryTime + 's)');
            testRunning = false;
        });
}

function testJXCore () {
    if (testRunning) {
        return;
    }
    testRunning = true;
    setLabel('jxcoretest', 'STARTED');

    jxcore('runTest').call();
}

app.initialize();