Serverless REST Assignment.
Name: Elizabeth Neary

This repository contains an implementation of a serverless REST API for the AWS platform. The CDK framework is used to provision its infrastructure. The API's domain context is movie reviews. With this API domain i needed to complete and implement GET, POST and PUT requests for various endpoints such as getting reviews for all movies, reviews by rating, by year, by reviewer name and updating the contents of reviews of movies. Along with implementing these endpoints authentication was also implemented to allow a user to signup , confirm sign up and signin , into the application allowing some endpoints to be protected or authenticated unless user is signed up and signed in , into application. When a cdk deploy is performed the AuthAPI Stack is present in the AWS CloudFormation console, showing the successful launch of the cdk framework. 

![AuthAPIStack successfully shows in AWS CloudFormation Console](image.png)

API endpoints.
Using the same AuthApi URL and AppApiUrl i was able to retrieveing these endpoints successfully and retririve the correct results.
![Auth and App URLs](image-3.png)

The endpoints that i was able to successfully retrieve are as follows:
POST /movies/reviews - add a movie review. Authentication added. ![POST Movie Reviews](image-4.png)
GET /movies/{movieId}/reviews - Get all the reviews for the specified movie. ![GET reviews for MovieId](image-5.png)
GET /movies/{movieId}/reviews?minRating=n - Get the reviews for the specified movie with a rating greater than the minRating. ![GET MinRating](image-6.png)
GET /movies/{movieId}/reviews/{reviewerName} - Get the review written by the named reviewer for the specified movie. ![GET ReviewerName](image-7.png)
PUT /movies/{movieId}/reviews/{reviewerName} - Update the text of a review. Authentication added. ![PUT Update Content Review](image-8.png) ![Review Updated](image-9.png)
GET /reviews/{reviewerName} - Get all the reviews written by a specific reviewer. ![GET Reviews by ReviewerName](image-10.png)




Authentication
Authentication was successfully implemented into the application and so authorization was added to the endpoints using POST and PUT requests. Other requests such as GET are not authenticated and can be accessed without authorization. When app is deployed 2 URLS are seen . One for AuthAPI containing the authentication and signin code and AppApi containing the movie review code. Using the AuthApi URL and when a user has successfully signed up and confirmed their sign up with the verification code , a token becomes available in the cookies tab in POSTMAN. This token is then used in the Header tab in POSTMAN to allow access to the unauthorized endpoints in the application such as PUT and POST requests using the AppApi URL. 

In order to be able to sign up to the application i needed to create an email identity. In the AWS Console page, in the navigation pane, under Configuration and under Verified identities I created a new identity using an email address as the identity type i wanted to use and be able to have access to receive emails from. Durin the signup process in te application when a verification code is sent it verifies the identity type or the email address used to sign up and becomes verified. When the application is deployed with Authentication applied successfully a UserPool is created in the AWS Cognito Console.
![UserPool in AWS Cognito Console](image-1.png)



When the UserPool is clicked it shows the User i used to sign up with in order to use the application is shown with a green verified indicator showing that the user i used to sign up with has been verified to use the cdk stack application. 

![User Verified Student Email Address](image-2.png)

Authentication Endpoints 
Using the same URL  https://and53ephw2.execute-api.eu-west-1.amazonaws.com/prod/ I was able to sign up and signup, confirm signup and signin into the application. Below is screenshots of the process and the responses and the Authentication endpoints being used.

Sign Up
![Sign Up](image-11.png)

Confirm SignUp
![Confirm SignUp using Verification Code](image-13.png)

Sign In 
![Sign In](image-14.png)

Protected using AppApi URL
![Protected](image-15.png)

Public using AppApi URL
![Public](image-16.png)



