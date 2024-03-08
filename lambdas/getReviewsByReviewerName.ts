import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";


const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    const parameters = event.pathParameters;
    if (!parameters || !parameters.reviewerName) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "Missing reviewerName" }),
      };
    }

    const reviewerName = parameters.reviewerName;

    const reviews = await getReviewsByReviewerName(reviewerName);

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

async function getReviewsByReviewerName(reviewerName) {
    const commandOutput = await ddbDocClient.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: "reviewerName = :reviewerName",
        ExpressionAttributeValues: {
          ":reviewerName": reviewerName,
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
