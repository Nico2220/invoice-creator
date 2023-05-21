import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();

const usersTbale = process.env.USERS_TABLE;

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  const body = JSON.parse(event.body);

  const id = uuid.v4();
  const newItem = {
    id,
    ...body,
  };

  try {
    await docClient
      .put({
        TableName: usersTbale,
        Item: newItem,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ data: newItem }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ Error: "Error creating user" }),
    };
  }
};
