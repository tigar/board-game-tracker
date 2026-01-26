<script lang="ts">
const { children } = $props();
</script>

<div class="app">
	<header>
		<h1>Board Game Tracker</h1>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<p>Offline-first board game tracking</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #f5f5f5;
		color: #333;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background: #1a1a1a;
		color: white;
		padding: 1rem 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	main {
		flex: 1;
		padding: 2rem;
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
	}

	footer {
		background: #1a1a1a;
		color: #888;
		padding: 1rem 2rem;
		text-align: center;
		font-size: 0.875rem;
	}

	footer p {
		margin: 0;
	}
</style>
