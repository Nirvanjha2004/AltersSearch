/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base':      'var(--bg-base)',
        'card-bg':      'var(--card-bg)',
        'accent':       'var(--accent)',
        'glow-accent':  'var(--glow-accent)',
        'text-primary': 'var(--text-primary)',
        'text-muted':   'var(--text-muted)',
        'border-token': 'var(--border)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
