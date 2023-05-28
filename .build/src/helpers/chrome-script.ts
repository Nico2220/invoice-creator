// const launchChrome = require  ("@serverless-chrome/lambda");
// const request = require  ("superagent");

import * as launchChrome from "@serverless-chrome/lambda";
import * as request from "superagent";

export const getChrome = async () => {
  const chrome = await launchChrome();

  const response = await request
    .get(`${chrome.url}/json/version`)
    .set("Content-Type", "application/json");

  const endpoint = response.body.webSocketDebuggerUrl;

  return {
    endpoint,
    instance: chrome,
  };
};
