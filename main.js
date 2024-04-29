const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const url = "https://www.carcomplaints.com";
const urls = [];
const modelsJSON = {};

async function fetchData(url) {
  console.log("Crawling data...", url);
  try {
    const response = await axios(url);
    if (response.status !== 200) {
      console.error("Error occurred while fetching data for", url);
      return;
    }
    return response;
  } catch (err) {
    console.error("Error fetching data for", url, err);
  }
}

(async () => {
  try {
    const response = await fetchData(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const modelTable = $(
      "div#container > div#content > div#primary > div#makes"
    );

    modelTable.each(function () {
      let title = $(this)
        .find("ul li")
        .each(function () {
          const modelTitle = $(this)
            .text()
            .replace(/\s+|\/+|&+/g, "_");
          modelsJSON[modelTitle] = { url: `${url}/${modelTitle}/` };
          urls.push(`${url}/${modelTitle}/`);
        });
    });

    const allResponses = await Promise.all(urls.map((url) => fetchData(url)));
    allResponses.forEach((res, index) => {
      if (res) {
        const html = res.data;
        const $ = cheerio.load(html);

        // Worst Model & Year
        const worstModelYear = $(
          "div#container > div#content > div#primary > div#intro.group > dl > dd.year"
        ).text();
        const worstModel = $(
          "div#container > div#content > div#primary > div#intro.group > dl > dd.complaint"
        ).text();
        const worstModelStr = worstModelYear + " " + worstModel;

        // Update modelsJSON with worstModel data
        const currentModel = urls[index].split("/")[3];
        modelsJSON[currentModel].worstModel = worstModelStr;

        // Models within current Model Year
        const currentModels = $(
          "div#container > div#content > div#primary > div.browseby.group > div.browseby-content > ul li a"
        )
          .map((_, element) => $(element).text().split(" ").join("_"))
          .toArray();
        modelsJSON[currentModel].models = currentModels;

        const currentModelsURL = $(
          "div#container > div#content > div#primary > div.browseby.group > div.browseby-content > ul li a"
        )
          .map((_, element) => {
            if ($(element).find("span.count").text() === "0") {
              // Skip models with no complaints
              return;
            } else {
              return url + $(element).attr("href");
            }
          })
          .get();
        modelsJSON[currentModel].modelsURL = currentModelsURL;
        // Issues
        const allProblems = $(".complaints.worst.p3 li")
          .map((_, element) => {
            // Find the "span.problem" element within the current "li" element
            const problemElement = $(element).find("h4 a span.problem");

            // Extract and trim the text content
            return problemElement.text().trim();
          })
          .toArray();
        modelsJSON[currentModel].problems = allProblems;
      }
    });
    for (var currentModel in modelsJSON) {
      if (
        modelsJSON[currentModel].modelsURL &&
        Array.isArray(modelsJSON[currentModel].modelsURL)
      ) {
        for (var modelURL of modelsJSON[currentModel].modelsURL) {
          await processModel(modelURL, currentModel, modelsJSON);
        }
      }
    }
    console.log(modelsJSON);
    fs.writeFileSync("models.json", JSON.stringify(modelsJSON, null, 2));
    console.log("models.json file saved successfully!");
  } catch (err) {
    console.error("An error occurred:", err);
  }
})();
async function processModel(modelURL, currentModel, modelsJSON) {
  try {
    const specificProblemsResponse = await fetchData(modelURL);
    if (specificProblemsResponse) {
      const html = specificProblemsResponse.data;
      const $ = cheerio.load(html);

      const selectors = [
        ".complaints.worst.p3 li",
        ".complaints.worst.p2 li",
        ".complaints.worst.p1 li",
        ".complaints.worst.p4 li",
      ];

      const modelSpecificProblems = {};

      // Ensure the model-specific problems object is initialized
      modelsJSON[currentModel].modelSpecificProblems =
        modelsJSON[currentModel].modelSpecificProblems || {};

      // Iterate over each selector
      selectors.forEach((selector) => {
        // Find elements based on the selector
        const carElements = $(selector).find("h4 a span.vehicle");
        const problemElements = $(selector).find("h4 a span.problem");

        // Map each car element to its corresponding problem element
        carElements.each((index, element) => {
          const car = $(element).text().trim();
          const problem = problemElements.eq(index).text().trim();
          if (car && problem) {
            modelSpecificProblems[car] = problem;
          }
        });
      });

      // Store the model-specific problems in the modelsJSON object
      const parts = modelURL.split("/");
      const modelName = parts[parts.length - 2] + " " + parts[parts.length - 1];
      modelsJSON[currentModel].modelSpecificProblems[modelName] =
        modelSpecificProblems;

      // Get and store the car diagnose paragraph
      const carDiagnoseParagraph = $(
        "div#container > div#content > div#primary > div#intro.group > p"
      );
      if (carDiagnoseParagraph.length > 0) {
        modelsJSON[currentModel].modelSpecificProblems[
          modelName
        ].modelDiagnoseParagraph = carDiagnoseParagraph.text().trim();
      }

      // Get and store the model's worst year
      const modelWorstYear = $(
        "div#container > div#content > div#primary > div#intro.group > dl dd.year"
      )
        .text()
        .trim();
      modelsJSON[currentModel].modelSpecificProblems[modelName].modelWorstYear =
        modelWorstYear;

      const barChartData = $("ul.timeline li");

      // Initialize an empty array to store the scraped data
      const scrapedData = [];

      // Loop through each <li> element and extract the relevant information
      barChartData.each((index, element) => {
        // Extract the label (year)
        const label = $(element).find(".label").text();

        // Extract the height of the bar (percentage)
        const height = parseFloat(
          $(element)
            .find(".bar")
            .attr("style")
            .match(/height: ([0-9.]+)%/)[1]
        );

        // Extract the count
        const count = parseInt($(element).find(".count").text());

        // Store the extracted data in an object
        const dataPoint = {
          year: label,
          percentage: height,
          count: count,
        };

        // Push the object to the array
        scrapedData.push(dataPoint);
      });

      // Output the scraped data
      modelsJSON[currentModel].modelSpecificProblems[
        modelName
      ].modelProblemsYearBarChart = scrapedData;
    }
  } catch (error) {
    console.error(error);
  }
}

