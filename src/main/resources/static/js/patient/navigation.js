export function initNavigation() {
    const buttons = [...document.querySelectorAll('.nav-btn')];
    const tabs = [...document.querySelectorAll('.tab-content')];
    buttons.forEach(button => button.addEventListener('click', () => {
        buttons.forEach(item => item.classList.toggle('active', item === button));
        tabs.forEach(tab => tab.classList.toggle('active', tab.id === button.dataset.target));
    }));
}
