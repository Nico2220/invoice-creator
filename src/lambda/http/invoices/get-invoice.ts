import { APIGatewayProxyHandlerV2, APIGatewayProxyEventV2 } from "aws-lambda";
import {} from "aws-sdk";

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  const id = event.pathParameters.id;
  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
};
