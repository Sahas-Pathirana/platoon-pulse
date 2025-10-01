
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Auto-switch theme based on time of day, unless manually set
function setAutoTheme() {
	const manualTheme = localStorage.getItem('theme');
	if (manualTheme === 'dark' || manualTheme === 'light') {
		document.documentElement.classList.add(manualTheme);
		document.documentElement.classList.remove(manualTheme === 'dark' ? 'light' : 'dark');
		return;
	}
	const hour = new Date().getHours();
	const isNight = hour >= 18 || hour < 6; // 6pm-6am is night
	const root = document.documentElement;
	if (isNight) {
		root.classList.add('dark');
		root.classList.remove('light');
	} else {
		root.classList.add('light');
		root.classList.remove('dark');
	}
}
setAutoTheme();
setInterval(setAutoTheme, 60 * 60 * 1000);

createRoot(document.getElementById("root")!).render(<App />);
