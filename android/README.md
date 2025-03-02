# Configuración de Android

## Configuración del Keystore

Para generar un APK firmado, necesitas configurar el keystore. Sigue estos pasos:

1. Copia el archivo `keystore.properties.example` a `keystore.properties`:
```bash
cp keystore.properties.example keystore.properties
```

2. Edita `keystore.properties` y configura las siguientes propiedades:
- `storePassword`: La contraseña del keystore
- `keyPassword`: La contraseña de la key
- `keyAlias`: El alias de la key (por defecto "marine-data-minder")
- `storeFile`: La ubicación del archivo keystore (por defecto "keystore/marine-data-minder.keystore")

3. Alternativamente, puedes configurar las variables de entorno:
```bash
export KEYSTORE_PASSWORD="tu_contraseña_del_keystore"
export KEY_PASSWORD="tu_contraseña_de_la_key"
```

## Generación del APK

Para generar un APK firmado:

1. Abre el proyecto en Android Studio
2. Ve a Build > Generate Signed Bundle / APK
3. Selecciona APK
4. Selecciona el keystore configurado
5. Selecciona la variante "release"
6. El APK se generará en `app/release/app-release.apk`

## Notas importantes

- Nunca subas el archivo `keystore.properties` o el keystore al control de versiones
- Guarda las credenciales del keystore en un lugar seguro
- El archivo keystore es necesario para futuras actualizaciones de la app 