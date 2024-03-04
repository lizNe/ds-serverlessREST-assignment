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
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;



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



    // Extract minRating from query parameters
    const minRating = queryParams?.minRating ? parseFloat(queryParams.minRating) : undefined;

    // Prepare the DynamoDB query command input  /// What lambdas function will return this is what the QueryCommandInput is. Query String part of the evtn obfect 
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :m",
      ExpressionAttributeValues: {
        ":m": movieId,
      },
    };



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

    // Execute the DynamoDB query. Will contain item ovjects .JSON OBJECTS HERE .. Add a filtering of an array of items to pick out the ones with the relevant rating . 
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


/////ONLY NEED PATH PARAMETERS FOR REVIEWERNMAE 