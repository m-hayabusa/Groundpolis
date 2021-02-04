import $ from 'cafy';
import define from '../../define';
import { Instances } from '../../../../models';
import { toPuny } from '../../../../misc/convert-host';

export const meta = {
	tags: ['federation'],

	requireCredential: false as const,

	params: {
		host: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, me) => {
	const instance = await Instances
		.findOne({ host: toPuny(ps.host) });
	
	if (instance && instance.softwareName === 'misskey' && instance.softwareVersion && instance.softwareVersion.includes('-gp-')) { 
		instance.softwareName = 'groundpolis';
	}

	return instance;
});
