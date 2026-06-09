<script lang="ts">
  import { onMount } from 'svelte';
  import { settingsStore } from '$lib/stores/settings';
  import { shortcutsStore } from '$lib/stores/shortcuts';
  import '../app.css';

  function applyTheme(isDarkMode: boolean) {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.remove('light');
    } else {
      html.classList.add('light');
    }
    html.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }

  function hideAppLoader() {
    const loader = document.getElementById('app-loader');
    if (!loader) return;
    loader.classList.add('is-hidden');
    // Remove from the DOM after the fade so it never traps screen-reader focus.
    setTimeout(() => loader.remove(), 400);
  }

  onMount(() => {
    settingsStore.init();
    shortcutsStore.init();
    const unsubscribe = settingsStore.subscribe(settings => {
      applyTheme(settings.isDarkMode);
    });

    // Wait one paint after mount so Monaco / Tailwind styles are applied
    // before we reveal the app — otherwise users see a brief flash of
    // unstyled content while the bundle finishes wiring up.
    requestAnimationFrame(() => requestAnimationFrame(hideAppLoader));

    return () => unsubscribe();
  });
</script>

<div class="h-full w-full bg-(--bg-base)">
  <slot />
</div>
