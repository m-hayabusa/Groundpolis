<template>
<div class="_section">
	<XSearch v-model:value="query" @search="search"/>
	<MkTab v-if="!meta.disableFeatured" v-model:value="tab" style="height: 100%">
		<option value="explore"><Fa :icon="faHashtag"/> {{$t('explore')}}</option>
		<option value="featured"><Fa :icon="faFireAlt"/> {{$t('featured')}}</option>
	</MkTab>
	<template v-if="tab === 'explore'">
		<MkFolder :body-togglable="true" :expanded="false" ref="tags" class="_vMargin">
			<template #header><Fa :icon="faHashtag" fixed-width style="margin-right: 0.5em;"/>{{ $t('popularTags') }}</template>
			<div class="vxjfqztj">
				<MkA v-for="tag in tagsLocal" :to="`/search?q=${encodeURIComponent('#' + tag.tag)}`" :key="'local:' + tag.tag" class="local">{{ tag.tag }}</MkA>
				<MkA v-for="tag in tagsRemote" :to="`/search?q=${encodeURIComponent('#' + tag.tag)}`" :key="'remote:' + tag.tag">{{ tag.tag }}</MkA>
			</div>
		</MkFolder>

		<div class="localfedi7 _panel _vMargin" v-if="meta && stats && tag == null" :style="{ backgroundImage: meta.bannerUrl ? `url(${meta.bannerUrl})` : null }">
			<header><span>{{ $t('explore', { host: meta.name || 'Groundpolis' }) }}</span></header>
			<div><span>{{ $t('exploreUsersCount', { count: num(stats.originalUsersCount) }) }}</span></div>
		</div>

		<template v-if="tag == null">
			<MkFolder class="_vMargin" persist-key="explore-pinned-users">
				<template #header><Fa :icon="faBookmark" fixed-width style="margin-right: 0.5em;"/>{{ $t('pinnedUsers') }}</template>
				<XUserList :pagination="pinnedUsers"/>
			</MkFolder>
			<MkFolder class="_vMargin" persist-key="explore-popular-users">
				<template #header><Fa :icon="faChartLine" fixed-width style="margin-right: 0.5em;"/>{{ $t('popularUsers') }}</template>
				<XUserList :pagination="popularUsers"/>
			</MkFolder>
			<MkFolder class="_vMargin" persist-key="explore-recently-updated-users">
				<template #header><Fa :icon="faCommentAlt" fixed-width style="margin-right: 0.5em;"/>{{ $t('recentlyUpdatedUsers') }}</template>
				<XUserList :pagination="recentlyUpdatedUsers"/>
			</MkFolder>
			<MkFolder class="_vMargin" persist-key="explore-recently-registered-users">
				<template #header><Fa :icon="faPlus" fixed-width style="margin-right: 0.5em;"/>{{ $t('recentlyRegisteredUsers') }}</template>
				<XUserList :pagination="recentlyRegisteredUsers"/>
			</MkFolder>
		</template>
		<div class="localfedi7 _panel _vMargin" v-if="tag == null" :style="{ backgroundImage: `url(/assets/fedi.jpg)` }">
			<header><span>{{ $t('exploreFediverse') }}</span></header>
		</div>

		<MkFolder v-if="tag != null" :key="`${tag}`" class="_vMargin">
			<template #header><Fa :icon="faHashtag" fixed-width style="margin-right: 0.5em;"/>{{ tag }}</template>
			<XUserList :pagination="tagUsers"/>
		</MkFolder>

		<template v-if="tag == null">
			<MkFolder class="_vMargin">
				<template #header><Fa :icon="faChartLine" fixed-width style="margin-right: 0.5em;"/>{{ $t('popularUsers') }}</template>
				<XUserList :pagination="popularUsersF"/>
			</MkFolder>
			<MkFolder class="_vMargin">
				<template #header><Fa :icon="faCommentAlt" fixed-width style="margin-right: 0.5em;"/>{{ $t('recentlyUpdatedUsers') }}</template>
				<XUserList :pagination="recentlyUpdatedUsersF"/>
			</MkFolder>
			<MkFolder class="_vMargin">
				<template #header><Fa :icon="faRocket" fixed-width style="margin-right: 0.5em;"/>{{ $t('recentlyDiscoveredUsers') }}</template>
				<XUserList :pagination="recentlyRegisteredUsersF"/>
			</MkFolder>
		</template>
	</template>

	<template v-if="tab === 'featured'">
		<XNotes ref="notes" :pagination="featuredPagination" @before="before" @after="after"/>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { faChartLine, faPlus, faHashtag, faRocket, faFireAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import { faBookmark, faCommentAlt } from '@fortawesome/free-regular-svg-icons';
import XUserList from '@/components/user-list.vue';
import XSearch from '../components/search.vue';
import XNotes from '../components/notes.vue';
import MkFolder from '@/components/ui/folder.vue';
import MkTab from '../components/tab.vue';
import number from '@/filters/number';
import Progress from '@/scripts/loading';
import * as os from '@/os';

export default defineComponent({
	components: {
		XUserList,
		XNotes,
		XSearch,
		MkTab,
		MkFolder,
	},

	props: {
		tag: {
			type: String,
			required: false
		},
		mode: {
			type: String as PropType<'featured' | 'explore'>,
			required: false
		},
	},

	data() {
		return {
			INFO: {
				title: this.$t('explore'),
				icon: faHashtag
			},
			pinnedUsers: { endpoint: 'pinned-users' },
			popularUsers: { endpoint: 'users', limit: 10, noPaging: true, params: {
				state: 'alive',
				origin: 'local',
				sort: '+follower',
			} },
			recentlyUpdatedUsers: { endpoint: 'users', limit: 10, noPaging: true, params: {
				origin: 'local',
				sort: '+updatedAt',
			} },
			recentlyRegisteredUsers: { endpoint: 'users', limit: 10, noPaging: true, params: {
				origin: 'local',
				state: 'alive',
				sort: '+createdAt',
			} },
			popularUsersF: { endpoint: 'users', limit: 10, noPaging: true, params: {
				state: 'alive',
				origin: 'remote',
				sort: '+follower',
			} },
			recentlyUpdatedUsersF: { endpoint: 'users', limit: 10, noPaging: true, params: {
				origin: 'combined',
				sort: '+updatedAt',
			} },
			recentlyRegisteredUsersF: { endpoint: 'users', limit: 10, noPaging: true, params: {
				origin: 'combined',
				sort: '+createdAt',
			} },
			featuredPagination: {
				endpoint: 'notes/featured',
				limit: 10,
				offsetMode: true
			},
			tagsLocal: [],
			tagsRemote: [],
			stats: null,
			num: number,
			tab: this.mode,
			query: '',
			faBookmark, faChartLine, faCommentAlt, faPlus, faHashtag, faRocket, faFireAlt, faSearch,
		};
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
		tagUsers(): any {
			return {
				endpoint: 'hashtags/users',
				limit: 30,
				params: {
					tag: this.tag,
					origin: 'combined',
					sort: '+follower',
				}
			};
		},
	},

	watch: {
		tag() {
			if (this.$refs.tags) this.$refs.tags.toggleContent(this.tag == null);
		}
	},

	created() {
		os.api('hashtags/list', {
			sort: '+attachedLocalUsers',
			attachedToLocalUserOnly: true,
			limit: 30
		}).then(tags => {
			this.tagsLocal = tags;
		});
		os.api('hashtags/list', {
			sort: '+attachedRemoteUsers',
			attachedToRemoteUserOnly: true,
			limit: 30
		}).then(tags => {
			this.tagsRemote = tags;
		});
		os.api('stats').then(stats => {
			this.stats = stats;
		});
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		},

		search() {
			this.$router.push({
				path: '/search',
				query: { q: this.query },
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.localfedi7 {
	color: #fff;
	padding: 16px;
	height: 80px;
	background-position: 50%;
	background-size: cover;
	margin: var(--margin) 0;

	> * {
		&:not(:last-child) {
			margin-bottom: 8px;
		}

		> span {
			display: inline-block;
			padding: 6px 8px;
			background: rgba(0, 0, 0, 0.7);
		}
	}

	> header {
		font-size: 20px;
		font-weight: bold;
	}

	> div {
		font-size: 14px;
		opacity: 0.8;
	}
}

.vxjfqztj {
	> * {
		margin-right: 16px;

		&.local {
			font-weight: bold;
		}
	}
}
</style>
