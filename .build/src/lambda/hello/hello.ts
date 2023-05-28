import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2,
  context
) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "hello inoice -creator",
      input: event,
      context,
    }),
  };
};
