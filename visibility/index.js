var pipeline = require("./src/extract-data").pipeline;
var fs = require("fs");
var shellPromise = require("./src/shellPromises").execute;

var repoStatsOverTime = {
  branchName: "experiment/improving-visibility_measurements",
  resultsJsonDirname: "results",
  startingRevision: "7f28be7ef273b9778f4cf805f3c43b2307624d8b",
  endingRevision: "9a5d866b06bbe1329ebbb9f30186bd842d31ae6d",
  attributesToExtract: ["name", "size", "stargazers_count", "subscribers_count", "open_issues_count", "forks"],
  data: {},
  measurementsList: [],
  repositoriesList: []
};


// pipeline.getBaseLineMeasurements(repoStatsOverTime)
//   .then(pipeline.getRevisionsList)
//   .then(pipeline.getDeltasBetweenMeasurements)
pipeline.getRevisionsList(repoStatsOverTime)
  .then(pipeline.getFileContentsAtRevisions)
  .then(pipeline.exportAsTable)
  .then(function(result) {
    console.log("Done");

    // console.log(repoStatsOverTime.table.join("\n"));
    fs.writeFile("longitudinal_visibility.csv", repoStatsOverTime.table.join("\n"), function(error) {
      if (!error) {
        console.log("Saved results in longitudinal_visibility.csv");
        shellPromise(" header=`grep year longitudinal_visibility.csv`" +
          " && sed s/$header//g longitudinal_visibility.csv > cleaned.csv" + // remove header lines
          " && echo $header > longitudinal_visibility.csv" + // prepend header
          " && sort --field-separator=',' -k 6,6  -k 1,1 -k 2,2 -k 3,3 cleaned.csv >> longitudinal_visibility.csv " + 
          " && rm cleaned.csv "
        ).then(function() {
          console.log("  Sorted by repository name and timestamp.");
        });

      } else {
        console.log("Unable to save results", error);
      }
    });
  });
