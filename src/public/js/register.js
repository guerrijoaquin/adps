'use strict';

const form = document.getElementById('form');
const input_username = document.getElementById('username');
const input_password = document.getElementById('password');
const button = document.getElementById('button');
const loadingBar = document.getElementById('loading-bar');
const error_text = document.getElementById('error-text');

button.addEventListener('click', async event => {

    event.preventDefault();

    const username = input_username.value;
    const password = input_password.value;

    form.classList.toggle('invisible');
    loadingBar.classList.toggle('invisible');
    error_text.classList.add('invisible');

    if (username.length > 0 && password.length > 0) 

        if (username.length <= 20 && password.length <= 20)

            if (!username.includes(' ')) await Register(username, password);

            else error('El usuario no puede tener espacios');

        else error('El usuario y/o la contraseña no pueden tener más de 20 caracteres');

    else error("El usuario y/o la contraseña no pueden quedar vacios");

});

async function Register(username, password) {

    const params = {username: username, password: password};

    const response = await fetch("/register", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    
    const status = response.status;

    if (status == 200) {
        location.href = "login?registered=true";
    } else {
        const text = await response.text();
        error(text);
    }
    
}

function error(msg) {

    form.classList.toggle('invisible');
    loadingBar.classList.toggle('invisible');
    error_text.classList.remove('invisible');

    error_text.innerText = msg;

}