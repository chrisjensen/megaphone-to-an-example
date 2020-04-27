/**
 * Test for the cloud function
 * Execute the test using `npm test` or `npx mocha index.test.js`
 * on the command line
 * The frist time you run the test you will need to copy .env.EXAMPLE to .env
 */

require('dotenv').config();
const nock = require('nock');
const chai = require('chai');
const chaiSubset = require('chai-subset');

const { integration: webhook } = require('./index');

const mocks = require('./mocks');

chai.use(chaiSubset);
const { expect } = chai;

const signature = mocks.signature();

// TODO does control shift labs support setting a shared secret for the webhooks
// if so this should be validated on reuquests to make sure fake data can't
// be added to the system
const secret = process.env.WEBHOOK_SECRET;

describe('Megaphone to Action Network Cloud Function', () => {
	let req;
	let res;
	let result;
	let nockRequest;
	describe('WHEN signature is created', () => {
		describe('WHEN opted in', () => {
			before(async () => {
				// Prevent request from going to action network and
				// save the data so we can examine it
				nockRequest = doNock('post', 'https://actionnetwork.org/api/v1', '/people');

				// Prepare a mock request to the cloud function with a
				// signature.created event
				({ req, res } = prepare({
					type: 'signature.created',
					data: signature,
				}));

				// Run the cloud function
				try {
					result = await webhook(req, res);
					return result;
				} catch (e) {
					console.error(e);
					throw e;
				}
			});
			itSucceeds();
			it('passes correct API KEY for action network', () => {
				console.log(nockRequest)
				const apiKey = nockRequest.headers['api-key'];
				if (!apiKey) throw new Error('No api key was sent with request');
				expect(apiKey).to.eq(process.env.ACTION_NETWORK_KEY)
			})
			it('adds the person to action network', () => {
				// Verify that the cloud function tried to forward the correct
				// data to Action Network
				expect(nockRequest.body).to.containSubset({
					originating_system: 'Megaphone',
					email_addresses: [{ primary: true, address: signature.email }],
					given_name: signature.first_name,
					family_name: signature.last_name,
					// Add any other attributes you want to confirm are being sent correctly
					// (eg postal address or phone number)
				});
			});
		});
		describe('WHEN opted out', () => {

			before(async () => {
				// Prevent request from going to action network and
				// save the data so we can examine it
				nockRequest = doNock('post', 'https://actionnetwork.org/api/v1', '/people');

				// Opt this signature out
				signature.email_opt_in_type.mailable = false;

				// Prepare a mock request to the cloud function with a
				// signature.created event
				({ req, res } = prepare({
					type: 'signature.created',
					data: signature,
				}));

				try {
					result = await webhook(req, res);
					return result;
				} catch (e) {
					console.error(e);
					throw e;
				}
			});
			itSucceeds();
			it('does not add the person to action network', () => {
				expect(nockRequest.body).to.be.undefined;
			});
		});
	});

	/**
	 * Verify that the cloud function returns status 200 and a body of
	 * { success: true }
	 */
	function itSucceeds() {
		it('has good result', () => {
			expect(result).to.eq(true);
		});
		it('returns success true', () => {
			expect(res.body).to.containSubset({ success: true });
		});
	}
});

/**
 * Prepare a mock request to test the cloud function with
 * @param {*} body
 */
function prepare(body) {
	const req = {
		body,
	};
	const res = {};
	res.status = (code) => {
		res.statusCode = code;
		return res.status;
	};
	res.status.send = (response) => (res.body = response);

	return { req, res };
}

/**
 * Catch requests to an external API and save the body so we can check it in the test
 * @param {string} method get, patch, post, etc
 * @param {string} path Path of the API request
 */
function doNock(method, host, path) {
	let result = {};
	const n = nock(host)
		.log(console.log)[method](path)
		.reply(200, function donate(uri, requestBody) {
			result.body = requestBody;
			result.headers = this.req.headers;
			return requestBody;
		});
	return result;
}
