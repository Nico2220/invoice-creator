import { SQSEvent, SQSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import { getChrome } from "../../helpers/chrome-script";
import * as puppeteer from "puppeteer";

const sqsClient = new AWS.SQS();
const queueUrl =
  "https://sqs.eu-west-1.amazonaws.com/306486807413/invoice_queue";
export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log("Processing  SQS Event...", JSON.stringify(event));

  const chrome = await getChrome();

  for (const sqsRecord of event.Records) {
    console.log("sqsRecord: ", sqsRecord);

    const url = await createAndUploadPdfONS3(chrome);

    console.log("PDF URL", url);

    console.log("Record has been processed", sqsRecord.body);

    sqsClient.deleteMessage({
      QueueUrl: queueUrl,
      ReceiptHandle: sqsRecord.receiptHandle,
    });

    console.log("Record has been deleted", sqsRecord.receiptHandle);
  }
};

export async function createAndUploadPdfONS3(chromeEndpoint) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: chromeEndpoint,
  });

  const page = await browser.newPage();
  await page.goto("https://www.google.com/");

  console.log("newPageUrl=", await page.title());
}
