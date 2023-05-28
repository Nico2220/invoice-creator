import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import * as AWS from "aws-sdk";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: "eu-west-1" });
const queueUrl = "";
export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  const params = {
    DelaySeconds: 10,
    MessageBody: event.body,
    QueueUrl: queueUrl,
  };

  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    if (data) {
      console.log("Success, message sent. MessageID:", data.MessageId);
      return {
        statusCode: 200,
        body: JSON.stringify({ data }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ Error: "Bad request" }),
      };
    }
  } catch (err) {
    console.log("Error:", JSON.stringify(err));
  }
};
