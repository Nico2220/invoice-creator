import { SQSEvent, SQSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import * as uuid from "uuid";
import fs from "fs";

const sqsClient = new AWS.SQS();
const s3 = new AWS.S3({});

const bucketName = process.env.INVOICES_S3_BUCKET;
const invoiceTable = process.env.INVOICES_TABLE;
const queueUrl = process.env.INVOICE_QUEUE_URL;
const docClient = new AWS.DynamoDB.DocumentClient();

interface InvoiceData {
  from: string;
  to: string;
  invoiceUrl?: string;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log("Processing  SQS Event...", JSON.stringify(event));

  for (const sqsRecord of event.Records) {
    console.log("sqsRecord: ", sqsRecord);

    try {
      const parsedBody = JSON.parse(sqsRecord.body) as InvoiceData;
      await saveInvoice(parsedBody);

      await createAndUploadPdfONS3();

      sqsClient.deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: sqsRecord.receiptHandle,
      });

      console.log("Record has been deleted", sqsRecord.receiptHandle);
    } catch (err) {}
  }
};

export async function createAndUploadPdfONS3() {
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

    const invoiceId = uuid.v4();
    const page = await browser.newPage();
    await page.setContent(`<div>Hello from pdf</div>`);
    await page.emulateMediaType("print");

    const pdfpath = `/tmp/${invoiceId}.pdf`;

    const pdfBuffer = await page.pdf({ format: "a4", path: pdfpath });

    const params = {
      Bucket: bucketName,
      Key: `${invoiceId}.pdf`,
      Body: pdfBuffer,
    };

    const s3Result = await s3.upload(params).promise();

    //register invoice in bd

    console.log("s3Result", s3Result);

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

async function saveInvoice(invoiceData: InvoiceData) {
  const item = {
    invoiceData,
    invoiceUrl: "",
  };
  await docClient
    .put({
      TableName: invoiceTable,
      Item: item,
    })
    .promise();

  return item;
}
