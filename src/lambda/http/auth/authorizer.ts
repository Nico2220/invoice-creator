import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";

const secretAuth = process.env.SECRET_AUTH;

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context
) => {
  console.log("event:", event["authorizationToken"]);

  const token = event["authorizationToken"];
  try {
    const decodedToken = jwt.verify(token, secretAuth) as {
      user: { id: string };
      iat: number;
      exp: number;
    };

    console.log("decodedToken=", decodedToken);

    return {
      principalId: JSON.stringify(decodedToken.user),
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "*",
          },
        ],
      },
    };
  } catch (err) {
    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*",
          },
        ],
      },
    };
  }
};
