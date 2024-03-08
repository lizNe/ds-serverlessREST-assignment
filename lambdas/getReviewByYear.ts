import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    const parameters = event.pathParameters;
    if (!parameters || !parameters.movieId || !parameters.year) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "Missing movieId or year" }),
      };
    }

    const movieId = parseInt(parameters.movieId);
    const year = parseInt(parameters.year);

    const reviews = await getReviewsByYear(movieId, year);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: reviews,
      }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

async function getReviewsByYear(movieId, year) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const commandOutput = await ddbDocClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: "reviewDateIx",
      KeyConditionExpression: "movieId = :movieId AND begins_with(reviewDate, :year)",
      ExpressionAttributeValues: {
        ":movieId": { N: movieId.toString() },
        ":year": { S: year.toString() },
      },
    })
  );
  return commandOutput.Items;
}

function createDocumentClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
      wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
