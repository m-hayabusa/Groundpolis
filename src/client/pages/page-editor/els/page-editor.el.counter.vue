<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faBolt"/> {{ $t('_pages.blocks.counter') }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkInput v-model:value="value.name"><template #prefix><Fa :icon="faMagic"/></template><span>{{ $t('_pages.blocks._counter.name') }}</span></MkInput>
		<MkInput v-model:value="value.text"><span>{{ $t('_pages.blocks._counter.text') }}</span></MkInput>
		<MkInput v-model:value="value.inc" type="number"><span>{{ $t('_pages.blocks._counter.inc') }}</span></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkInput
	},

	props: {
		value: {
			required: true
		},
	},

	data() {
		return {
			faBolt, faMagic
		};
	},

	created() {
		if (this.value.name == null) this.value.name = '';
	},
});
</script>
