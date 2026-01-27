<script lang="ts">
const { children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<meta name="theme-color" content="#6366f1" />
</svelte:head>

<div class="app">
	<header>
		<h1>Board Game Tracker</h1>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		background: #f8fafc;
		color: #1e293b;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		max-width: 100%;
		overflow-x: hidden;
	}

	header {
		background: #6366f1;
		color: white;
		padding: 16px;
		box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	header h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.025em;
	}

	main {
		flex: 1;
		padding: 16px;
		max-width: 640px;
		width: 100%;
		margin: 0 auto;
	}

	/* Desktop adjustments */
	@media (min-width: 640px) {
		header {
			padding: 20px 24px;
		}

		header h1 {
			font-size: 1.5rem;
		}

		main {
			padding: 24px;
		}
	}
</style>
