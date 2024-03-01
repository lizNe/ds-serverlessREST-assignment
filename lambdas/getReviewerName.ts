
console.log(JSON.stringify("https://wfal0o1awk.execute-api.eu-west-1.amazonaws.com/dev/movies/1234/reviews/Joe"))

///Database design for the year . 


import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log(JSON.stringify("https://wfal0o1awk.execute-api.eu-west-1.amazonaws.com/dev/movies/1234/reviews/Joe"))

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: "",
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

async function fetchMovieData(movieId: number) {
  const commandOutput = await ddbDocClient.send(
    new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id: movieId },
    })
  );
  return commandOutput.Item;
}

async function fetchCastData(movieId: number) {
  const commandOutput = await ddbDocClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :m",
      ExpressionAttributeValues: {
        ":m": movieId,
      },
    })
  );
  return commandOutput.Items;
}

function createDynamoDBDocumentClient() {
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
