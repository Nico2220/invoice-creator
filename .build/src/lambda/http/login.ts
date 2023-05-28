import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { User } from "../../user/User";

const user = new User();

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  const body = JSON.parse(event.body) as { email; password; id };

  const { email, password } = body;

  console.log("credentials = ", email, password);

  return await user.login({ email, password });
};
