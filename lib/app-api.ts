import * as apig from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movies, movieReviews } from "../seed/movies";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";


type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};
export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });



    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER }, 
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });

    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "reviewDateIx",
      sortKey: { name: "reviewDate", type: dynamodb.AttributeType.STRING },
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

    const getReviewerNameFn = new lambdanode.NodejsFunction(
      this,
      "GetReviewerNameFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getReviewerName.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const editReviewFn = new lambdanode.NodejsFunction(
      this,
      "EditReviewFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/editReview.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );


    const getReviewByYearFn = new lambdanode.NodejsFunction(
      this,
      "GetReviewByYearFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getReviewByYear.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getReviewsByReviewerNameFn = new lambdanode.NodejsFunction(
      this,
      "GetReviewsByReviewerNameFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getReviewsByReviewerName.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getReviewsTranslateFn = new lambdanode.NodejsFunction(
      this,
      "GetReviewsTranslateFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getReviewsTranslate.ts`,
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
            [movieReviewsTable.tableName]: generateBatch(movieReviews)
            // Added
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), 
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn, movieReviewsTable.tableArn],  
      }),
    });

      //Permissions 
      moviesTable.grantReadData(getMovieByIdFn)
      moviesTable.grantReadData(getAllMoviesFn)
      moviesTable.grantReadWriteData(newMovieFn)
      moviesTable.grantReadWriteData(deleteMovieByIdFn)
      movieReviewsTable.grantReadWriteData(addMovieReviewFn);
      movieReviewsTable.grantReadData(getMovieReviewByIdFn);
      movieReviewsTable.grantReadData(getMovieReviewByIdFn);
      movieReviewsTable.grantReadData(getReviewerNameFn);
      movieReviewsTable.grantReadWriteData(editReviewFn);
      movieReviewsTable.grantReadData(getReviewByYearFn)
      movieReviewsTable.grantReadData(getReviewsByReviewerNameFn)
      movieReviewsTable.grantReadData(getReviewsTranslateFn)













       //REST API 
      const appApi = new apig.RestApi(this, "AppApi", {
        description: "App RestApi",
        endpointTypes: [apig.EndpointType.REGIONAL],
        deployOptions: {
          stageName: "dev",
        },
        defaultCorsPreflightOptions: {
          allowHeaders: ["Content-Type", "X-Amz-Date"],
          allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
          allowCredentials: true,
          allowOrigins: apig.Cors.ALL_ORIGINS,
        },
      });

      const appCommonFnProps = {
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        environment: {
          USER_POOL_ID: props.userPoolId,
          CLIENT_ID: props.userPoolClientId,
          REGION: cdk.Aws.REGION,
        },
      };

      const protectedRes = appApi.root.addResource("protected");

      const publicRes = appApi.root.addResource("public");
  
      const protectedFn = new node.NodejsFunction(this, "ProtectedFn", {
        ...appCommonFnProps,
        entry: "./lambdas/protected.ts",
      });
  
      const publicFn = new node.NodejsFunction(this, "PublicFn", {
        ...appCommonFnProps,
        entry: "./lambdas/public.ts",
      });
  
      const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
        ...appCommonFnProps,
        entry: "./lambdas/auth/authorizer.ts",
      });
  
      const requestAuthorizer = new apig.RequestAuthorizer(
        this,
        "RequestAuthorizer",
        {
          identitySources: [apig.IdentitySource.header("cookie")],
          handler: authorizerFn,
          resultsCacheTtl: cdk.Duration.minutes(0),
        }
      );
  
      protectedRes.addMethod("GET", new apig.LambdaIntegration(protectedFn), {
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      });
  
      publicRes.addMethod("GET", new apig.LambdaIntegration(publicFn));
    


      //////////////////////////////////////////////////////////////////////





      const moviesEndpoint = appApi.root.addResource("movies");
      moviesEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
      );

      moviesEndpoint.addMethod(
        "POST",
        new apig.LambdaIntegration(newMovieFn, { proxy: true }),
        {
          authorizer: requestAuthorizer,
          authorizationType: apig.AuthorizationType.CUSTOM,
        }
      );




      const movieEndpoint = moviesEndpoint.addResource("{movieId}");
      movieEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
      );

      movieEndpoint.addMethod(
        "DELETE",
        new apig.LambdaIntegration(deleteMovieByIdFn, { proxy: true }),
        {
          authorizer: requestAuthorizer,
          authorizationType: apig.AuthorizationType.CUSTOM,
        }
      );



      const reviewsEndpoint = moviesEndpoint.addResource("reviews");      
      // Add methods to the reviews endpoint for POST and GET
      reviewsEndpoint.addMethod(
        "POST",
        new apig.LambdaIntegration(addMovieReviewFn, { proxy: true }),
        {
          authorizer: requestAuthorizer,
          authorizationType: apig.AuthorizationType.CUSTOM,
        }
      );



      const movieReviewsEndpoint = movieEndpoint.addResource("reviews");

      // Add a method to the movieReviewsEndpoint for GET
      movieReviewsEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieReviewByIdFn, { proxy: true })
      );


      const reviewerNameEndpoint = movieReviewsEndpoint.addResource("{reviewerName}")
      reviewerNameEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getReviewerNameFn, { proxy: true })
      );

      reviewerNameEndpoint.addMethod(
        "PUT",
        new apig.LambdaIntegration(editReviewFn, { proxy: true }),
        {
          authorizer: requestAuthorizer,
          authorizationType: apig.AuthorizationType.CUSTOM,
        }
      );

// CANT SEEM TO BE ABLE TO ASS 2 RESOURCES TO SAME ENDPOINT

    //  ///Year
    //   const yearEndpoint = movieReviewsEndpoint.addResource("{year}")
    //   yearEndpoint.addMethod(
    //     "GET",
    //     new apig.LambdaIntegration(getReviewByYearFn, { proxy: true })
    //   );


    // Create a new resource for the reviews by reviewer name endpoint at the root level
const reviewerReviewsEndpoint = appApi.root.addResource("reviews");
const reviewerNameResource = reviewerReviewsEndpoint.addResource("{reviewerName}");

// Add a method to the reviewer name resource for GET
reviewerReviewsEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getReviewsTranslateFn, { proxy: true })
);

//Translation starting from reviews/ . Will add reviewername and movieId (If this is correct)
reviewerNameResource.addMethod(
  "GET",
  new apig.LambdaIntegration(getReviewsByReviewerNameFn, { proxy: true })
);

      
      

  }
}
