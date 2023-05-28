import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { User } from "../../user/User";

const UserClass = new User();
export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  const body = JSON.parse(event.body);
  const { firstName, lastName, email, password } = body;

  return await UserClass.registerUser({ firstName, lastName, email, password });
};
