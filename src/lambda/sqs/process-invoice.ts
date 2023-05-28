import { SQSEvent, SQSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";

const sqsClient = new AWS.SQS();
const queueUrl = "";

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log("Processing  SQS Event...", JSON.stringify(event));

  for (const sqsRecord of event.Records) {
    console.log("sqsRecord: ", sqsRecord);

    const url = await createAndUploadPdfONS3();

    console.log("PDF URL", url);

    console.log("Record has been processed", sqsRecord.body);

    sqsClient.deleteMessage({
      QueueUrl: queueUrl,
      ReceiptHandle: sqsRecord.receiptHandle,
    });

    console.log("Record has been deleted", sqsRecord.receiptHandle);
  }
};

export async function createAndUploadPdfONS3() {
  console.log("from Screenshot....");
  const path = await chromium.executablePath;
  console.log("path=", path);
  let url;
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: path,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    console.log("Pupetter has benn lauch....");

    const page = await browser.newPage();
    await page.goto("https://www.google.com/");

    const url = await page.$eval("title", (el) => el.textContent);

    console.log("title", url);
    await browser.close();
    return url;
  } catch (err) {
    console.log("Error", JSON.stringify(err));
  }
}
