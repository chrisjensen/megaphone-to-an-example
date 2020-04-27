# Example Megaphone to Action Network

This is an example cloud function for receiving opted-in signatures from Megaphone
and adding them as people records to Action Network.

It currently does not work, but has a test suite that should pass when it's working.

# Structure

* index.js - Defines the cloud function
* index.test.js - Defines the tests for the function (using [MochaJS](https://mochajs.org/))
* .env.EXAMPLE - Defines example settings for environment variables, copy it to a file called `.env` to run the tests

# Getting it Working

To finish it you will need node installed locally.

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy example environment variables to .env (`cp .env.EXAMPLE .env`)
3. Run the test to see what's broken `npm test`
4. Finish the function to turn the tests green!

# Deploy
The cloud function is made to be deployed on Google Cloud Platform

(It could probably also be deployed on Digital Ocean or AWS but may need some
modification to do so)

To deploy
1. Create an account with Google Cloud
2. Create a new Cloud Function
3. Choose inline editor and paste the code accordingly
4. Expand environment variables and add WEBHOOK_SECRET and ACTION_NETWORK_KEY

That's it, you should be good to go!
