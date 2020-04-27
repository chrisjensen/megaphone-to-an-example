const request = require('request-promise-native');

/**
 * This is an example cloud function
 * You can modify this funciton and use it with Google Cloud Functions
 * to catch and process Megaphone Webhooks
 *
 */

// TODO Check if Megaphone supports some kind of shared secret to authenticate the
// webhook requests
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const ACTION_NETWORK_KEY = process.env.ACTION_NETWORK_KEY;

/**
 * Example Cloud Function that catches webhooks from Megaphone
 * for updating Action Network
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.integration = async function integration(req, res) {
	// Verify that the webhook is actually from Megaphone using the shared secret
	// TODO: Check if this is possible, otherwise remove this line
	if (!authenticate(req, res)) return true;

	const event = req.body;

	let response;

	// Detect event type and get data off the payload, delete as necessary
	if (event.type === 'signature.created') {
		// TODO Handle the event here
		response = await request({
			method: 'POST',
			url: 'https://actionnetwork.org/api/v1/people',
			headers: {
				'api-key': ACTION_NETWORK_KEY,
			},
			json: {

			},
		});
	} else {
		res.status(200).send({ success: false, error: `Unrecognised event ${event.type}` });
		return true;
	}

	res.status(200).send({ success: true, response });
	return true;
};

/**
 * Verify that the webhook came from Megaphone by checking the shared secret
 * If authentication fails, will set a 403 response. This will result in
 * megaphone disabling the webhook and leading to investigation if there is a problem with
 * the secret
 * @param {*} req
 * @param {*} res
 * @returns {boolean} true if the request is authenticated
 */
function authenticate(req, res) {
	const secret = req.body.secret;

	if (secret && secret === WEBHOOK_SECRET) return true;

	res.status(403).send({ success: false, error: 'invalid shared secret' });
	return false;
}
