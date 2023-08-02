import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import AWS from "aws-sdk";
import * as uuid from "uuid";

const DocumentClient = new AWS.DynamoDB.DocumentClient();
const companyTable = process.env;

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  const body = JSON.parse(event.body);
  const id = uuid.v4();
  const company = {
    id,
    userId: 1,
    ...body,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(company),
  };
};
