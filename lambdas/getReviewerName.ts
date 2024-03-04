import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieReviewQueryParams"] || {}
);

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters = event.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const reviewerName = parameters?.reviewerName;

    if (!movieId || !reviewerName) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "Missing movieId or reviewerName" }),
      };
    }

    console.log(`Querying for movieId ${movieId} and reviewerName ${reviewerName}`);

    const reviews = await getReviewerByName(movieId, reviewerName);

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

async function getReviewerByName(movieId: number, reviewerName: string) {
  const commandInput: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: "movieId = :m AND reviewerName = :r",
    ExpressionAttributeValues: {
      ":m": movieId,
      ":r": reviewerName,
    },
  };

  try {
    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));
    return commandOutput.Items;
  } catch (error) {
    console.error("Error fetching reviewer data:", error);
    throw error;
  }
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