function selectRole(role) {
    switch(role) {
        case 'consumer':
            window.location.href = '/consumer-app/';
            break;
        case 'store':
            window.location.href = '/store-app/';
            break;
        case 'delivery':
            window.location.href = '/delivery-app/';
            break;
        default:
            console.log('Rol no válido');
    }
}
