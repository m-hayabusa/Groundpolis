<template>
<div class="_section">
	<section class="_card _vMargin">
		<div class="_content">
			<div>{{ $t('defaultNavigationBehaviour') }}</div>
			<MkSwitch v-model:value="deckNavWindow">{{ $t('openInWindow') }}</MkSwitch>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="deckAlwaysShowMainColumn">
				{{ $t('_deck.alwaysShowMainColumn') }}
			</MkSwitch>
		</div>
		<div class="_content">
			<MkRadios v-model="deckColumnAlign">
				<template #desc>{{ $t('_deck.columnAlign') }}</template>
				<option value="left">{{ $t('left') }}</option>
				<option value="center">{{ $t('center') }}</option>
			</MkRadios>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkRadio from '@/components/ui/radio.vue';
import MkRadios from '@/components/ui/radios.vue';

export default defineComponent({
	components: {
		MkButton,
		MkSwitch,
		MkRadio,
		MkRadios,
	},

	data() {
		return {
		}
	},

	computed: {
		deckNavWindow: {
			get() { return this.$store.state.device.deckNavWindow; },
			set(value) { this.$store.commit('device/set', { key: 'deckNavWindow', value }); }
		},

		deckAlwaysShowMainColumn: {
			get() { return this.$store.state.device.deckAlwaysShowMainColumn; },
			set(value) { this.$store.commit('device/set', { key: 'deckAlwaysShowMainColumn', value }); }
		},

		deckColumnAlign: {
			get() { return this.$store.state.device.deckColumnAlign; },
			set(value) { this.$store.commit('device/set', { key: 'deckColumnAlign', value }); }
		},
	},
});
</script>
