console.log('TestDb started');

var express = require('express'),
    app = express(),
    expressPouchDB = require('express-pouchdb'),
    PouchDB = require('pouchdb'),
    LeveldownMobile = require('leveldown-mobile'),
    fs = require('fs'),
    path = require('path'),
    port = 8080,
    server,
    localDb,
    dbName = 'LocalDB';


Mobile.getDocumentsPath(function(err, location) {
    if (err) {
        console.log('TestDb Error getting path');
        return;
    }
    else {
        dbPrefix = path.join(location, 'database/');

        if (!fs.existsSync(dbPrefix)) {
            fs.mkdirSync(dbPrefix);
        }

        var LevelDownPouchDB = PouchDB.defaults({
            db: LeveldownMobile,
            prefix: dbPrefix,
            mode: 'custom',
            overrideMode: {
                include: [
                    'routes/404',
                    'routes/all-docs',
                    'routes/attachments',
                    'routes/bulk-docs',
                    'routes/bulk-get',
                    'routes/changes',
                    'routes/db',
                    'routes/documents',
                    'routes/revs-diff',
                    'routes/root'
                ]
            }
        });

        app.use('/dbs', expressPouchDB(LevelDownPouchDB, {mode: 'minimumForPouchDB'}));
        localDb = new LevelDownPouchDB(dbName);

        server = app.listen(port, 'localhost');
        server.on('listening', function () {
            console.log('TestDb JXCore bound to and listening on %s:%s', server.address().address, server.address().port);
        });

        // create a design doc
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
        localDb.put(ddoc).catch(function (err) {
            if (err.name !== 'conflict') {
                throw err;
            }
            // ignore if doc already exists
        });

        // prefill DB with 6000 docs
        var i,
            doc;
        for (i = 0; i < 6000; i++) {
            doc = {
                "_id": "TestDoc" + i,
                "title": "TestTitle" + i
            };
            localDb.put(doc)
                .then(function () {
                    console.log("TestDb inserted data");
                })
                .catch(function (err) {
                    console.log("TestDb error while adding data: " + err);
                });
        }
    }
});