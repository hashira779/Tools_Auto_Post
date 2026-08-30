<script setup lang="ts">
import { computed, useCssModule } from 'vue';

const props = defineProps<{
	size?: 'large' | 'small';
	collapsed?: boolean;
	releaseChannel?: string;
}>();

const { size } = props;

const showLogoText = computed(() => {
	if (size === 'large') return true;
	return !props.collapsed;
});

const $style = useCssModule();
const containerClasses = computed(() => {
	if (size === 'large') {
		return [$style.logoContainer, $style.large];
	}
	return [
		$style.logoContainer,
		$style.sidebar,
		props.collapsed ? $style.sidebarCollapsed : $style.sidebarExpanded,
	];
});
</script>

<template>
	<div :class="containerClasses" data-test-id="n8n-logo">
		<div class="camtech-logo" v-if="!collapsed">
			<span style="color: #FF6D5A; font-weight: 900; font-size: 24px; font-family: sans-serif;">CAM</span><span style="color: white; font-weight: 900; font-size: 24px; font-family: sans-serif;">TECH</span>
		</div>
		<div class="camtech-logo" v-else>
			<span style="color: #FF6D5A; font-weight: 900; font-size: 24px; font-family: sans-serif;">C</span><span style="color: white; font-weight: 900; font-size: 24px; font-family: sans-serif;">T</span>
		</div>
		<slot />
	</div>
</template>

<style lang="scss" module>
.logoContainer {
	display: flex;
	justify-content: center;
	align-items: center;
}

.large {
	transform: scale(1.5);
	margin-bottom: var(--spacing--xl);
}

.sidebarExpanded {
	padding-left: var(--spacing--2xs);
}

.sidebarCollapsed {
	width: 40px;
	height: 30px;
	padding: 0 var(--spacing--4xs);
}
</style>
