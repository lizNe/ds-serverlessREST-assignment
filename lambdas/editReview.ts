import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidParameters = ajv.compile(
  schema.definitions["MovieReview"] || {}
);

// Initialize DynamoDB Document Client
const ddbDocClient = createDocumentClient();

// Lambda function for updating review text
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Extract path parameters and request body
    const parameters = event.pathParameters;
    const body = event.body ? JSON.parse(event.body) : {};

    // Check if required parameters are present
    if (!parameters || !parameters.movieId || !parameters.reviewerName || !body.content) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "Missing movieId, reviewerName, or content in request body" }),
      };
    }

    // Extract parameters from the event
    const movieId = parseInt(parameters.movieId);
    const reviewerName = parameters.reviewerName;
    const newContent = body.content;

    // Update review content in DynamoDB table
    await updateReviewContent(movieId, reviewerName, newContent);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "Review content updated successfully",
      }),
    };
  } catch (error: any) {
    // Return error response
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

// Function to update review content in DynamoDB table
async function updateReviewContent(movieId, reviewerName, newContent) {
  await ddbDocClient.send(
      new UpdateCommand({
          TableName: process.env.TABLE_NAME,
          Key: {
              movieId: movieId,
              reviewerName: reviewerName,
          },
          UpdateExpression: "SET content = :content", // Update 'content' field
          ExpressionAttributeValues: {
              ":content": newContent, // Use the new content
          },
      })
  );

}

// Create DynamoDB Document Client
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
