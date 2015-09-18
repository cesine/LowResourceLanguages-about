var Q = require("q");

var shellPromise = require("./shellPromises").execute;
var utils = require("./utils").utils;

var LIMIT_RUN_SIZE = 3;

var getBaseLineMeasurements = function(options) {
  var deferred = Q.defer();
  utils.getFileList(options.resultsJsonDirname).then(function(filelist) {
    options.filelist = filelist;


    var promises = [];
    options.filelist.map(function(filename) {
      if (!filename || promises.length >= LIMIT_RUN_SIZE) {
        return;
      }
      filename = options.resultsJsonDirname + "/" + filename;
      promises.push(utils.readFile(filename));
    });

    console.log("waiting on " + promises.length + " results");
    Q.allSettled(promises).then(function(results) {
      console.log("Files ", results);
      options.data = {
        abc: {
          timestamp: 123,
          "repo1": {
            name: "repo1",
            size: 678,
            stargazers_count: 3
          },
          "repo2": {
            name: "repo2",
            size: 670,
            stargazers_count: 8
          }
        }
      };
      options.measurementsList = ["abc"];
      options.repositoriesList = ["repo1", "repo2"];
      deferred.resolve(options);

    });
  });
  return deferred.promise;
};

var getRevisionsList = function(options) {
  var deferred = Q.defer();
  Q.nextTick(function() {
    options.measurementsList = ["abc", "efg", "hij"];
    deferred.resolve(options);
  });
  return deferred.promise;
};

var getDeltasBetweenMeasurements = function(options) {
  var deferred = Q.defer();
  Q.nextTick(function() {

    options.data.efg = {
      timestamp: 124,
      "repo1": {
        name: "repo1",
        size: 678,
        stargazers_count: 4
      },
      "repo2": {
        name: "repo2",
        size: 670,
        stargazers_count: 8
      }
    };

    options.data.hij = {
      timestamp: 125,
      "repo1": {
        name: "repo1",
        size: 678,
        stargazers_count: 4
      },
      "repo2": {
        name: "repo2",
        size: 670,
        stargazers_count: 8
      }
    };

    deferred.resolve(options);
  });
  return deferred.promise;
};

var exportAsTable = function(options) {
  var deferred = Q.defer();
  Q.nextTick(function() {

    options.table = [
      ["date", "name", "size", "stargazers_count"],
      [123, "repo1", 678, 3],
      [123, "repo2", 670, 8],
      [124, "repo1", 678, 4],
      [124, "repo2", 670, 8],
      [125, "repo1", 678, 4],
      [125, "repo2", 670, 8],
    ];

    deferred.resolve(options);
  });
  return deferred.promise;
};


var pipeline = {
  getBaseLineMeasurements: getBaseLineMeasurements,
  getRevisionsList: getRevisionsList,
  getDeltasBetweenMeasurements: getDeltasBetweenMeasurements,
  exportAsTable: exportAsTable
};


var extractResultFromJsonAtRevision = function(revision) {
  console.log("Working on " + revision);

  var getTimestamp = "git show --no-patch --format=%at " + revision;
  var timestampPromise = shellPromise(getTimestamp);

  timestampPromise.then(function(timestamp) {
    if (!timestamp) {
      return;
    }
    timestamp = timestamp.trim();
    // Make the timestamp javascript rather than unix
    timestamp = timestamp * 1000;

    console.log(revision + " was at " + new Date(timestamp));

    data[timestamp] = {};
    data.measurements++;
    return timestamp;
  }, function(reason) {
    return reason;
  }).fail(function(exception) {
    return exception;
  });
  return timestampPromise;
};

var prepareDataStructure = function(branchName) {
  var deferred = Q.defer();

  var findGitRevisisons = "git rev-list " + branchName;
  shellPromise(findGitRevisisons).then(function(results) {
    console.log("Here are the revisions in the repository " + results);
    if (!results) {
      deferred.resolve(data);
      return;
    }
    results = results.trim().split("\n");
    var stillProcessing = true;
    var promises = [];

    results.map(function(revision) {
      if (revision === oldestRelevantRevision) {
        stillProcessing = false;
      }
      if (stillProcessing && revision) {
        promises.push(extractResultFromJsonAtRevision(revision));
      }
    });

    console.log("waiting on " + promises.length + " results");
    Q.allSettled(promises).then(function(promiseResults) {
      deferred.resolve(data);
    });

  }, function(reason) {
    console.log(reason);
    deferred.reject(reason);
  }).fail(function(exception) {
    console.log(exception);
    deferred.reject(exception);
  });

  return deferred.promise;
};


exports.pipeline = pipeline;