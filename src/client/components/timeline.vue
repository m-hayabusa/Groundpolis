<template>
<XNotes ref="tl" :pagination="pagination" @before="$emit('before')" @after="e => $emit('after', e)" @queue="$emit('queue', $event)"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNotes from './notes.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XNotes
	},

	provide() {
		return {
			inChannel: this.src === 'channel'
		};
	},

	props: {
		src: {
			type: String,
			required: true
		},
		list: {
			type: String,
			required: false
		},
		antenna: {
			type: String,
			required: false
		},
		channel: {
			type: String,
			required: false
		},
		sound: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	emits: ['note', 'queue', 'before', 'after'],

	data() {
		return {
			connection: null,
			connection2: null,
			pagination: null,
			baseQuery: {
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			},
			query: {},
		};
	},

	created() {
		const prepend = note => {
			(this.$refs.tl as any).prepend(note);

			this.$emit('note');

			if (this.sound) {
				os.sound(note.userId === this.$store.state.i.id ? 'noteMy' : 'note');
			}
		};

		const onUserAdded = () => {
			(this.$refs.tl as any).reload();
		};

		const onUserRemoved = () => {
			(this.$refs.tl as any).reload();
		};

		const onChangeFollowing = () => {
			if (!this.$refs.tl.backed) {
				this.$refs.tl.reload();
			}
		};

		let endpoint;

		if (this.src == 'antenna') {
			endpoint = 'antennas/notes';
			this.query = {
				antennaId: this.antenna
			};
			this.connection = os.stream.connectToChannel('antenna', {
				antennaId: this.antenna
			});
			this.connection.on('note', prepend);
		} else if (this.src == 'home') {
			endpoint = 'notes/timeline';
			this.connection = os.stream.useSharedConnection('homeTimeline');
			this.connection.on('note', prepend);

			this.connection2 = os.stream.useSharedConnection('main');
			this.connection2.on('follow', onChangeFollowing);
			this.connection2.on('unfollow', onChangeFollowing);
		} else if (this.src == 'local') {
			const [ ep, con ] = this.$store.state.settings.injectUnlistedNoteInLTL
				? [ 'notes/local-hybrid-timeline', 'localHybridTimeline' ]
				: [ 'notes/local-timeline', 'localTimeline' ];
			endpoint = ep;
			this.connection = os.stream.useSharedConnection(con);
			this.connection.on('note', prepend);
		} else if (this.src == 'social') {
			endpoint = 'notes/hybrid-timeline';
			this.connection = os.stream.useSharedConnection('hybridTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'global') {
			endpoint = 'notes/global-timeline';
			this.connection = os.stream.useSharedConnection('globalTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'cat') {
			endpoint = 'notes/cat-timeline';
			this.connection = os.stream.useSharedConnection('catTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'remoteFollowing') {
			endpoint = 'notes/timeline';
			this.query = { remoteOnly: true };
			this.connection = os.stream.useSharedConnection('remoteFollowingTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'followers') {
			endpoint = 'notes/followers-timeline';
			this.connection = os.stream.useSharedConnection('followersTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'mentions') {
			endpoint = 'notes/mentions';
		} else if (this.src == 'direct') {
			endpoint = 'notes/mentions';
			this.query = { visibility: 'specified' };
		} else if (this.src == 'list') {
			endpoint = 'notes/user-list-timeline';
			this.query = {
				listId: this.list
			};
			this.connection = os.stream.connectToChannel('userList', {
				listId: this.list
			});
			this.connection.on('note', prepend);
			this.connection.on('userAdded', onUserAdded);
			this.connection.on('userRemoved', onUserRemoved);
		} else if (this.src == 'channel') {
			endpoint = 'channels/timeline';
			this.query = {
				channelId: this.channel
			};
			this.connection = os.stream.connectToChannel('channel', {
				channelId: this.channel
			});
			this.connection.on('note', prepend);
		}

		this.pagination = {
			endpoint: endpoint,
			limit: 10,
			params: init => ({
				untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				...this.baseQuery, ...this.query,
			})
		};
	},

	beforeUnmount() {
		if (this.connection) this.connection.dispose();
		if (this.connection2) this.connection2.dispose();
	},

	methods: {
		focus() {
			this.$refs.tl.focus();
		}
	}
});
</script>
