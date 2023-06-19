import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import * as AWS from "aws-sdk";

// const sqsClient = new SQSClient({ region: "eu-west-1" });
const sqsClient = new AWS.SQS({ region: "eu-west-1" });
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
    // const data = await sqsClient.send(new SendMessageCommand(params));
    console.log("trying to send message");
    const data = (await sqsClient
      .sendMessage(params)
      .promise()) as AWS.SQS.SendMessageResult;
    console.log("result delete message", data);

    return {
      statusCode: 200,
      body: JSON.stringify({ result: data.MessageId }),
    };
  } catch (err) {
    console.log("Error:", JSON.stringify(err));
    return {
      statusCode: 500,
      body: JSON.stringify({ Error: err }),
    };
  }
};
