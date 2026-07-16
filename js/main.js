document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('change', function() {
            const type = this.checked ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }

    const nascimentoInput = document.getElementById('nascimento');
    if (nascimentoInput) {
        nascimentoInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, ''); 
            val = val.substring(0, 8); 
            
            let formatted = '';
            if (val.length > 0) {
                formatted += val.substring(0, 2);
            }
            if (val.length > 2) {
                formatted += '/' + val.substring(2, 4);
            }
            if (val.length > 4) {
                formatted += '/' + val.substring(4, 8);
            }
            
            e.target.value = formatted;
        });
    }

    const contatoInput = document.getElementById('contato');
    if (contatoInput) {
        contatoInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, ''); 
            val = val.substring(0, 11); 
            
            let formatted = '';
            if (val.length > 0) {
                formatted = '(' + val.substring(0, 2);
            }
            if (val.length > 2) {
                if (val.length === 11) {
                    formatted += ')-' + val.substring(2, 7) + '-' + val.substring(7, 11);
                } else {
                    let nextPart = val.substring(2, 6);
                    let lastPart = val.substring(6, 10);
                    formatted += ')-' + nextPart;
                    if (val.length > 6) {
                        formatted += '-' + lastPart;
                    }
                }
            }
            
            e.target.value = formatted;
        });
    }
});
