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
    const queryParams = event.queryStringParameters;

    // Assign movieId from path parameters
    const movieIdFromPath = parameters?.movieId ? parseInt(parameters.movieId) : undefined;

    // Assign movieId from query parameters
    const movieIdFromQuery = queryParams?.movieId ? parseInt(queryParams.movieId) : undefined;

    // Use the movieId from either path parameters or query parameters
    const movieId = movieIdFromPath || movieIdFromQuery;

    // Check if movieId is missing
    if (!movieId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie ID" }),
      };
    }

     // Extract reviewerName from path parameters
     const reviewerName = parameters?.reviewerName;

    // Extract minRating from query parameters
    const minRating = queryParams?.minRating ? parseFloat(queryParams.minRating) : undefined;

    // Prepare the DynamoDB query command input
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :m",
      ExpressionAttributeValues: {
        ":m": movieId,
      },
    };

    // Extract year from path parameters
const year = parameters?.year ? parseInt(parameters.year) : undefined;

// Check if year is provided
if (year) {
  commandInput.FilterExpression = "begins_with(reviewDate, :year)";
  commandInput.ExpressionAttributeValues = {
    ...commandInput.ExpressionAttributeValues,
    ":year": year.toString(),
  };
}

// // Check if reviewerName is provided
 if (reviewerName) {
   commandInput.FilterExpression = "reviewerName = :reviewerName";
  commandInput.ExpressionAttributeValues = commandInput.ExpressionAttributeValues || {}; // Initialize if undefined
  commandInput.KeyConditionExpression += " AND reviewerName = :r";
  commandInput.ExpressionAttributeValues[":r"] = reviewerName; }

    // Check if minRating is provided and valid
    if (minRating && minRating >= 0 && minRating <= 10) {
      commandInput = {
        ...commandInput,
        FilterExpression: "rating >= :minRating",
        ExpressionAttributeValues: {
          ...commandInput.ExpressionAttributeValues,
          ":minRating": minRating,
        },
      };
    }

    // Execute the DynamoDB query
    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

    // Return the query results
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: commandOutput.Items,
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
