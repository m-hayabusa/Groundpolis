import parseAcct from '../misc/acct/parse';
import resolveUser from '../remote/resolve-user';
import * as debug from 'debug';

debug.enable('*');

async function main(acct: string): Promise<any> {
	const { username, host } = parseAcct(acct);
	await resolveUser(username, host, {}, true);
}

// get args
const args = process.argv.slice(2);
let acct = args[0];

// normalize args
acct = acct.replace(/^@/, '');

// check args
if (!acct.match(/^\w+@\w/)) {
	throw `Invalied acct format. Valied format are user@host`;
}

console.log(`resync ${acct}`);

main(acct).then(() => {
	console.log('success');
	process.exit(0);
}).catch(e => {
	console.warn(e);
	process.exit(1);
});
