import { SQSEvent, SQSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import * as uuid from "uuid";
import fs from "fs";
import path from "path";

const sqsClient = new AWS.SQS();
const s3 = new AWS.S3({ signatureVersion: "v4" });

const bucketName = process.env.INVOICES_S3_BUCKET;
const invoiceTable = process.env.INVOICES_TABLE;
const queueUrl = process.env.INVOICE_QUEUE_URL;
const docClient = new AWS.DynamoDB.DocumentClient();

interface InvoiceData {
  id?: string;
  from: string;
  to: string;
  invoiceUrl?: string;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log("Processing  SQS Event...", JSON.stringify(event));

  for (const sqsRecord of event.Records) {
    try {
      const parsedBody = JSON.parse(sqsRecord.body) as InvoiceData;

      const id = uuid.v4();
      const item = {
        id,
        from: parsedBody.from,
        to: parsedBody.to,
        invoiceUrl: `https://${bucketName}.s3.eu-west-1.amazonaws.com/${id}.pdf`,
      };

      await saveInvoice(item);

      await createAndUploadPdfONS3(item);

      sqsClient.deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: sqsRecord.receiptHandle,
      });

      console.log("Record has been deleted", sqsRecord.receiptHandle);
    } catch (err) {
      console.log("Error:", JSON.stringify(err));
    }
  }
};

export async function createAndUploadPdfONS3({ id }: InvoiceData) {
  const path = await chromium.executablePath;
  try {
    const htmlFile = (await readFile()) as string;
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: path,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    console.log("Pupetter has benn lauch....");

    // const invoiceId = uuid.v4();
    const page = await browser.newPage();
    await page.setContent(htmlFile);
    await page.emulateMediaType("print");

    const pdfpath = `/tmp/${id}.pdf`;

    const pdfBuffer = await page.pdf({ format: "a4", path: pdfpath });

    const params = {
      Bucket: bucketName,
      Key: `${id}.pdf`,
      Body: pdfBuffer,
    };

    const s3Result = await s3.upload(params).promise();
    await browser.close();
    return s3Result.Key;
  } catch (err) {
    console.log("Error", JSON.stringify(err));
  }
}

async function getUploadUrl(invoiceId: string) {
  return s3.getSignedUrl("getObject", {
    Bucket: bucketName,
    Key: invoiceId,
    Expires: 300,
  });
}

async function saveInvoice(invoiceData: InvoiceData) {
  await docClient
    .put({
      TableName: invoiceTable,
      Item: invoiceData,
    })
    .promise();

  return invoiceData;
}

function readFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.resolve("../../../src/template/index.html"),
      "utf8",
      (err, data) => {
        if (err) reject(err);
        resolve(data);
      }
    );
  });
}
