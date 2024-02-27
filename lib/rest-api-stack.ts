import * as apig from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movies, movieCasts, movieReviews } from "../seed/movies";


export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    const movieCastsTable = new dynamodb.Table(this, "MovieCastTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "actorName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieCast",
    });

    movieCastsTable.addLocalSecondaryIndex({
      indexName: "roleIx",
      sortKey: { name: "roleName", type: dynamodb.AttributeType.STRING },
    });

    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "reviewId", type: dynamodb.AttributeType.NUMBER }, 
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });

    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "reviewerNameIx",
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
    });



    // Create a Global Secondary Index (GSI) on movieId
movieReviewsTable.addGlobalSecondaryIndex({
  indexName: 'MovieIdIndex',
  partitionKey: { name: 'movieId', type: dynamodb.AttributeType.NUMBER },
});



    

     //Functions 
     const getMovieByIdFn = new lambdanode.NodejsFunction(
       this,
       "GetMovieByIdFn",
       {
         architecture: lambda.Architecture.ARM_64,
         runtime: lambda.Runtime.NODEJS_18_X,
         entry: `${__dirname}/../lambdas/getMovieById.ts`,
         timeout: cdk.Duration.seconds(10),
         memorySize: 128,
         environment: {
           TABLE_NAME: moviesTable.tableName,
           REGION: 'eu-west-1',
         },
       }
     );

     const getAllMoviesFn = new lambdanode.NodejsFunction(
       this,
       "GetAllMoviesFn",
       {
         architecture: lambda.Architecture.ARM_64,
         runtime: lambda.Runtime.NODEJS_18_X,
         entry: `${__dirname}/../lambdas/getAllMovies.ts`,
         timeout: cdk.Duration.seconds(10),
         memorySize: 128,
         environment: {
           TABLE_NAME: moviesTable.tableName,
           REGION: 'eu-west-1',
         },
       }
     );

     const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
       architecture: lambda.Architecture.ARM_64,
       runtime: lambda.Runtime.NODEJS_16_X,
       entry: `${__dirname}/../lambdas/addMovie.ts`,
       timeout: cdk.Duration.seconds(10),
       memorySize: 128,
       environment: {
         TABLE_NAME: moviesTable.tableName,
         REGION: "eu-west-1",
       },
     });

     const deleteMovieByIdFn = new lambdanode.NodejsFunction(
       this,
       "DeleteMovieByIdFn",
       {
         architecture: lambda.Architecture.ARM_64,
         runtime: lambda.Runtime.NODEJS_18_X,
         entry: `${__dirname}/../lambdas/deleteMovieById.ts`,
         timeout: cdk.Duration.seconds(10),
         memorySize: 128,
         environment: {
           TABLE_NAME: moviesTable.tableName,
           REGION: 'eu-west-1',
         },
       }
     );

     const getMovieCastMembersFn = new lambdanode.NodejsFunction(
       this,
       "GetCastMemberFn",
       {
         architecture: lambda.Architecture.ARM_64,
         runtime: lambda.Runtime.NODEJS_16_X,
         entry: `${__dirname}/../lambdas/getMovieCastMember.ts`,
         timeout: cdk.Duration.seconds(10),
         memorySize: 128,
         environment: {
           TABLE_NAME: movieCastsTable.tableName,
           REGION: "eu-west-1",
         },
       }
     );

     const addMovieReviewFn = new lambdanode.NodejsFunction(this, "AddReviewFn", {
       architecture: lambda.Architecture.ARM_64,
       runtime: lambda.Runtime.NODEJS_16_X,
       entry: `${__dirname}/../lambdas/addReview.ts`,
       timeout: cdk.Duration.seconds(10),
       memorySize: 128,
       environment: {
         TABLE_NAME: movieReviewsTable.tableName,
         REGION: "eu-west-1",
       },
     });


     const getMovieReviewByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieReviewByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieReviewById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [moviesTable.tableName]: generateBatch(movies),
            [movieCastsTable.tableName]: generateBatch(movieCasts),
            [movieReviewsTable.tableName]: generateBatch(movieReviews)
            // Added
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn, movieCastsTable.tableArn, movieReviewsTable.tableArn],  // Includes movie cast
      }),
    });

      //Permissions 
      moviesTable.grantReadData(getMovieByIdFn)
      moviesTable.grantReadData(getAllMoviesFn)
      moviesTable.grantReadWriteData(newMovieFn)
      moviesTable.grantReadWriteData(deleteMovieByIdFn)
      movieCastsTable.grantReadData(getMovieCastMembersFn);
      movieReviewsTable.grantReadWriteData(addMovieReviewFn);
      movieReviewsTable.grantReadData(getMovieReviewByIdFn);







       //REST API 
      const api = new apig.RestApi(this, "RestAPI", {
        description: "demo api",
        deployOptions: {
          stageName: "dev",
        },
        defaultCorsPreflightOptions: {
          allowHeaders: ["Content-Type", "X-Amz-Date"],
          allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
          allowCredentials: true,
          allowOrigins: ["*"],
        },
      });

      const moviesEndpoint = api.root.addResource("movies");
      moviesEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
      );

      const movieEndpoint = moviesEndpoint.addResource("{movieId}");
      movieEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
      );

      moviesEndpoint.addMethod(
        "POST",
        new apig.LambdaIntegration(newMovieFn, { proxy: true })
      );

      movieEndpoint.addMethod(
        "DELETE",
        new apig.LambdaIntegration(deleteMovieByIdFn, { proxy: true })
      );

      const movieCastEndpoint = moviesEndpoint.addResource("cast");
      movieCastEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieCastMembersFn, { proxy: true })
      );

      const movieReviewsEndpoint = moviesEndpoint.addResource("reviews");
      movieReviewsEndpoint.addMethod(
        "POST",
        new apig.LambdaIntegration(addMovieReviewFn, { proxy: true })
      );

      const movieReviewsByIdEndpoint = movieEndpoint.addResource("reviews");
      movieReviewsByIdEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieReviewByIdFn, { proxy: true })
      );
      
      

  }
}
