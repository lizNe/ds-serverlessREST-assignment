import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import {
    DynamoDBDocumentClient,
    GetCommand,
} from "@aws-sdk/lib-dynamodb";

const ajv = new Ajv();
const isValidParameters = ajv.compile(
    schema.definitions["MovieReview"] || {}
);

// Initialize DynamoDB Document Client
const ddbDocClient = createDocumentClient();
const translateClient = new TranslateClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        const parameters = event.pathParameters;
        const language = event.queryStringParameters?.language || 'en'; // Default language is English

        // Check if required parameters are present
        if (!parameters || !parameters.reviewerName || !parameters.movieId) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing reviewerName or movieId in path parameters" }),
            };
        }

        const movieId = parseInt(parameters.movieId);
        const reviewerName = parameters.reviewerName;

        // Retrieve the review content from DynamoDB
        const reviewContent = await getReviewContent(movieId, reviewerName);
        if (!reviewContent) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Review not found" }),
            };
        }

        // Translate review content to the specified language
        const translatedContent = await translateText(reviewContent, language);

        // Return success response with translated content
        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                translatedContent,
            }),
        };
    } catch (error: any) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};

async function getReviewContent(movieId, reviewerName) {
    try {
        const commandOutput = await ddbDocClient.send(
            new GetCommand({
                TableName: process.env.TABLE_NAME,
                Key: {
                    movieId: movieId,
                    reviewerName: reviewerName,
                },
            })
        );

        if (!commandOutput.Item || !commandOutput.Item.content) {
            return null; // Review not found or content missing
        }

        return commandOutput.Item.content; // Return the review content
    } catch (error) {
        console.error("Error retrieving review content:", error);
        throw error;
    }
}

async function translateText(text, language) {
    try {
        const command = new TranslateTextCommand({
            SourceLanguageCode: "auto", // Assuming the text language is auto-detected
            TargetLanguageCode: language,
            Text: text,
        });
        const response = await translateClient.send(command);

        let translatedContent;
        if (response.TranslatedText) {
            translatedContent = response.TranslatedText;
        } else {
            translatedContent = "Translation not available";
        }

        return translatedContent;
    } catch (error) {
        console.error("Error in translation:", error);
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
