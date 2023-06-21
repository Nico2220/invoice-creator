import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { User } from "../../user/User";

const user = new User();

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  const body = JSON.parse(event.body) as {
    email: string;
    password: string;
    id: string;
  };

  const { email, password } = body;

  return await user.login({ email, password });
};
