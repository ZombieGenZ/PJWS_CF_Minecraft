# cripto
Pruebas de Criptografía

para utilizar el módulo de manera regular.

> Se debe instalar como un módulo cualquiera, especificar la ruta: <ruta-completa> 

```bash
    npm install https://github.com/lbricenoyts/cripto/archive/v0.2.2.tar.gz
```

> Probamos con un texto de prueba
```javascript
    const { cripto } = require('@lbricenoyts/cripto')

    // Encriptado de texto 
    let encriptado = cripto.toCode("Texto de Prueba")
    console.log('encriptado',encriptado)
    let texto = cripto.toText(encriptado)
    console.log('desencriptado',texto)

```
