import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginDto {
  email: string;
  password: string;
}

export class User {
  constructor(
    private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
    private readonly usersTable = process.env.USERS_TABLE,
    private readonly userIndex = process.env.USERS_EMAIL_INDEX,
    private readonly secretAuth = process.env.SECRET_AUTH
  ) {}

  async registerUser(createUserDto: CreateUserDto) {
    const { firstName, lastName, email, password } = createUserDto;

    try {
      const isUserExist = await this.getUserByEmail(email);

      if (isUserExist) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "User is alreasy exist" }),
        };
      }

      const id = uuid.v4();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        id,
        firstName,
        lastName,
        email,
        password: hashedPassword,
      };
      await this.docClient
        .put({
          TableName: this.usersTable,
          Item: newUser,
        })
        .promise();

      const payload = {
        user: {
          id: newUser.id,
        },
      };

      console.log("user register");
      const token = jwt.sign(payload, this.secretAuth, { expiresIn: 360000 });
      console.log("token:", token);
      return {
        statusCode: 201,
        body: JSON.stringify({ token }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ Error: "Error creating user" }),
      };
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    try {
      const user = (await this.getUserByEmail(email)) as {
        id: string;
        email: string;
        password: string;
      };

      if (!user) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "User not found" }),
        };
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (!isPasswordMatch) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Authentication fail" }),
        };
      }

      console.log("isPasswordMatch:", isPasswordMatch);

      const payload = {
        user: {
          id: user.id,
        },
      };

      const token = jwt.sign(payload, this.secretAuth, { expiresIn: 360000 });
      console.log("token:", token);

      return {
        statusCode: 200,
        body: JSON.stringify({ token }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify("Server Error"),
      };
    }
  }

  async getUserByEmail(email: string) {
    const response = await this.docClient
      .query({
        TableName: this.usersTable,
        IndexName: this.userIndex,
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
      .promise();

    console.log("response.Items", response.Items);

    if (response.Items.length > 0) {
      return response.Items[0];
    }

    return false;
  }
}
