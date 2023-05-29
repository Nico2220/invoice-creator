import { SQSEvent, SQSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import puppeteer, { Page } from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import * as uuid from "uuid";
import { resolve } from "path";

const sqsClient = new AWS.SQS();
const s3 = new AWS.S3({
  signatureVersion: "4",
});
const queueUrl = "";

const bucketName = process.env.INVOICES_S3_BUCKET;

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
  let screenshot;
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

    screenshot = await page.screenshot({ path: "/tmp/screenshot.png" });
    const invoiceId = uuid.v4();
    // const uploadUrl = s3.upload(
    //   {
    //     Bucket: bucketName,
    //     Key: invoiceId,
    //     Body: screenshot,
    //   },
    //   (err, data) => {
    //     if (err) console.log("Error uploading File:", JSON.stringify(err));
    //     resolve(data.Key);
    //   }
    // );

    console.log("screenshot", screenshot);

    await browser.close();
    return screenshot;
  } catch (err) {
    console.log("Error", JSON.stringify(err));
  }
}

async function getUploadUrl(invoiceId: string) {
  return s3.getSignedUrl("putObject", {
    Bucket: bucketName,
    Key: invoiceId,
    Expires: 300,
  });
}
