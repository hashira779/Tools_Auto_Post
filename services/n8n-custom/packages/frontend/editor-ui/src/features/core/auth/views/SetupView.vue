<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@n8n/composables/useToast';
import { useSettingsStore } from '@n8n/stores/settings.store';
import { useUsersStore } from '@n8n/stores/users.store';
import { VIEWS } from '@/app/constants';

const settingsStore = useSettingsStore();
const usersStore = useUsersStore();
const toast = useToast();
const router = useRouter();

const loading = ref(false);

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

			await usersStore.createOwner({
                firstName: payload.given_name || 'CamTech',
                lastName: payload.family_name || 'User',
                email: payload.email,
                password: 'CamTechAutomations123!'
            });

			const forceRedirectedHere = settingsStore.showSetupPage;
			if (forceRedirectedHere) {
				await router.push('/');
			} else {
				await router.push({ name: VIEWS.USERS_SETTINGS });
			}
		} catch (error) {
			toast.showError(error, 'Error setting up owner via Google');
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
        <div v-if="loading" style="color: white; margin-bottom: 20px;">Setting up your account securely...</div>
        <div id="google-button-container"></div>
	</div>
</template>
