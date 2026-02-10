import { h } from '../utils.js';

/**
 * Create search bar component
 * @param {string} value
 * @param {(value: string) => void} onChange
 * @returns {HTMLElement}
 */
export function SearchBar(value, onChange) {
	const container = h('div', { className: 'relative mb-5' });

	const input = h('input', {
		type: 'text',
		className:
			'w-full py-3.5 px-4 pr-10 border-2 border-slate-200 rounded-xl text-base bg-white focus:outline-none focus:border-primary-500 transition-colors',
		placeholder: 'Search plays...',
		value,
		oninput: (e) => onChange(e.target.value),
	});

	container.appendChild(input);

	if (value) {
		const clearBtn = h(
			'button',
			{
				className:
					'absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-200 rounded-full text-xl text-slate-500 flex items-center justify-center hover:bg-slate-300 transition-colors',
				onclick: () => {
					onChange('');
					input.value = '';
				},
			},
			'×'
		);
		container.appendChild(clearBtn);
	}

	return container;
}
