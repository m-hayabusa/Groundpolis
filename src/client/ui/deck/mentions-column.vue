<template>
<XColumn :column="column" :is-stacked="isStacked" :menu="menu">
	<template #header><Fa :icon="faAt" style="margin-right: 8px;"/>{{ column.name }}</template>

	<XNotes :pagination="pagination" @before="before()" @after="after()"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faAt } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XColumn from './column.vue';
import XNotes from '@/components/notes.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XColumn,
		XNotes
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			menu: null,
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
			},
			faAt
		}
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		}
	}
});
</script>
