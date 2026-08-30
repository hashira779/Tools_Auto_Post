<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '@n8n/composables/useToast';
import { useUsersStore } from '@n8n/stores/users.store';
import { useSettingsStore } from '@n8n/stores/settings.store';
import { VIEWS } from '@/app/constants';

const usersStore = useUsersStore();
const settingsStore = useSettingsStore();
const toast = useToast();
const router = useRouter();
const route = useRoute();

const loading = ref(false);

const isRedirectSafe = () => {
    let redirect = '';
	if (typeof route.query?.redirect === 'string') {
		redirect = decodeURIComponent(route.query?.redirect);
	}
	if (redirect.startsWith('/')) return true;
	try {
		return new URL(redirect).origin === window.location.origin;
	} catch {
		return false;
	}
};

onMounted(() => {
    // @ts-ignore
	window.handleGoogleSignIn = async (response: any) => {
		try {
			loading.value = true;
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);

			await usersStore.loginWithCreds({
                emailOrLdapLoginId: payload.email,
                password: 'CamTechAutomations123!'
            });
            
			await settingsStore.getSettings();
			toast.clearAllStickyNotifications();

			if (isRedirectSafe()) {
                let redirect = '';
                if (typeof route.query?.redirect === 'string') {
                    redirect = decodeURIComponent(route.query?.redirect);
                }
				if (redirect.startsWith('http')) {
					window.location.href = redirect;
					return;
				}
				void router.push(redirect);
				return;
			}
			await router.push({ name: VIEWS.HOMEPAGE });
		} catch (error) {
			toast.showError(error, 'Login failed');
		} finally {
			loading.value = false;
		}
	};
    
    // @ts-ignore
    if (window.google) {
        // @ts-ignore
        window.google.accounts.id.initialize({
            // @ts-ignore
            client_id: window.N8N_GOOGLE_CLIENT_ID || 'MISSING_CLIENT_ID',
            // @ts-ignore
            callback: window.handleGoogleSignIn
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(
            document.getElementById("google-button-container"),
            { theme: "outline", size: "large", width: 300 }
        );
    }
});
</script>

<template>
	<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #1f2937;">
        <h1 style="color: #3b82f6; margin-bottom: 30px; font-size: 28px; font-weight: 900;">CAMTECH AUTOMATIONS</h1>
        <div v-if="loading" style="color: white; margin-bottom: 20px;">Logging in securely...</div>
        <div id="google-button-container"></div>
	</div>
</template>
