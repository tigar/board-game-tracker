import { h } from '../utils.js';

/**
 * Create the primary "Log Play" button
 * @param {() => void} onClick
 * @returns {HTMLElement}
 */
export function LogPlayButton(onClick) {
	return h(
		'button',
		{
			className:
				'w-full py-4 bg-primary-500 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2 mb-5 shadow-lg shadow-primary-500/25 hover:bg-primary-600 active:scale-[0.98] transition-all',
			onclick: onClick,
		},
		h('span', { className: 'text-2xl leading-none' }, '+'),
		'Log Play'
	);
}
