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

    // Prepare the DynamoDB query command input
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :m",
      ExpressionAttributeValues: {
        ":m": movieId,
      },
    };
    
    

    if (queryParams && isValidQueryParams(queryParams)) {
      if ("reviewerName" in queryParams) {
        commandInput = {
        ...commandInput,
        IndexName: "reviewerNameIx",
        KeyConditionExpression: " movieId = :m and begins_with(reviewerName, :r)",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":r": queryParams.reviewerName,
        },
      };
      } else if ("rating" in queryParams) {
        commandInput = {
          ...commandInput,
        KeyConditionExpression: "movieId = :m and rating >= :rating",
        ExpressionAttributeValues:{
          ":m": movieId,
          ":rating": queryParams.rating,
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m",
        ExpressionAttributeValues: {
          ":m": movieId,
        },
      };
    }
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
