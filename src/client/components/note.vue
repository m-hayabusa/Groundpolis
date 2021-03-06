<template>
<div
	class="note _panel"
	v-if="!muted"
	v-show="!isDeleted"
	:tabindex="!isDeleted ? '-1' : null"
	:class="{ renote: isRenote, compact: isCompactMode }"
	v-hotkey="keymap"
	v-size="{ max: [500, 450, 350, 300] }"
>
	<XSub v-for="note in conversation" class="reply-to-more" :key="note.id" :note="note"/>
	<XSub :note="appearNote.reply" class="reply-to" v-if="appearNote.reply"/>
	<div class="info" v-if="pinned"><Fa :icon="faThumbtack"/> {{ $t('pinnedNote') }}</div>
	<div class="info" v-if="appearNote._prId_"><Fa :icon="faBullhorn"/> {{ $t('promotion') }}<button class="_textButton hide" @click="readPromo()">{{ $t('hideThisNote') }} <Fa :icon="faTimes"/></button></div>
	<div class="info" v-if="appearNote._featuredId_"><Fa :icon="faBolt"/> {{ $t('featured') }}</div>
	<div class="renote" v-if="isRenote">
		<MkAvatar class="avatar" :user="note.user"/>
		<Fa :icon="faRetweet"/>
		<MkA class="name" :to="userPage(note.user)" v-user-preview="note.userId">
			<i18n-t keypath="renotedBy" tag="span">
				<template #user><MkUserName :user="note.user"/></template>
			</i18n-t>
		</MkA>

		<div class="info">
			<button class="_button time" @click="showRenoteMenu()" ref="renoteTime">
				<Fa class="dropdownIcon" v-if="isMyRenote" :icon="faEllipsisV"/>
				<MkTime :time="note.createdAt"/>
			</button>
			<span class="visibility" v-if="note.visibility !== 'public'">
				<Fa v-if="note.visibility === 'home'" :icon="faHome"/>
				<Fa v-if="note.visibility === 'followers'" :icon="faLock"/>
				<Fa v-if="note.visibility === 'specified'" :icon="faEnvelope"/>
				<Fa v-if="note.visibility === 'users'" :icon="faUsers"/>
			</span>
			<span class="localOnly" v-if="note.localOnly"><Fa :icon="faBiohazard"/></span>
			<span class="localOnly" v-if="note.remoteFollowersOnly"><Fa :icon="faHeartbeat"/></span>
		</div>
	</div>
	<article class="article" @contextmenu="onContextmenu">
		<MkAvatar class="avatar" :user="appearNote.user"/>
		<div class="main">
			<XNoteHeader class="header" :note="appearNote" :mini="true" :detail="detail"/>
			<div v-if="showTicker && !appearNote.user.host" class="instance-ticker misskey">
				<img src="/favicon.ico" alt="favicon" class="favicon"/>
				<span v-text="meta.name && meta.name !== host ? `${meta.name} (${host})` : host"/>
			</div>
			<div v-else-if="showTicker && instance" class="instance-ticker" :class="instance.softwareName">
				<img :src="instance.iconUrl" alt="favicon" class="favicon"/>
				<span v-text="instance.name && instance.name !== instance.host ? `${instance.name} (${instance.host})` : instance.host"/>
			</div>
			<div class="body">
				<p v-if="appearNote.cw != null" class="cw">
					<Mfm v-if="appearNote.cw != '' && !isPlainMode" class="text" :text="appearNote.cw" :author="appearNote.user" :i="$store.state.i" :custom-emojis="appearNote.emojis" :no-sticker="true"/>
					<span v-else-if="appearNote.cw != ''" class="text" v-text="appearNote.cw"/>
					<XCwButton v-model:value="showContent" :note="appearNote"/>
				</p>
				<div class="content" v-show="appearNote.cw == null || showContent">
					<div class="text" ref="text" :class="{ collapse: readMore === false }">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $t('private') }})</span>
						<MkA class="reply" v-if="appearNote.replyId" :to="`/notes/${appearNote.replyId}`"><Fa :icon="faReply"/></MkA>
						<Mfm v-if="appearNote.text && !isPlainMode" :text="appearNote.text" :author="appearNote.user" :i="$store.state.i" :custom-emojis="appearNote.emojis"/>
						<span v-else-if="appearNote.text" v-text="appearNote.text"/>
					</div>
					<button v-if="readMore !== null" class="read-more-button _button _link" @click="readMore = !readMore" v-text="$t(readMore ? 'hide' : 'readMore')"/>
					<div class="files" v-if="appearNote.files.length > 0">
						<XMediaList :media-list="appearNote.files"/>
					</div>
					<XPoll v-if="appearNote.poll" :note="appearNote" ref="pollViewer" class="poll"/>
					<MkUrlPreview v-for="url in urls" :url="url" :key="url" :compact="true" :detail="detail" class="url-preview"/>
					<div class="renote" v-if="appearNote.renote"><XNotePreview :note="appearNote.renote"/></div>
				</div>
				<MkA v-if="appearNote.channel && !inChannel" class="channel" :to="`/channels/${appearNote.channel.id}`"><Fa :icon="faSatelliteDish"/> {{ appearNote.channel.name }}</MkA>
				<div class="info" v-if="detail">
					<div class="time">
						<Fa :icon="faClock" fixed-width />
						<MkTime :time="note.createdAt" mode="detail"/>
					</div>
					<div class="renotes" v-if="renoteState">
						<MkA :to="`/notes/${appearNote.id}/renotes`">
							<i18n-t :keypath="renoteState.isQuoted && renoteState.isRenoted ? 'renoteQuoteCount' : renoteState.isQuoted ? 'quoteCount' : 'renoteCount'" tag="span">
								<template #count><strong v-text="appearNote.renoteCount" /></template>
							</i18n-t>
						</MkA>
					</div>
				</div>
			</div>
			<footer class="footer">
				<XReactionsViewer :note="appearNote" ref="reactionsViewer"/>
				<template v-if="$store.getters.isSignedIn">
					<button @click="reply()" class="button _button">
						<template v-if="appearNote.reply"><Fa :icon="faReplyAll"/></template>
						<template v-else><Fa :icon="faReply"/></template>
						<p class="count" v-if="appearNote.repliesCount > 0">{{ appearNote.repliesCount }}</p>
					</button>
					<button v-if="canRenote" @click="renote()" class="button _button" ref="renoteButton">
						<Fa :icon="faRetweet"/><p class="count" v-if="!detail && appearNote.renoteCount > 0">{{ appearNote.renoteCount }}</p>
					</button>
					<button v-else class="button _button">
						<Fa :icon="faBan"/>
					</button>
					<button v-if="appearNote.myReaction == null" class="button _button" @click="react()" ref="reactButton">
						<Fa :icon="faPlus"/>
					</button>
					<button v-if="appearNote.myReaction != null" class="button _button reacted" @click="undoReact(appearNote)" ref="reactButton">
						<Fa :icon="faMinus"/>
					</button>
					<button class="button _button" @click="menu()" ref="menuButton">
						<Fa :icon="faEllipsisV"/>
					</button>
				</template>
				<template v-else>
					<button class="button _button" @click="copyContent()">
						<Fa :icon="faCopy" fixed-width/>
					</button>
					<button class="button _button" @click="copyLink()">
						<Fa :icon="faLink" fixed-width/>
					</button>
				</template>
			</footer>
		</div>
	</article>
	<XSub v-for="note in replies" :key="note.id" :note="note" class="reply" :detail="true"/>
</div>
<div v-else class="_panel muted" @click="muted = false">
	<i18n-t keypath="userSaysSomething" tag="small">
		<template #name>
			<MkA class="name" :to="userPage(appearNote.user)" v-user-preview="appearNote.userId">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
	</i18n-t>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, markRaw } from 'vue';
import { faSatelliteDish, faFireAlt, faTimes, faBullhorn, faStar, faLink, faExternalLinkSquareAlt, faPlus, faMinus, faRetweet, faReply, faReplyAll, faHome, faLock, faEnvelope, faThumbtack, faBan, faQuoteLeft, faQuoteRight, faHeart, faEllipsisV, faUsers, faHeartbeat, faPlug, faExclamationCircle, faAlignLeft, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { faCopy, faTrashAlt, faEdit, faEye, faEyeSlash, faMehRollingEyes, faClock } from '@fortawesome/free-regular-svg-icons';
import { parse } from '../../mfm/parse';
import { sum, unique } from '../../prelude/array';
import XSub from './note.sub.vue';
import XNoteHeader from './note-header.vue';
import XNotePreview from './note-preview.vue';
import XReactionsViewer from './reactions-viewer.vue';
import XMediaList from './media-list.vue';
import XCwButton from './cw-button.vue';
import XPoll from './poll.vue';
import { pleaseLogin } from '@/scripts/please-login';
import { focusPrev, focusNext } from '@/scripts/focus';
import { url, host } from '@/config';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { checkWordMute } from '@/scripts/check-word-mute';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import { noteActions, noteViewInterruptors } from '@/store';

function markRawAll(...xs: any[]) {
	for (const x of xs) {
		markRaw(x);
	}
}

markRawAll(
	faSatelliteDish, faFireAlt, faTimes, faBullhorn, faStar, faLink, faExternalLinkSquareAlt, faPlus, faMinus, faRetweet, faReply, faReplyAll, faHome, faLock, faEnvelope, faThumbtack, faBan, faQuoteLeft, faQuoteRight, faHeart, faEllipsisV, faUsers, faHeartbeat, faPlug, faExclamationCircle, faAlignLeft,
	faCopy, faTrashAlt, faEdit, faEye, faEyeSlash, faMehRollingEyes, faClock,
);

export default defineComponent({
	components: {
		XSub,
		XNoteHeader,
		XNotePreview,
		XReactionsViewer,
		XMediaList,
		XCwButton,
		XPoll,
		MkUrlPreview: defineAsyncComponent(() => import('@/components/url-preview.vue')),
	},

	inject: {
		inChannel: {
			default: null
		},
	},
	model: {
		prop: 'note',
		event: 'updated'
	},

	props: {
		note: {
			type: Object,
			required: true
		},
		detail: {
			type: Boolean,
			required: false,
			default: false
		},
		pinned: {
			type: Boolean,
			required: false,
			default: false
		},
		preview: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	emits: ['update:note'],

	data() {
		return {
			connection: null,
			conversation: [],
			replies: [],
			showContent: false,
			isDeleted: false,
			muted: false,
			readMore: null as boolean | null,
			instance: null as {} | null,
			renoteState: null,
			isPlainMode: false,
			faEdit, faFireAlt, faTimes, faBullhorn, faPlus, faMinus, faRetweet, faReply, faReplyAll, faEllipsisV, faHome, faLock, faEnvelope, faThumbtack, faBan, faCopy, faLink, faUsers, faHeart, faQuoteLeft, faQuoteRight, faHeartbeat, faPlug, faSatelliteDish, faClock, faAlignLeft,
			host,
		};
	},

	computed: {
		rs(): string[] {
			return this.$store.state.settings.reactions;
		},
		keymap(): any {
			return this.preview ? {} : {
				'r': () => this.reply(true),
				'e|a|plus': () => this.react(true),
				'q': () => this.renote(true),
				'f|b': this.favorite,
				'delete|ctrl+d': this.del,
				'ctrl+q': this.renoteDirectly,
				'up|k|shift+tab': this.focusBefore,
				'down|j|tab': this.focusAfter,
				'esc': this.blur,
				'm|o': () => this.menu(true),
				's': this.toggleShowContent,
				'1': () => this.reactDirectly(this.rs[0]),
				'2': () => this.reactDirectly(this.rs[1]),
				'3': () => this.reactDirectly(this.rs[2]),
				'4': () => this.reactDirectly(this.rs[3]),
				'5': () => this.reactDirectly(this.rs[4]),
				'6': () => this.reactDirectly(this.rs[5]),
				'7': () => this.reactDirectly(this.rs[6]),
				'8': () => this.reactDirectly(this.rs[7]),
				'9': () => this.reactDirectly(this.rs[8]),
				'0': () => this.reactDirectly(this.rs[9]),
			};
		},

		isRenote(): boolean {
			return (this.note.renote &&
				this.note.text == null &&
				this.note.fileIds.length == 0 &&
				this.note.poll == null);
		},

		isCompactMode(): boolean {
			return this.$store.state.device.postStyle === 'compact';
		},

		appearNote(): any {
			return this.isRenote ? this.note.renote : this.note;
		},

		isMyNote(): boolean {
			return this.$store.getters.isSignedIn && (this.$store.state.i.id === this.appearNote.userId);
		},

		isPreviewOrDeleted(): boolean {
			return this.preview || this.isDeleted;
		},

		isMyRenote(): boolean {
			return this.$store.getters.isSignedIn && (this.$store.state.i.id === this.note.userId);
		},

		canRenote(): boolean {
			return ['public', 'home'].includes(this.appearNote.visibility) || this.isMyNote;
		},

		reactionsCount(): number {
			return this.appearNote.reactions
				? sum(Object.values(this.appearNote.reactions))
				: 0;
		},

		urls(): string[] {
			if (this.appearNote.text) {
				const ast = parse(this.appearNote.text);
				// TODO: 再帰的にURL要素がないか調べる
				const urls = unique(ast
					.filter(t => ((t.node.type == 'url' || t.node.type == 'link') && t.node.props.url && !t.node.props.silent))
					.map(t => t.node.props.url));

				// unique without hash
				// [ http://a/#1, http://a/#2, http://b/#3 ] => [ http://a/#1, http://b/#3 ]
				const removeHash = x => x.replace(/#[^#]*$/, '');

				return urls.reduce((array, url) => {
					const removed = removeHash(url);
					if (!array.map(x => removeHash(x)).includes(removed)) array.push(url);
					return array;
				}, []);
			} else {
				return null;
			}
		},

		showTicker() {
			const mode = this.$store.state.device.instanceTicker;
			return mode === 'always' || (mode === 'remote' && this.appearNote.user.host);
		},

		meta() {
			return this.$store.state.instance.meta;
		},
	},

	async created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = os.stream;
		}

		// plugin
		if (noteViewInterruptors.length > 0) {
			let result = this.note;
			for (const interruptor of noteViewInterruptors) {
				result = await interruptor.handler(JSON.parse(JSON.stringify(result)));
			}
			this.$emit('update:note', Object.freeze(result));
		}

		this.muted = await checkWordMute(this.appearNote, this.$store.state.i, this.$store.state.settings.mutedWords);

		if (this.detail) {
			if (this.appearNote.renoteCount > 0) {
				this.renoteState = await os.api('notes/is-renoted', {
					noteId: this.appearNote.id,
				});
			}
			
			os.api('notes/children', {
				noteId: this.appearNote.id,
				limit: 30
			}).then(replies => {
				this.replies = replies;
			});

			if (this.appearNote.replyId) {
				os.api('notes/conversation', {
					noteId: this.appearNote.replyId
				}).then(conversation => {
					this.conversation = conversation.reverse();
				});
			}
		} else if (this.$store.state.device.collapseLongNote) {
			const textElement = this.$refs.text as HTMLElement | null;
			if (textElement) {
				const h = textElement.getBoundingClientRect().height;
				if (h > 192) {
					this.readMore = false;
				}
			}
			
		}
	},

	async mounted() {
		this.capture(true);

		if (this.$store.getters.isSignedIn) {
			this.connection.on('_connected_', this.onStreamConnected);
		}

		if (this.showTicker)
			this.instance = await os.getInstance(this.appearNote.user.host);
	},

	beforeUnmount() {
		this.decapture(true);

		if (this.$store.getters.isSignedIn) {
			this.connection.off('_connected_', this.onStreamConnected);
		}
	},

	methods: {
		updateAppearNote(v) {
			this.$emit('update:note', Object.freeze(this.isRenote ? {
				...this.note,
				renote: {
					...this.note.renote,
					...v
				}
			} : {
				...this.note,
				...v
			}));
		},

		readPromo() {
			os.api('promo/read', {
				noteId: this.appearNote.id
			});
			this.isDeleted = true;
		},

		capture(withHandler = false) {
			if (this.$store.getters.isSignedIn) {
				this.connection.send(document.body.contains(this.$el) ? 'sn' : 's', { id: this.appearNote.id });
				if (withHandler) this.connection.on('noteUpdated', this.onStreamNoteUpdated);
			}
		},

		decapture(withHandler = false) {
			if (this.$store.getters.isSignedIn) {
				this.connection.send('un', {
					id: this.appearNote.id
				});
				if (withHandler) this.connection.off('noteUpdated', this.onStreamNoteUpdated);
			}
		},

		onStreamConnected() {
			this.capture();
		},

		onStreamNoteUpdated(data) {
			const { type, id, body } = data;

			if (id !== this.appearNote.id) return;

			switch (type) {
				case 'reacted': {
					const reaction = body.reaction;

					// DeepではなくShallowコピーであることに注意。n.reactions[reaction] = hogeとかしないように(親からもらったデータをミューテートすることになるので)
					let n = {
						...this.appearNote,
					};

					if (body.emoji) {
						const emojis = this.appearNote.emojis || [];
						if (!emojis.includes(body.emoji)) {
							n.emojis = [...emojis, body.emoji];
						}
					}

					// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
					const currentCount = (this.appearNote.reactions || {})[reaction] || 0;

					// Increment the count
					n.reactions = {
						...this.appearNote.reactions,
						[reaction]: currentCount + 1
					};

					if (body.userId === this.$store.state.i.id) {
						n.myReaction = reaction;
					}

					this.updateAppearNote(n);
					break;
				}

				case 'unreacted': {
					const reaction = body.reaction;

					// DeepではなくShallowコピーであることに注意。n.reactions[reaction] = hogeとかしないように(親からもらったデータをミューテートすることになるので)
					let n = {
						...this.appearNote,
					};

					// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
					const currentCount = (this.appearNote.reactions || {})[reaction] || 0;

					// Decrement the count
					n.reactions = {
						...this.appearNote.reactions,
						[reaction]: Math.max(0, currentCount - 1)
					};

					if (body.userId === this.$store.state.i.id) {
						n.myReaction = null;
					}

					this.updateAppearNote(n);
					break;
				}

				case 'pollVoted': {
					const choice = body.choice;

					// DeepではなくShallowコピーであることに注意。n.reactions[reaction] = hogeとかしないように(親からもらったデータをミューテートすることになるので)
					let n = {
						...this.appearNote,
					};

					const choices = [...this.appearNote.poll.choices];
					choices[choice] = {
						...choices[choice],
						votes: choices[choice].votes + 1,
						...(body.userId === this.$store.state.i.id ? {
							isVoted: true
						} : {})
					};

					n.poll = {
						...this.appearNote.poll,
						choices: choices
					};

					this.updateAppearNote(n);
					break;
				}

				case 'deleted': {
					this.isDeleted = true;
					break;
				}
			}
		},

		reply(viaKeyboard = false) {
			if (this.preview) return;
			pleaseLogin();
			os.post({
				reply: this.appearNote,
				channel: this.appearNote.channel,
				animation: !viaKeyboard,
			}, () => {
				this.focus();
			});
		},

		renote(viaKeyboard = false) {
			const renote = async () => {
				const canceled = this.$store.state.device.showRenoteConfirm && (await os.dialog({
					type: 'question',
					text: this.$t('renoteConfirm'),
					showCancelButton: true
				})).canceled;
				if (canceled) return;

				await os.api('notes/create', {
					renoteId: this.appearNote.id
				});
			};
			const quote = () => {
				os.post({
					channel: this.appearNote.channel,
					renote: this.appearNote,
				});
			};

			const choose = () => {
				os.modalMenu([{
					text: this.$t('renote'),
					icon: faRetweet,
					action: renote,
				}, {
					text: this.$t('quote'),
					icon: faQuoteRight,
					action: quote,
				}], this.$refs.renoteButton, {
					viaKeyboard
				});
			};

			if (this.preview) return;
			pleaseLogin();
			this.blur();
			switch (this.$store.state.settings.renoteButtonMode) {
				case 'choose': choose(); break;
				case 'renote': renote(); break;
				case 'quote': quote(); break;
				case 'renoteQuote': renote(); quote(); break;
			}
			
		},

		renoteDirectly() {
			if (this.preview) return;
			os.api('notes/create', {
				renoteId: this.appearNote.id
			});
		},

		async react(viaKeyboard = false) {
			if (this.preview) return;
			pleaseLogin();
			this.blur();
			const { reaction } = await os.reactionPicker({
				reactions: this.splited,
				showFocus: viaKeyboard,
				src: this.$refs.reactButton,
			});

			if (reaction) {
				os.api('notes/reactions/create', {
					noteId: this.appearNote.id,
					reaction
				});
			}
			this.focus();
		},

		reactDirectly(reaction: string) {
			if (this.preview) return;
			os.api('notes/reactions/create', {
				noteId: this.appearNote.id,
				reaction
			});
		},

		undoReact(note) {
			if (this.preview) return;
			const oldReaction = note.myReaction;
			if (!oldReaction) return;
			os.api('notes/reactions/delete', {
				noteId: note.id
			});
		},

		favorite() {
			pleaseLogin();
			os.apiWithDialog('notes/favorites/create', {
				noteId: this.appearNote.id
			});
		},

		async del() {
			const canceled = this.$store.state.device.showNoteDeleteConfirm && (await os.dialog({
				type: 'warning',
				text: this.$t('noteDeleteConfirm'),
				showCancelButton: true
			})).canceled;
			if (canceled) return;
			os.api('notes/delete', {
				noteId: this.appearNote.id
			});
		},

		async delEdit() {
			const canceled = this.$store.state.device.showDeleteAndEditConfirm && (await os.dialog({
				type: 'warning',
				text: this.$t('deleteAndEditConfirm'),
				showCancelButton: true
			})).canceled;

			if (canceled) return;
			os.api('notes/delete', {
				noteId: this.appearNote.id
			});

			os.post({ initialNote: this.appearNote, renote: this.appearNote.renote, reply: this.appearNote.reply, channel: this.appearNote.channel });
		},

		toggleFavorite(favorite: boolean) {
			os.apiWithDialog(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
				noteId: this.appearNote.id
			});
		},

		toggleWatch(watch: boolean) {
			os.apiWithDialog(watch ? 'notes/watching/create' : 'notes/watching/delete', {
				noteId: this.appearNote.id
			});
		},

		getMenu() {
			let menu;
			if (this.$store.getters.isSignedIn) {
				const statePromise = os.api('notes/state', {
					noteId: this.appearNote.id
				});

				menu = [{
					icon: faCopy,
					text: this.$t('copyContent'),
					action: this.copyContent
				}, {
					icon: faLink,
					text: this.$t('copyLink'),
					action: this.copyLink
				}, (this.appearNote.url || this.appearNote.uri) ? {
					icon: faExternalLinkSquareAlt,
					text: this.$t('showOnRemote'),
					action: () => {
						window.open(this.appearNote.url || this.appearNote.uri, '_blank');
					}
				} : undefined,
				null,
				statePromise.then(state => state.isFavorited ? {
					icon: faStar,
					text: this.$t('unfavorite'),
					action: () => this.toggleFavorite(false)
				} : {
					icon: faStar,
					text: this.$t('favorite'),
					action: () => this.toggleFavorite(true)
				}),
				{
					icon: faPaperclip,
					text: this.$t('clip'),
					action: () => this.clip()
				},
				(this.appearNote.userId != this.$store.state.i.id) ? statePromise.then(state => state.isWatching ? {
					icon: faEyeSlash,
					text: this.$t('unwatch'),
					action: () => this.toggleWatch(false)
				} : {
					icon: faEye,
					text: this.$t('watch'),
					action: () => this.toggleWatch(true)
				}) : undefined,
				this.appearNote.userId == this.$store.state.i.id ? (this.$store.state.i.pinnedNoteIds || []).includes(this.appearNote.id) ? {
					icon: faThumbtack,
					text: this.$t('unpin'),
					action: () => this.togglePin(false)
				} : {
					icon: faThumbtack,
					text: this.$t('pin'),
					action: () => this.togglePin(true)
				} : undefined,
				...(this.$store.state.i.isModerator || this.$store.state.i.isAdmin ? [
					null,
					{
						icon: faBullhorn,
						text: this.$t('promote'),
						action: this.promote
					}]
					: []
				),
				// 自分でない、パブリック, ホーム なノート 
				...(!this.isMyNote && ['public', 'home'].includes(this.appearNote.visibility) ? [
					null,
					{
						icon: faMehRollingEyes,
						text: this.$t('steal'),
						action: this.steal
					}]
					: []
				),
				...(this.appearNote.userId != this.$store.state.i.id ? [
					null,
					{
						icon: faExclamationCircle,
						text: this.$t('reportAbuse'),
						action: () => {
							const u = `${url}/notes/${this.appearNote.id}`;
							os.popup(import('@/components/abuse-report-window.vue'), {
								user: this.appearNote.user,
								initialComment: `Note: ${u}\n-----\n`
							}, {}, 'closed');
						}
					}]
					: []
				),
				{
					icon: faAlignLeft,
					text: this.$t(this.isPlainMode ? 'showAsMfm' : 'showAsPlainText'),
					action: () => this.isPlainMode = !this.isPlainMode,
				},
				...(this.appearNote.userId == this.$store.state.i.id || this.$store.state.i.isModerator || this.$store.state.i.isAdmin ? [
					null,
					this.appearNote.userId == this.$store.state.i.id ? {
						icon: faEdit,
						text: this.$t('deleteAndEdit'),
						action: this.delEdit
					} : undefined,
					{
						icon: faTrashAlt,
						text: this.$t('delete'),
						danger: true,
						action: this.del
					}]
					: []
				)]
				.filter(x => x !== undefined);
			} else {
				menu = [{
					icon: faCopy,
					text: this.$t('copyContent'),
					action: this.copyContent
				}, {
					icon: faLink,
					text: this.$t('copyLink'),
					action: this.copyLink
				}, (this.appearNote.url || this.appearNote.uri) ? {
					icon: faExternalLinkSquareAlt,
					text: this.$t('showOnRemote'),
					action: () => {
						window.open(this.appearNote.url || this.appearNote.uri, '_blank');
					}
				} : undefined]
				.filter(x => x !== undefined);
			}

			if (noteActions.length > 0) {
				menu = menu.concat([null, ...noteActions.map(action => ({
					icon: faPlug,
					text: action.title,
					action: () => {
						action.handler(this.appearNote);
					}
				}))]);
			}

			return menu;
		},

		onContextmenu(e: Event) {
			const isLink = (el: HTMLElement): boolean => {
				if (el.tagName === 'A') return true;
				if (el.parentElement) {
					return isLink(el.parentElement);
				}
				return false;
			};
			if (isLink(e.target as HTMLElement)) return;
			if (window.getSelection().toString() !== '') return;
			os.contextMenu(this.getMenu(), e).then(this.focus);
		},

		menu(viaKeyboard = false) {
			os.modalMenu(this.getMenu(), this.$refs.menuButton, {
				viaKeyboard
			}).then(this.focus);
		},

		showRenoteMenu(viaKeyboard = false) {
			if (!this.isMyRenote) return;
			os.modalMenu([{
				text: this.$t('unrenote'),
				icon: faTrashAlt,
				danger: true,
				action: async () => {
					const canceled = this.$store.state.device.showUnrenoteConfirm && (await os.dialog({
						type: 'warning',
						text: this.$t('unrenoteConfirm'),
						showCancelButton: true
					})).canceled;
					if (canceled) return;
					os.api('notes/delete', {
						noteId: this.note.id
					});
					this.isDeleted = true;
				}
			}], this.$refs.renoteTime, {
				viaKeyboard: viaKeyboard
			});
		},

		toggleShowContent() {
			this.showContent = !this.showContent;
		},

		copyContent() {
			copyToClipboard(this.appearNote.text);
			os.success();
		},

		copyLink() {
			copyToClipboard(`${url}/notes/${this.appearNote.id}`);
			os.success();
		},

		togglePin(pin: boolean) {
			os.apiWithDialog(pin ? 'i/pin' : 'i/unpin', {
				noteId: this.appearNote.id
			}, undefined, null, e => {
				if (e.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
					os.dialog({
						type: 'error',
						text: this.$t('pinLimitExceeded')
					});
				}
			});
		},

		async clip() {
			const clips = await os.api('clips/list');
			os.modalMenu([{
				icon: faPlus,
				text: this.$t('createNew'),
				action: async () => {
					const { canceled, result } = await os.form(this.$t('createNewClip'), {
						name: {
							type: 'string',
							label: this.$t('name')
						},
						description: {
							type: 'string',
							required: false,
							multiline: true,
							label: this.$t('description')
						},
						isPublic: {
							type: 'boolean',
							label: this.$t('public'),
							default: false
						}
					});
					if (canceled) return;

					const clip = await os.apiWithDialog('clips/create', result);

					os.apiWithDialog('clips/add-note', { clipId: clip.id, noteId: this.appearNote.id });
				}
			}, null, ...clips.map(clip => ({
				text: clip.name,
				action: () => {
					os.apiWithDialog('clips/add-note', { clipId: clip.id, noteId: this.appearNote.id });
				}
			}))], this.$refs.menuButton, {
			}).then(this.focus);
		},

		async promote() {
			const { canceled, result: days } = await os.dialog({
				title: this.$t('numberOfDays'),
				input: { type: 'number' }
			});

			if (canceled) return;

			os.apiWithDialog('admin/promo/create', {
				noteId: this.appearNote.id,
				expiresAt: Date.now() + (86400000 * days)
			});
		},

		async steal() {
			if (!this.appearNote.text) return;

			const canceled = this.$store.state.device.showStealConfirm && (await os.dialog({
				type: 'question',
				text: this.$t('stealConfirm'),
				showCancelButton: true
			})).canceled;
			if (canceled) return;

			const rule = this.$store.state.settings.stealRule;

			if (rule === 1) {
				this.reactDirectly(this.$store.state.settings.stealReaction);
			}
			if (rule === 2) {
				this.renoteDirectly();
			}
			const u = this.appearNote.uri || this.appearNote.url || `${url}/notes/${this.appearNote.id}`;
			const text = this.appearNote.text + (rule === 3 ? '\n\n' + u : '');
			os.createNoteInstantly(text, this.appearNote.cw, this.appearNote.visibility);
		},

		focus() {
			this.$el.focus();
		},

		blur() {
			this.$el.blur();
		},

		focusBefore() {
			focusPrev(this.$el);
		},

		focusAfter() {
			focusNext(this.$el);
		},
		userPage
	}
});
</script>

<style lang="scss" scoped>

@mixin ticker($bg, $fg) {
	background: linear-gradient(90deg, $bg, transparent);
	// background: $bg;
	color: $fg;
}

.note {
	position: relative;
	transition: box-shadow 0.1s ease;
	overflow: hidden;
	contain: content;

	&.compact {
		padding: 8px;
		> .renote, > .article, > .info {
			padding: 0;
			> .avatar {
				width: 2.5em;
				height: 2.5em;
			}
		}

		> .renote {
			margin-left: 2.5em;
		}

		.article {
			.main {
				.footer > .button {
					padding: 0 8px;
				}
			}
		}

		> .renote > .avatar {
			width: 1.5em;
			height: 1.5em;
		}
		
		> .info, > .renote {
			+ .article {
				padding-top: 0;
			}
		}
	}

	&.max-width_500px {
		font-size: 0.9em;
	}

	&:not(.compact).max-width_450px {
		> .renote {
			padding: 8px 16px 0 16px;
		}

		> .article {
			padding: 14px 16px 9px;

			> .avatar {
				margin: 0 10px 8px 0;
				width: 50px;
				height: 50px;
			}
		}
	}

	&.max-width_350px {
		> .article {
			> .main {
				> .footer {
					> .button {
						&:not(:last-child) {
							margin-right: 18px;
						}
					}
				}
			}
		}
	}

	&:not(.compact).max-width_300px {
		font-size: 0.825em;

		> .article {
			> .avatar {
				width: 44px;
				height: 44px;
			}

			> .main {
				> .footer {
					> .button {
						&:not(:last-child) {
							margin-right: 12px;
						}
					}
				}
			}
		}
	}

	&:focus {
		outline: none;

		&:after {
			content: "";
			pointer-events: none;
			display: block;
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: calc(100% - 8px);
			height: calc(100% - 8px);
			border: dashed 1px var(--focus);
			border-radius: var(--radius);
			box-sizing: border-box;
		}
	}

	&:hover > .article > .main > .footer > .button {
		opacity: 1;
	}

	> .info {
		display: flex;
		align-items: center;
		padding: 16px 32px 8px 32px;
		line-height: 24px;
		font-size: 90%;
		white-space: pre;
		color: #d28a3f;

		> [data-icon] {
			margin-right: 4px;
		}

		> .hide {
			margin-left: auto;
			color: inherit;
		}
	}

	> .info + .article {
		padding-top: 8px;
	}

	> .reply-to {
		opacity: 0.7;
		padding-bottom: 0;
	}

	> .reply-to-more {
		opacity: 0.7;
	}

	> .renote {
		display: flex;
		align-items: center;
		padding: 16px 32px 8px 32px;
		line-height: 28px;
		white-space: pre;
		color: var(--renote);

		> .avatar {
			flex-shrink: 0;
			display: inline-block;
			width: 28px;
			height: 28px;
			margin: 0 8px 0 0;
			border-radius: 6px;
		}

		> [data-icon] {
			margin-right: 4px;
		}


		> .name {
			font-weight: bold;

			> span {
				overflow: hidden;
				flex-shrink: 1;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}


		> .info {
			margin-left: auto;
			font-size: 0.9em;

			> .time {
				flex-shrink: 0;
				color: inherit;

				> .dropdownIcon {
					margin-right: 4px;
				}
			}

			> .visibility {
				margin-left: 8px;
			}

			> .localOnly {
				margin-left: 8px;
			}
		}
	}

	> .renote + .article {
		padding-top: 8px;
	}

	> .article {
		display: flex;
		padding: 28px 32px 18px;

		> .avatar {
			flex-shrink: 0;
			display: block;
			//position: sticky;
			//top: 72px;
			margin: 0 14px 8px 0;
			width: 58px;
			height: 58px;
		}

		> .main {
			flex: 1;
			min-width: 0;

			> .instance-ticker {
				display: flex;
				@include ticker(var(--bg), var(--fg));
				width: 100%;
				margin-bottom: 8px;
				align-items: center;
				padding: 1px 8px;
				font-size: 0.8em;
				font-weight: bold;
				border-radius: 4px 0 0 4px;

				&.misskey {
					@include ticker(rgb(134, 179, 0), rgb(242, 242, 242));
				}

				&.mastodon {
					@include ticker(#2b90d9, #fff);
				}

				&.pleroma {
					@include ticker(#10181e, #ffaf6d);
				}

				> .favicon {
					display: inline-block;
					height: 1em;
					margin-right: 4px;
				}
			}

			> .body {
				> .cw {
					cursor: default;
					display: block;
					margin: 0;
					padding: 0;
					overflow-wrap: break-word;

					> .text {
						margin-right: 8px;
					}
				}

				> .content {
					> .text {
						overflow-wrap: break-word;

						&.collapse {
							display: block;
							overflow: hidden;
							height: 192px;
							position: relative;
							&::after {
								content: '';
								position: absolute;
								left: 0;
								top: 0;
								right: 0;
								bottom: 0;
								background: linear-gradient(to bottom, transparent 50%, var(--panel) 100%);
							}
						}

						> .reply {
							color: var(--accent);
							margin-right: 0.5em;
						}

						> .rp {
							margin-left: 4px;
							color: var(--renote);
						}
					}

					> .read-more-button {
						display: block;
						margin: 16px 0;
					}

					> .url-preview {
						margin-top: 8px;
					}

					> .poll {
						font-size: 80%;
					}

					> .renote {
						margin-left: 16px;
						padding: 8px 0;

						> * {
							padding: 16px;
							border: solid 1px var(--renote);
							border-radius: 3px;
						}
					}
				}

				> .channel {
						opacity: 0.7;
						font-size: 90%;
				}

				> .info {
						margin: 8px 0;
					> .time, .visibility {
						opacity: 0.7;
						font-size: 90%;
					}

					> .visibility > .desc {
						margin-left: 4px;
					}

					> .renotes {
						margin: 8px 0;
						> a {
							text-decoration: underline;
						}
					}
				}
			}

			> .footer {
				> .button {
					margin: 0;
					padding: 8px;
					opacity: 0.7;

					&:not(:last-child) {
						margin-right: 28px;
					}

					&:hover {
						color: var(--fgHighlighted);
					}

					> .count {
						display: inline;
						margin: 0 0 0 8px;
						opacity: 0.7;
					}

					&.reacted {
						color: var(--accent);
					}
				}
			}
		}
	}

	> .reply {
		border-top: solid 1px var(--divider);
	}

	&.max-width_500px {
		font-size: 0.9em;
	}

	&:not(.compact).max-width_450px {
		> .renote {
			padding: 8px 16px 0 16px;
		}

		> .info {
			padding: 8px 16px 0 16px;
		}

		> .article {
			padding: 14px 16px 9px;

			> .avatar {
				margin: 0 10px 8px 0;
				width: 50px;
				height: 50px;
			}
		}
	}

	&.max-width_350px {
		> .article {
			> .main {
				> .footer {
					> .button {
						&:not(:last-child) {
							margin-right: 18px;
						}
					}
				}
			}
		}
	}

	&.max-width_300px {
		> .article {
			> .main {
				> .footer {
					> .button {
						&:not(:last-child) {
							margin-right: 12px;
						}
					}
				}
			}
		}
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}
</style>
