// inicia los elementos relacionados a los temas
export function initThemeEvents(){
    // selecciona todos los hijos del documento que sean de clase '.theme-opt'
    // por cada elemento (el) seleccionado itera, agregándole el evento 'click'
    // el evento llama llama a setTheme(theme), al que le pasa como argumento el parámetro .dataset.theme, que en la etiqueta es data-theme="dark"
    document.querySelectorAll('.theme-opt').forEach(el => {
        el.addEventListener('click', () => {
            setTheme(el.dataset.theme, el.innerText);
        });
    });
    // selecciona el elemento de id 'theme-selector-btn' y le agrega el evento 'click'
    // el evento selecciona el elemento'theme-opts' del documento y alterna su visibilidad
    document.getElementById('theme-selector-btn')
        .addEventListener('click', () => {
            document.getElementById('theme-opts').classList.toggle('show');
        });
    // agrega un evento click al documento
    // cuando ocurre, si el objetivo más cercano al evento NO es la lista de temas, se oculta
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-selector')) {
            document.getElementById('theme-opts').classList.remove('show');
        }
    });

    
}

// recibe un string con la indicación del tema modifica el 'data-theme' del body, luego oculta las opciones de tema ('theme-opts')
export function setTheme(theme, txt) {
    document.body.setAttribute('data-theme', theme);
    document.getElementById('theme-opts').classList.remove('show');
    document.getElementById('theme-selector-btn').innerText = `Tema: ${txt} ▾`;
}